import { describe, expect, it } from 'vitest';

import {
  SchemaLembreteResponse,
  SchemaListaLembretes,
  type CanalMensagem,
} from '@odontosys/contracts';

import {
  type ContextoEnvioLembrete,
  type EntradaReivindicacaoLembrete,
  type ILembreteRepository,
  type Lembrete,
  type ListaLembretes,
  type ResultadoPersistenciaLembrete,
  type ReivindicacaoLembrete,
  montarMensagemLembrete,
  sanitizarResultadoTransporte,
  validarElegibilidadeLembrete,
} from '../src/modules/lembretes/domain/lembrete';
import { serializarLembrete, ServicoLembretes } from '../src/modules/lembretes/application/servico';
import { SimuladorTransporte } from '../src/modules/lembretes/infra/transportes';

describe('domínio de lembretes', () => {
  it('compõe mensagem mínima no fuso da clínica sem dados clínicos', () => {
    const mensagem = montarMensagemLembrete({
      nomePaciente: 'Ana Lima',
      inicio: new Date('2026-09-03T13:00:00.000Z'),
      fusoHorario: 'America/Sao_Paulo',
    });

    expect(mensagem).toContain('Ana Lima');
    expect(mensagem).toContain('03/09/2026');
    expect(mensagem).toContain('10:00');
    expect(mensagem).not.toContain('Profilaxia');
    expect(mensagem).not.toContain('observação clínica');
  });

  it('rejeita lembrete sem consentimento ou contato', () => {
    expect(() =>
      validarElegibilidadeLembrete({
        statusAgendamento: 'AGENDADO',
        consentimentoAtivo: false,
        telefone: null,
        canalPreferido: null,
      })
    ).toThrow();

    expect(() =>
      validarElegibilidadeLembrete({
        statusAgendamento: 'AGENDADO',
        consentimentoAtivo: true,
        telefone: null,
        canalPreferido: 'WHATSAPP',
      })
    ).toThrow();
  });

  it('rejeita agendamento cancelado', () => {
    expect(() =>
      validarElegibilidadeLembrete({
        statusAgendamento: 'CANCELADO',
        consentimentoAtivo: true,
        telefone: '5511999998888',
        canalPreferido: 'SMS',
      })
    ).toThrow();
  });

  it.each(['FALTOU', 'ATENDIDO'] as const)('rejeita agendamento terminal %s', (status) => {
    expect(() =>
      validarElegibilidadeLembrete({
        statusAgendamento: status,
        consentimentoAtivo: true,
        telefone: '5511999998888',
        canalPreferido: 'SMS',
      })
    ).toThrow();
  });

  it('simulador retorna resultado determinístico', async () => {
    const transporte = new SimuladorTransporte();
    const entrada = {
      idempotenciaKey: 'agendamento-1:MANUAL:WHATSAPP',
      telefone: '5511999998888',
      mensagem: 'Lembrete de consulta.',
      canal: 'WHATSAPP' as CanalMensagem,
    };

    await expect(transporte.enviar(entrada)).resolves.toEqual({
      status: 'ENVIADO',
      providerId: 'simulacao-agendamento-1-MANUAL-WHATSAPP',
      codigoFalha: null,
      mensagemFalha: null,
    });
    await expect(transporte.enviar(entrada)).resolves.toEqual(await transporte.enviar(entrada));
  });

  it('normaliza código e mensagem de falha antes de expor o resultado', () => {
    expect(
      sanitizarResultadoTransporte({
        status: 'FALHOU',
        providerId: 'provider-secret',
        codigoFalha: 'RESPOSTA_BRUTA_DO_PROVIDER',
        mensagemFalha: 'token=secret; stack trace; telefone=5511999998888',
      })
    ).toEqual({
      status: 'FALHOU',
      providerId: null,
      codigoFalha: 'FALHA_DESCONHECIDA',
      mensagemFalha: 'Não foi possível concluir o envio do lembrete.',
    });
  });

  it.each(['toString', '__proto__', {}, Object.create(null)])(
    'usa somente códigos próprios da whitelist para entrada insegura: %s',
    (codigoFalha) => {
      const resultado = sanitizarResultadoTransporte({
        status: 'FALHOU',
        providerId: null,
        codigoFalha: codigoFalha as string,
        mensagemFalha: { toString: () => 'mensagem bruta' } as unknown as string,
      });

      expect(resultado.codigoFalha).toBe('FALHA_DESCONHECIDA');
      expect(resultado.mensagemFalha).toBe('Não foi possível concluir o envio do lembrete.');
      expect(typeof resultado.codigoFalha).toBe('string');
      expect(typeof resultado.mensagemFalha).toBe('string');
    }
  );

  it('serializa falha legada sem expor texto arbitrário', () => {
    const resposta = serializarLembrete({
      id: 'lembrete-1',
      clinicaId: 'clinica-1',
      agendamentoId: 'agendamento-1',
      pacienteId: 'paciente-1',
      canal: 'WHATSAPP',
      janela: 'MANUAL',
      status: 'FALHOU',
      transporte: 'whatsapp',
      providerId: 'secret-provider-id',
      codigoFalha: 'RAW_PROVIDER_ERROR',
      mensagemFalha: 'Authorization: Bearer secret-token',
      emProcessamento: false,
      claimToken: null,
      claimExpiraEm: null,
      solicitadoPor: 'usuario-1',
      criadoEm: new Date('2026-09-03T10:00:00.000Z'),
      atualizadoEm: new Date('2026-09-03T10:00:00.000Z'),
    });

    expect(resposta).toMatchObject({
      status: 'FALHOU',
      providerId: null,
      codigoFalha: 'FALHA_DESCONHECIDA',
      mensagemFalha: 'Não foi possível concluir o envio do lembrete.',
    });
    expect(JSON.stringify(resposta)).not.toContain('secret-token');
  });

  it('persiste falha do transporte e permite retry sem duplicar o registro lógico', async () => {
    const repositorio = new RepositorioEmMemoria();
    const falha = new ServicoLembretes(repositorio, new SimuladorTransporte(true));

    const primeiro = await falha.solicitarManual('clinica-1', 'usuario-1', 'agendamento-1');
    expect(primeiro.status).toBe('FALHOU');
    expect(repositorio.persistencias).toBe(1);

    const retry = new ServicoLembretes(repositorio, new SimuladorTransporte());
    const segundo = await retry.solicitarManual('clinica-1', 'usuario-1', 'agendamento-1');
    expect(segundo.id).toBe(primeiro.id);
    expect(segundo.status).toBe('ENVIADO');
    expect(repositorio.persistencias).toBe(2);
  });

  it('contratos validam resposta individual e envelope paginado', () => {
    const lembrete = {
      id: '01900000-0000-7000-8000-000000000001',
      agendamentoId: '01900000-0000-7000-8000-000000000002',
      pacienteId: '01900000-0000-7000-8000-000000000003',
      canal: 'WHATSAPP',
      janela: 'MANUAL',
      status: 'ENVIADO',
      transporte: 'simulacao',
      providerId: null,
      codigoFalha: null,
      mensagemFalha: null,
      criadoEm: '2026-09-03T10:00:00.000Z',
      atualizadoEm: '2026-09-03T10:00:00.000Z',
    };

    expect(SchemaLembreteResponse.parse(lembrete)).toEqual(lembrete);
    expect(
      SchemaListaLembretes.parse({
        dados: [lembrete],
        paginacao: { pagina: 1, tamanho: 10, total: 1 },
      }).dados
    ).toHaveLength(1);
  });
});

