import type { LembreteResponse } from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import {
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

    validarElegibilidadeLembrete(contexto);
    if (contexto.canalPreferido === null || contexto.telefone === null) {
      throw new AppError('REGRA_NEGOCIO');
    }
    const canalElegivel = contexto.canalPreferido;
    const telefoneElegivel = contexto.telefone;
    const idempotenciaKey = chaveLogicaLembrete(agendamentoId, 'MANUAL', canalElegivel);
    const reivindicacao = await this.repo.reivindicar({
      clinicaId,
      agendamentoId,
      pacienteId: contexto.pacienteId,
      canal: canalElegivel,
      janela: 'MANUAL',
      transporte: this.transporte.nome,
      solicitadoPor: usuarioId,
      idempotenciaKey,
    });
    if (reivindicacao.tipo === 'IDEMPOTENTE') return reivindicacao.lembrete;
    if (reivindicacao.tipo === 'EM_PROCESSAMENTO') {
      throw new AppError('REGRA_NEGOCIO', [
        { campo: 'lembrete', mensagem: 'O envio deste lembrete já está em processamento.' },
      ]);
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
      clinicaId,
      agendamentoId,
      pacienteId: contexto.pacienteId,
      canal: canalElegivel,
      janela: 'MANUAL',
      transporte: this.transporte.nome,
      resultado,
      solicitadoPor: usuarioId,
      claimToken: reivindicacao.claimToken,
      lembreteId: reivindicacao.lembrete.id,
    });
    return persistido;
  }

  async listarPendencias(clinicaId: string, pagina: number, tamanho: number) {
    return this.repo.listarPendencias(clinicaId, pagina, tamanho);
  }
}
