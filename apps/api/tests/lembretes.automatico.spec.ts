import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  selecionarContextosAutomaticos,
  type ConfiguracaoAutomacaoLembretes,
} from '../src/modules/lembretes/domain/automatico';
import { ServicoLembretesAutomaticos } from '../src/modules/lembretes/application/automatico';
import { ServicoConfiguracaoLembretes } from '../src/modules/lembretes/application/configuracao';
import { LembreteRepository } from '../src/modules/lembretes/infra/lembrete.repository';
import { ConfiguracaoClinicaRepository } from '../src/modules/lembretes/infra/configuracao.repository';
import { SimuladorTransporte } from '../src/modules/lembretes/infra/transportes';
import type { ContextoAutomaticoLembrete } from '../src/modules/lembretes/domain/lembrete';
import { db, fecharDb } from '../src/platform/db';
import { agendamento, lembrete, paciente } from '../src/platform/db/schema';
import { criarUuidV7 } from '../src/platform/uuid';
import { limparBanco, semearClinica, semearClinicaSecundaria } from './helpers';

const configuracao: ConfiguracaoAutomacaoLembretes = {
  toleranciaMinutos: 5,
  inicioOperacional: '08:00',
  fimOperacional: '18:00',
  limiteLote: 20,
};

function contexto(
  inicio: string,
  ajustes: Partial<ContextoAutomaticoLembrete> = {}
): ContextoAutomaticoLembrete {
  return {
    agendamentoId: ajustes.agendamentoId ?? criarUuidV7(),
    clinicaId: ajustes.clinicaId ?? 'clinica-1',
    pacienteId: ajustes.pacienteId ?? 'paciente-1',
    inicio: new Date(inicio),
    statusAgendamento: ajustes.statusAgendamento ?? 'AGENDADO',
    fusoHorario: ajustes.fusoHorario ?? 'America/Sao_Paulo',
    nomePaciente: 'Não deve sair no resumo',
    telefone: ajustes.telefone === undefined ? '5511999998888' : ajustes.telefone,
    canalPreferido: ajustes.canalPreferido === undefined ? 'WHATSAPP' : ajustes.canalPreferido,
    consentimentoAtivo: ajustes.consentimentoAtivo ?? true,
    solicitadoPor: ajustes.solicitadoPor ?? 'usuario-1',
  };
}

describe('seleção de lembretes automáticos', () => {
  it('seleciona as janelas de 24H e 48H somente no horário local da clínica', () => {
    const agora = new Date('2026-09-10T11:00:00.000Z');
    const resultado = selecionarContextosAutomaticos(
      [
        contexto('2026-09-11T11:00:00.000Z'),
        contexto('2026-09-12T11:00:00.000Z'),
        contexto('2026-09-11T14:00:00.000Z'),
      ],
      agora,
      configuracao
    );

    expect(resultado.map((item) => item.janela)).toEqual([
      'VINTE_E_QUATRO_HORAS',
      'QUARENTA_E_OITO_HORAS',
    ]);
  });

  it('calcula o horário operacional no fuso da clínica e respeita as bordas', () => {
    const foraAntes = selecionarContextosAutomaticos(
      [contexto('2026-09-11T11:00:00.000Z')],
      new Date('2026-09-10T10:59:59.000Z'),
      configuracao
    );
    const naAbertura = selecionarContextosAutomaticos(
      [contexto('2026-09-11T11:00:00.000Z')],
      new Date('2026-09-10T11:00:00.000Z'),
      configuracao
    );
    const noFechamento = selecionarContextosAutomaticos(
      [contexto('2026-09-11T11:00:00.000Z')],
      new Date('2026-09-10T21:00:00.000Z'),
      configuracao
    );

    expect(foraAntes).toHaveLength(0);
    expect(naAbertura).toHaveLength(1);
    expect(noFechamento).toHaveLength(0);
  });

  it.each([
    ['cancelado', { statusAgendamento: 'CANCELADO' as const }],
    ['faltou', { statusAgendamento: 'FALTOU' as const }],
    ['atendido', { statusAgendamento: 'ATENDIDO' as const }],
    ['sem consentimento', { consentimentoAtivo: false }],
    ['sem contato', { telefone: null, canalPreferido: null }],
  ])('não seleciona agendamento %s', (_descricao, ajustes) => {
    const resultado = selecionarContextosAutomaticos(
      [contexto('2026-09-11T11:00:00.000Z', ajustes)],
      new Date('2026-09-10T11:00:00.000Z'),
      configuracao
    );

    expect(resultado).toHaveLength(0);
  });

  it('não seleciona além do lote e não inclui uma clínica em outra seleção', () => {
    const resultado = selecionarContextosAutomaticos(
      [
        contexto('2026-09-11T11:00:00.000Z', { clinicaId: 'clinica-1' }),
        contexto('2026-09-11T11:00:00.000Z', { clinicaId: 'clinica-2' }),
      ],
      new Date('2026-09-10T11:00:00.000Z'),
      { ...configuracao, limiteLote: 1, clinicaId: 'clinica-2' }
    );

    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.contexto.clinicaId).toBe('clinica-2');
  });
});

