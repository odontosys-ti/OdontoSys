import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';

import { ServicoLembretes } from '../src/modules/lembretes/application/servico';
import { LembreteRepository } from '../src/modules/lembretes/infra/lembrete.repository';
import type {
  EntradaTransporte,
  ITeletransporte,
  ResultadoPersistenciaLembrete,
  ResultadoTransporte,
} from '../src/modules/lembretes/domain/lembrete';
import { db, fecharDb } from '../src/platform/db';
import { agendamento, lembrete, paciente, registroAuditoria } from '../src/platform/db/schema';
import { criarUuidV7 } from '../src/platform/uuid';
import { SimuladorTransporte } from '../src/modules/lembretes/infra/transportes';
import { limparBanco, semearClinica } from './helpers';

describe('integração PostgreSQL de lembretes manuais', () => {
  afterAll(async () => {
    await fecharDb();
  });

  beforeEach(async () => {
    await limparBanco();
  });

  it('persiste FALHOU, faz retry no mesmo registro e audita as transições', async () => {
    const ids = await semearClinica();
    const agendamentoId = await criarAgendamento(ids);
    await db()
      .update(paciente)
      .set({ telefone: '5511999998888', canalPreferido: 'WHATSAPP', consentimentoAtivo: true })
      .where(eq(paciente.id, ids.pacienteId));

    const repo = new LembreteRepository();
    const falha = new ServicoLembretes(repo, {
      nome: 'provider-teste',
      async enviar() {
        return {
          status: 'FALHOU' as const,
          providerId: 'provider-secret',
          codigoFalha: 'RAW_PROVIDER_ERROR',
          mensagemFalha: 'provider response: token-secret',
        };
      },
    });
    const primeiro = await falha.solicitarManual(ids.clinicaId, ids.recepcaoId, agendamentoId);
    expect(primeiro.status).toBe('FALHOU');
    expect(primeiro.codigoFalha).toBe('FALHA_DESCONHECIDA');
    expect(primeiro.mensagemFalha).toBe('Não foi possível concluir o envio do lembrete.');

    const persistido = await db().select().from(lembrete).where(eq(lembrete.id, primeiro.id));
    expect(persistido).toHaveLength(1);
    expect(persistido[0]).toMatchObject({ status: 'FALHOU', codigoFalha: 'FALHA_DESCONHECIDA' });

    const sucesso = new ServicoLembretes(repo, new SimuladorTransporte());
    const retry = await sucesso.solicitarManual(ids.clinicaId, ids.recepcaoId, agendamentoId);
    expect(retry.id).toBe(primeiro.id);
    expect(retry.status).toBe('ENVIADO');

    const registros = await db()
      .select()
      .from(lembrete)
      .where(eq(lembrete.agendamentoId, agendamentoId));
    expect(registros).toHaveLength(1);
    const auditorias = await db()
      .select()
      .from(registroAuditoria)
      .where(
        and(
          eq(registroAuditoria.entidade, 'lembrete'),
          eq(registroAuditoria.entidadeId, primeiro.id)
        )
      );
    expect(auditorias.map((item) => item.acao)).toEqual(
      expect.arrayContaining(['CRIAR', 'EDITAR'])
    );
  });

  it('bloqueia despacho concorrente enquanto a reivindicação está ativa', async () => {
    const ids = await semearClinica();
    const agendamentoId = await criarAgendamento(ids);
    await db()
      .update(paciente)
      .set({ telefone: '5511999998888', canalPreferido: 'WHATSAPP', consentimentoAtivo: true })
      .where(eq(paciente.id, ids.pacienteId));

    let liberar: () => void = () => undefined;
    let iniciou: () => void = () => undefined;
    const transporteIniciado = new Promise<void>((resolve) => {
      iniciou = resolve;
    });
    const transporteLiberado = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    let chamadas = 0;
    const transporte: ITeletransporte = {
      nome: 'teste',
      async enviar(entrada: EntradaTransporte) {
        chamadas += 1;
        iniciou();
        await transporteLiberado;
        return {
          status: 'ENVIADO' as const,
          providerId: `provider-${entrada.idempotenciaKey}`,
          codigoFalha: null,
          mensagemFalha: null,
        };
      },
    };
    const servico = new ServicoLembretes(new LembreteRepository(), transporte);
    const primeiro = servico.solicitarManual(ids.clinicaId, ids.recepcaoId, agendamentoId);
    await transporteIniciado;
    const concorrente = servico.solicitarManual(ids.clinicaId, ids.recepcaoId, agendamentoId);
    const concorrenteDeveFalhar = expect(concorrente).rejects.toMatchObject({
      codigo: 'REGRA_NEGOCIO',
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    liberar();
    await concorrenteDeveFalhar;
    await expect(primeiro).resolves.toMatchObject({ status: 'ENVIADO' });
    expect(chamadas).toBe(1);
  });

  it('renova o lease durante transporte lento e mantém uma única chamada concorrente', async () => {
    const ids = await semearClinica();
    const agendamentoId = await criarAgendamento(ids);
    await db()
      .update(paciente)
      .set({ telefone: '5511999998888', canalPreferido: 'WHATSAPP', consentimentoAtivo: true })
      .where(eq(paciente.id, ids.pacienteId));

    let iniciou: () => void = () => undefined;
    const transporteIniciado = new Promise<void>((resolve) => {
      iniciou = resolve;
    });
    let chamadas = 0;
    const transporte: ITeletransporte = {
      nome: 'teste-lease',
      async enviar(entrada: EntradaTransporte) {
        chamadas += 1;
        iniciou();
        await new Promise((resolve) => setTimeout(resolve, 180));
        return {
          status: 'ENVIADO' as const,
          providerId: `provider-${entrada.idempotenciaKey}`,
          codigoFalha: null,
          mensagemFalha: null,
        };
      },
    };
    const servico = new ServicoLembretes(new LembreteRepository(), transporte, { leaseMs: 40 });
    const primeiro = servico.solicitarManual(ids.clinicaId, ids.recepcaoId, agendamentoId);
    await transporteIniciado;
    await new Promise((resolve) => setTimeout(resolve, 100));

    await expect(
      servico.solicitarManual(ids.clinicaId, ids.recepcaoId, agendamentoId)
    ).rejects.toMatchObject({ codigo: 'REGRA_NEGOCIO' });
    await expect(primeiro).resolves.toMatchObject({ status: 'ENVIADO' });
    expect(chamadas).toBe(1);
  });

  it('recupera uma reivindicação expirada sem deixar o registro preso', async () => {
    const ids = await semearClinica();
    const agendamentoId = await criarAgendamento(ids);
    await db()
      .update(paciente)
      .set({ telefone: '5511999998888', canalPreferido: 'WHATSAPP', consentimentoAtivo: true })
      .where(eq(paciente.id, ids.pacienteId));

    const repo = new LembreteRepository();
    await repo.reivindicar({
      clinicaId: ids.clinicaId,
      agendamentoId,
      pacienteId: ids.pacienteId,
      canal: 'WHATSAPP',
      janela: 'MANUAL',
      transporte: 'simulacao',
      solicitadoPor: ids.recepcaoId,
      idempotenciaKey: `${agendamentoId}:MANUAL:WHATSAPP`,
      leaseMs: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    const pendencias = await repo.listarPendencias(ids.clinicaId, 1, 10);
    expect(pendencias.total).toBe(1);
    expect(pendencias.itens[0]).toMatchObject({
      agendamentoId,
      status: 'FALHOU',
    });

    const recuperado = await new ServicoLembretes(repo, new SimuladorTransporte()).solicitarManual(
      ids.clinicaId,
      ids.recepcaoId,
      agendamentoId
    );
    expect(recuperado.status).toBe('ENVIADO');
    expect(recuperado.emProcessamento).toBe(false);
  });

  it('recupera com chave idempotente após sucesso do transporte e falha de finalização', async () => {
    const ids = await semearClinica();
    const agendamentoId = await criarAgendamento(ids);
    await db()
      .update(paciente)
      .set({ telefone: '5511999998888', canalPreferido: 'WHATSAPP', consentimentoAtivo: true })
      .where(eq(paciente.id, ids.pacienteId));

    const repo = new LembreteRepository();
    const finalizarReal = repo.finalizar.bind(repo);
    let falharFinalizacao = true;
    repo.finalizar = async (entrada: ResultadoPersistenciaLembrete) => {
      if (falharFinalizacao) {
        falharFinalizacao = false;
        throw new Error('falha simulada ao finalizar persistência');
      }
      return finalizarReal(entrada);
    };

    let chamadas = 0;
    let entregas = 0;
    let resultadoProvider: ResultadoTransporte | undefined;
    const transporte: ITeletransporte = {
      nome: 'provider-idempotente-teste',
      async enviar(entrada: EntradaTransporte) {
        chamadas += 1;
        if (!resultadoProvider) {
          entregas += 1;
          resultadoProvider = {
            status: 'ENVIADO',
            providerId: `provider-${entrada.idempotenciaKey}`,
            codigoFalha: null,
            mensagemFalha: null,
          };
        }
        return resultadoProvider;
      },
    };

    const servico = new ServicoLembretes(repo, transporte);
    await expect(
      servico.solicitarManual(ids.clinicaId, ids.recepcaoId, agendamentoId)
    ).rejects.toThrow('falha simulada ao finalizar persistência');
    expect(chamadas).toBe(1);

    const pendente = await db()
      .select()
      .from(lembrete)
      .where(eq(lembrete.agendamentoId, agendamentoId));
    expect(pendente[0]).toMatchObject({ emProcessamento: true });

    await expect(
      servico.solicitarManual(ids.clinicaId, ids.recepcaoId, agendamentoId)
    ).rejects.toMatchObject({ codigo: 'REGRA_NEGOCIO' });
    expect(chamadas).toBe(1);

    await db()
      .update(lembrete)
      .set({ claimExpiraEm: new Date(0) })
      .where(eq(lembrete.id, pendente[0].id));

    const recuperado = await servico.solicitarManual(ids.clinicaId, ids.recepcaoId, agendamentoId);
    expect(recuperado.status).toBe('ENVIADO');
    expect(chamadas).toBe(2);
    expect(entregas).toBe(1);

    const final = await db()
      .select()
      .from(lembrete)
      .where(eq(lembrete.agendamentoId, agendamentoId));
    expect(final).toHaveLength(1);
    expect(final[0]).toMatchObject({ status: 'ENVIADO', emProcessamento: false });
  });
});

async function criarAgendamento(ids: Awaited<ReturnType<typeof semearClinica>>): Promise<string> {
  const id = criarUuidV7();
  const inicio = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db()
    .insert(agendamento)
    .values({
      id,
      clinicaId: ids.clinicaId,
      pacienteId: ids.pacienteId,
      profissionalId: ids.profissionalId,
      procedimentoId: ids.procedimentoId,
      inicio,
      fim: new Date(inicio.getTime() + 30 * 60 * 1000),
      status: 'AGENDADO',
      criadoPor: ids.recepcaoId,
    });
  return id;
}
