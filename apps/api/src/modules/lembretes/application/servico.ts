import type { LembreteResponse } from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import {
  type ContextoEnvioLembrete,
  type ILembreteRepository,
  type ITeletransporte,
  type Lembrete,
  chaveLogicaLembrete,
  montarMensagemLembrete,
  sanitizarLembrete,
  sanitizarResultadoTransporte,
  validarElegibilidadeLembrete,
} from '../domain/lembrete';

export function serializarLembrete(item: Lembrete): LembreteResponse {
  const seguro = sanitizarLembrete(item);
  return {
    id: seguro.id,
    agendamentoId: seguro.agendamentoId,
    pacienteId: seguro.pacienteId,
    canal: seguro.canal,
    janela: seguro.janela,
    status: seguro.status,
    transporte: seguro.transporte,
    providerId: seguro.providerId,
    codigoFalha: seguro.codigoFalha,
    mensagemFalha: seguro.mensagemFalha,
    criadoEm: paraIso(seguro.criadoEm),
    atualizadoEm: paraIso(seguro.atualizadoEm),
  };
}

function resultadoFalhaSegura() {
  return sanitizarResultadoTransporte({
    status: 'FALHOU',
    providerId: null,
    codigoFalha: 'TRANSPORTE_ERRO',
    mensagemFalha: null,
  });
}

export class ServicoLembretes {
  constructor(
    private readonly repo: ILembreteRepository,
    private readonly transporte: ITeletransporte
  ) {}

  async solicitarManual(clinicaId: string, usuarioId: string, agendamentoId: string) {
    const contexto = await this.repo.obterContextoEnvio(clinicaId, agendamentoId);
    if (!contexto) throw new AppError('NAO_ENCONTRADO');

    const resultado = await this.processar(contexto, 'MANUAL', usuarioId);
    if (resultado.tipo === 'IDEMPOTENTE') return resultado.lembrete;
    if (resultado.tipo === 'EM_PROCESSAMENTO') {
      throw new AppError('REGRA_NEGOCIO', [
        { campo: 'lembrete', mensagem: 'O envio deste lembrete já está em processamento.' },
      ]);
    }
    return resultado.lembrete;
  }

  async enviarAutomatico(
    contexto: ContextoEnvioLembrete & { solicitadoPor: string },
    janela: 'VINTE_E_QUATRO_HORAS' | 'QUARENTA_E_OITO_HORAS'
  ) {
    const resultado = await this.processar(contexto, janela, contexto.solicitadoPor);
    if (resultado.tipo === 'IDEMPOTENTE') {
      return { tipo: 'DUPLICADO' as const, lembrete: resultado.lembrete };
    }
    if (resultado.tipo === 'EM_PROCESSAMENTO') {
      return { tipo: 'DUPLICADO' as const, lembrete: resultado.lembrete };
    }
    return {
      tipo: resultado.lembrete.status === 'FALHOU' ? ('FALHOU' as const) : ('ENVIADO' as const),
      lembrete: resultado.lembrete,
    };
  }

  private async processar(
    contexto: ContextoEnvioLembrete,
    janela: 'MANUAL' | 'VINTE_E_QUATRO_HORAS' | 'QUARENTA_E_OITO_HORAS',
    usuarioId: string
  ) {
    validarElegibilidadeLembrete(contexto);
    if (contexto.canalPreferido === null || contexto.telefone === null) {
      throw new AppError('REGRA_NEGOCIO');
    }
    const canalElegivel = contexto.canalPreferido;
    const telefoneElegivel = contexto.telefone;
    const idempotenciaKey = chaveLogicaLembrete(contexto.agendamentoId, janela, canalElegivel);
    const reivindicacao = await this.repo.reivindicar({
      clinicaId: contexto.clinicaId,
      agendamentoId: contexto.agendamentoId,
      pacienteId: contexto.pacienteId,
      canal: canalElegivel,
      janela,
      transporte: this.transporte.nome,
      solicitadoPor: usuarioId,
      idempotenciaKey,
    });
    if (reivindicacao.tipo === 'IDEMPOTENTE') {
      return { tipo: 'IDEMPOTENTE' as const, lembrete: reivindicacao.lembrete };
    }
    if (reivindicacao.tipo === 'EM_PROCESSAMENTO') {
      return { tipo: 'EM_PROCESSAMENTO' as const, lembrete: reivindicacao.lembrete };
    }

    const mensagem = montarMensagemLembrete({
      nomePaciente: contexto.nomePaciente,
      inicio: contexto.inicio,
      fusoHorario: contexto.fusoHorario,
    });
    let resultado;
    try {
      resultado = await this.transporte.enviar({
        idempotenciaKey: reivindicacao.idempotenciaKey,
        telefone: telefoneElegivel,
        mensagem,
        canal: canalElegivel,
      });
    } catch {
      resultado = resultadoFalhaSegura();
    }

    const persistido = await this.repo.finalizar({
      clinicaId: contexto.clinicaId,
      agendamentoId: contexto.agendamentoId,
      pacienteId: contexto.pacienteId,
      canal: canalElegivel,
      janela,
      transporte: this.transporte.nome,
      resultado,
      solicitadoPor: usuarioId,
      claimToken: reivindicacao.claimToken,
      lembreteId: reivindicacao.lembrete.id,
    });
    return { tipo: 'FINALIZADO' as const, lembrete: persistido };
  }

  async listarPendencias(clinicaId: string, pagina: number, tamanho: number) {
    return this.repo.listarPendencias(clinicaId, pagina, tamanho);
  }
}