describe('execução automática de lembretes', () => {
  it('é idempotente em reexecução e concorrência e produz resumo sem PII', async () => {
    const contextoElegivel = contexto('2026-09-11T11:00:00.000Z');
    let chamadas = 0;
    const repo = new RepositorioAutomaticoEmMemoria(contextoElegivel);
    const transporte = new SimuladorTransporte();
    const executar = new ServicoLembretesAutomaticos(repo, transporte, configuracao);
    const enviar = transporte.enviar.bind(transporte);
    transporte.enviar = async (entrada) => {
      chamadas += 1;
      return enviar(entrada);
    };

    const [primeiro, segundo] = await Promise.all([
      executar.executar(new Date('2026-09-10T11:00:00.000Z')),
      executar.executar(new Date('2026-09-10T11:00:00.000Z')),
    ]);
    const terceiro = await executar.executar(new Date('2026-09-10T11:00:00.000Z'));

    expect(chamadas).toBe(1);
    expect(primeiro.enviados + segundo.enviados + terceiro.enviados).toBe(1);
    expect(primeiro.duplicados + segundo.duplicados + terceiro.duplicados).toBeGreaterThan(0);
    expect(JSON.stringify({ primeiro, segundo, terceiro })).not.toContain('Não deve sair');
    expect(JSON.stringify({ primeiro, segundo, terceiro })).not.toContain('5511999998888');
  });
});