class RepositorioEmMemoria implements ILembreteRepository {
  readonly contexto: ContextoEnvioLembrete = {
    agendamentoId: 'agendamento-1',
    clinicaId: 'clinica-1',
    pacienteId: 'paciente-1',
    inicio: new Date('2026-09-03T13:00:00.000Z'),
    statusAgendamento: 'AGENDADO',
    fusoHorario: 'America/Sao_Paulo',
    nomePaciente: 'Ana Lima',
    telefone: '5511999998888',
    canalPreferido: 'WHATSAPP',
    consentimentoAtivo: true,
  };
  lembrete: Lembrete | null = null;
  persistencias = 0;

  async obterContextoEnvio(): Promise<ContextoEnvioLembrete> {
    return this.contexto;
  }

  async reivindicar(entrada: EntradaReivindicacaoLembrete): Promise<ReivindicacaoLembrete> {
    if (this.lembrete?.status === 'ENVIADO') {
      return { tipo: 'IDEMPOTENTE', lembrete: this.lembrete };
    }
    const claimToken = 'claim-1';
    this.lembrete = {
      id: this.lembrete?.id ?? 'lembrete-1',
      clinicaId: entrada.clinicaId,
      agendamentoId: entrada.agendamentoId,
      pacienteId: entrada.pacienteId,
      canal: entrada.canal,
      janela: entrada.janela,
      status: this.lembrete?.status ?? 'FALHOU',
      transporte: entrada.transporte,
      providerId: this.lembrete?.providerId ?? null,
      codigoFalha: this.lembrete?.codigoFalha ?? null,
      mensagemFalha: this.lembrete?.mensagemFalha ?? null,
      emProcessamento: true,
      claimToken,
      claimExpiraEm: new Date(Date.now() + 30_000),
      solicitadoPor: entrada.solicitadoPor,
      criadoEm: this.lembrete?.criadoEm ?? new Date(),
      atualizadoEm: new Date(),
    };
    return {
      tipo: 'DISPARAR',
      lembrete: this.lembrete,
      claimToken,
      idempotenciaKey: entrada.idempotenciaKey,
    };
  }

  async finalizar(entrada: ResultadoPersistenciaLembrete): Promise<Lembrete> {
    this.persistencias += 1;
    const agora = new Date('2026-09-03T10:00:00.000Z');
    this.lembrete = {
      id: this.lembrete?.id ?? 'lembrete-1',
      clinicaId: entrada.clinicaId,
      agendamentoId: entrada.agendamentoId,
      pacienteId: entrada.pacienteId,
      canal: entrada.canal,
      janela: entrada.janela,
      status: entrada.resultado.status,
      transporte: entrada.transporte,
      providerId: entrada.resultado.providerId,
      codigoFalha: entrada.resultado.codigoFalha,
      mensagemFalha: entrada.resultado.mensagemFalha,
      emProcessamento: false,
      claimToken: null,
      claimExpiraEm: null,
      solicitadoPor: entrada.solicitadoPor,
      criadoEm: this.lembrete?.criadoEm ?? agora,
      atualizadoEm: agora,
    };
    return this.lembrete;
  }

  async renovarClaim(): Promise<boolean> {
    return true;
  }

  async listarPendencias(): Promise<ListaLembretes> {
    const itens = this.lembrete?.status === 'FALHOU' ? [this.lembrete] : [];
    return { itens, total: itens.length };
  }
}