describe('execução automática PostgreSQL', () => {
  afterAll(async () => {
    await fecharDb();
  });

  beforeEach(async () => {
    await limparBanco();
  });

  it('seleciona, persiste uma vez e não duplica ao repetir a passada', async () => {
    const ids = await semearClinica();
    const agendamentoId = criarUuidV7();
    const agora = new Date('2026-09-10T11:00:00.000Z');
    const inicio = new Date('2026-09-11T11:00:00.000Z');
    await db()
      .update(paciente)
      .set({ telefone: '5511999998888', canalPreferido: 'WHATSAPP', consentimentoAtivo: true })
      .where(eq(paciente.id, ids.pacienteId));
    await db()
      .insert(agendamento)
      .values({
        id: agendamentoId,
        clinicaId: ids.clinicaId,
        pacienteId: ids.pacienteId,
        profissionalId: ids.profissionalId,
        procedimentoId: ids.procedimentoId,
        inicio,
        fim: new Date(inicio.getTime() + 30 * 60 * 1000),
        status: 'AGENDADO',
        criadoPor: ids.recepcaoId,
      });

    const servico = new ServicoLembretesAutomaticos(
      new LembreteRepository(),
      new SimuladorTransporte(),
      configuracao
    );
    const primeiro = await servico.executar(agora);
    const segundo = await servico.executar(agora);
    const registros = await db()
      .select()
      .from(lembrete)
      .where(eq(lembrete.agendamentoId, agendamentoId));

    expect(primeiro.enviados).toBe(1);
    expect(segundo.duplicados).toBe(1);
    expect(registros).toHaveLength(1);
    expect(registros[0]).toMatchObject({ janela: 'VINTE_E_QUATRO_HORAS', status: 'ENVIADO' });
  });

  it('lista e recupera claim automático expirado sem ocultar a pendência', async () => {
    const ids = await semearClinica();
    const agendamentoId = criarUuidV7();
    const agora = new Date('2026-09-10T11:00:00.000Z');
    const inicio = new Date('2026-09-11T11:00:00.000Z');
    await db()
      .update(paciente)
      .set({ telefone: '5511999998888', canalPreferido: 'WHATSAPP', consentimentoAtivo: true })
      .where(eq(paciente.id, ids.pacienteId));
    await db()
      .insert(agendamento)
      .values({
        id: agendamentoId,
        clinicaId: ids.clinicaId,
        pacienteId: ids.pacienteId,
        profissionalId: ids.profissionalId,
        procedimentoId: ids.procedimentoId,
        inicio,
        fim: new Date(inicio.getTime() + 30 * 60 * 1000),
        status: 'AGENDADO',
        criadoPor: ids.recepcaoId,
      });

    const repo = new LembreteRepository();
    await repo.reivindicar({
      clinicaId: ids.clinicaId,
      agendamentoId,
      pacienteId: ids.pacienteId,
      canal: 'WHATSAPP',
      janela: 'VINTE_E_QUATRO_HORAS',
      transporte: 'simulacao',
      solicitadoPor: ids.recepcaoId,
      idempotenciaKey: `${agendamentoId}:VINTE_E_QUATRO_HORAS:WHATSAPP`,
      leaseMs: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    const pendencias = await repo.listarPendencias(ids.clinicaId, 1, 10);
    expect(pendencias.total).toBe(1);
    expect(pendencias.itens[0]).toMatchObject({
      agendamentoId,
      status: 'FALHOU',
      emProcessamento: true,
    });

    const servico = new ServicoLembretesAutomaticos(repo, new SimuladorTransporte(), configuracao);
    const resumo = await servico.executar(agora);
    const recuperado = await db()
      .select()
      .from(lembrete)
      .where(eq(lembrete.agendamentoId, agendamentoId));

    expect(resumo.enviados).toBe(1);
    expect(recuperado[0]).toMatchObject({ status: 'ENVIADO', emProcessamento: false });
  });

  it('não vaza dados pessoais na saída operacional', async () => {
    await semearClinica();
    const servico = new ServicoLembretesAutomaticos(
      new LembreteRepository(),
      new SimuladorTransporte(),
      configuracao
    );

    const resumo = await servico.executar(new Date('2026-09-10T11:00:00.000Z'));

    expect(Object.keys(resumo).sort()).toEqual([
      'duplicados',
      'enviados',
      'falhas',
      'selecionados',
    ]);
    expect(JSON.stringify(resumo)).not.toContain('Paciente');
    expect(JSON.stringify(resumo)).not.toContain('5511');
  });

  it('lê a janela operacional persistida por clínica', async () => {
    const primeira = await semearClinica();
    const segunda = await semearClinicaSecundaria();
    const agora = new Date('2026-09-10T11:00:00.000Z');
    const inicio = new Date('2026-09-11T11:00:00.000Z');

    await db()
      .update(paciente)
      .set({ telefone: '5511999998888', canalPreferido: 'WHATSAPP', consentimentoAtivo: true })
      .where(eq(paciente.id, primeira.pacienteId));
    await db()
      .insert(agendamento)
      .values({
        id: criarUuidV7(),
        clinicaId: primeira.clinicaId,
        pacienteId: primeira.pacienteId,
        profissionalId: primeira.profissionalId,
        procedimentoId: primeira.procedimentoId,
        inicio,
        fim: new Date(inicio.getTime() + 30 * 60 * 1000),
        status: 'AGENDADO',
        criadoPor: primeira.recepcaoId,
      });
    await db()
      .update(agendamento)
      .set({ inicio, fim: new Date(inicio.getTime() + 30 * 60 * 1000) })
      .where(eq(agendamento.id, segunda.agendamentoId));

    const configuracoes = await import('../src/platform/db/schema');
    await db()
      .insert(configuracoes.configuracaoClinica)
      .values([
        {
          id: criarUuidV7(),
          clinicaId: primeira.clinicaId,
          chave: 'LEMBRETES_AUTOMATICOS',
          valor: {
            toleranciaMinutos: 5,
            inicioOperacional: '08:00',
            fimOperacional: '09:00',
            limiteLote: 20,
          },
        },
        {
          id: criarUuidV7(),
          clinicaId: segunda.clinicaId,
          chave: 'LEMBRETES_AUTOMATICOS',
          valor: {
            toleranciaMinutos: 5,
            inicioOperacional: '12:00',
            fimOperacional: '13:00',
            limiteLote: 20,
          },
        },
      ]);

    const servico = new ServicoLembretesAutomaticos(
      new LembreteRepository(),
      new SimuladorTransporte(),
      new ServicoConfiguracaoLembretes(new ConfiguracaoClinicaRepository(), configuracao)
    );

    const resumo = await servico.executar(agora);

    expect(resumo.selecionados).toBe(1);
    expect(resumo.enviados).toBe(1);
  });
});

class RepositorioAutomaticoEmMemoria {
  private lembrete: {
    id: string;
    status: 'ENVIADO' | 'FALHOU';
    emProcessamento: boolean;
  } | null = null;

  constructor(private readonly contextoElegivel: ContextoAutomaticoLembrete) {}

  async listarContextosAutomaticos() {
    return [this.contextoElegivel];
  }

  async reivindicar() {
    if (this.lembrete?.status === 'ENVIADO') {
      return { tipo: 'IDEMPOTENTE' as const, lembrete: this.lembrete };
    }
    if (this.lembrete?.emProcessamento) {
      return { tipo: 'EM_PROCESSAMENTO' as const, lembrete: this.lembrete };
    }
    this.lembrete = { id: 'lembrete-1', status: 'FALHOU', emProcessamento: true };
    return {
      tipo: 'DISPARAR' as const,
      lembrete: this.lembrete,
      claimToken: 'claim-1',
      idempotenciaKey: 'agendamento-1:VINTE_E_QUATRO_HORAS:WHATSAPP',
    };
  }

  async finalizar() {
    this.lembrete = { id: 'lembrete-1', status: 'ENVIADO', emProcessamento: false };
    return this.lembrete;
  }

  async renovarClaim() {
    return true;
  }
}
