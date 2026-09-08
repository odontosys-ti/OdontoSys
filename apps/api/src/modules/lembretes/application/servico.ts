import type { LembreteResponse } from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import {
  type ILembreteRepository,
  type ITeletransporte,
  type Lembrete,
  chaveLogicaLembrete,
  montarMensagemLembrete,
  validarElegibilidadeLembrete,
} from '../domain/lembrete';
import { LembreteRepository } from '../infra/lembrete.repository';
import { criarTransporteLembrete } from '../infra/transportes';

export function serializarLembrete(item: Lembrete): LembreteResponse {
  return {
    id: item.id,
    agendamentoId: item.agendamentoId,
    pacienteId: item.pacienteId,
    canal: item.canal,
    janela: item.janela,
    status: item.status,
    transporte: item.transporte,
    providerId: item.providerId,
    codigoFalha: item.codigoFalha,
    mensagemFalha: item.mensagemFalha,
    criadoEm: paraIso(item.criadoEm),
    atualizadoEm: paraIso(item.atualizadoEm),
  };
}

function resultadoFalhaSegura() {
  return {
    status: 'FALHOU' as const,
    providerId: null,
    codigoFalha: 'TRANSPORTE_ERRO',
    mensagemFalha: 'Não foi possível concluir o envio pelo transporte configurado.',
  };
}

export class ServicoLembretes {
  constructor(
    private readonly repo: ILembreteRepository = new LembreteRepository(),
    private readonly transporte: ITeletransporte = criarTransporteLembrete()
  ) {}

  async solicitarManual(clinicaId: string, usuarioId: string, agendamentoId: string) {
    const contexto = await this.repo.obterContextoEnvio(clinicaId, agendamentoId);
    if (!contexto) throw new AppError('NAO_ENCONTRADO');

    validarElegibilidadeLembrete(contexto);
    const canal = contexto.canalPreferido;
    if (canal) {
      const existente = await this.repo.obterPorChave(clinicaId, agendamentoId, 'MANUAL', canal);
      if (existente && ['ENVIADO', 'ENTREGUE'].includes(existente.status)) return existente;
    }

    if (contexto.canalPreferido === null || contexto.telefone === null) {
      throw new AppError('REGRA_NEGOCIO');
    }
    const canalElegivel = contexto.canalPreferido;
    const telefoneElegivel = contexto.telefone;
    const mensagem = montarMensagemLembrete({
      nomePaciente: contexto.nomePaciente,
      inicio: contexto.inicio,
      fusoHorario: contexto.fusoHorario,
    });
    const chaveLogica = chaveLogicaLembrete(agendamentoId, 'MANUAL', canalElegivel);
    let resultado;
    try {
      resultado = await this.transporte.enviar({
        chaveLogica,
        telefone: telefoneElegivel,
        mensagem,
        canal: canalElegivel,
      });
    } catch {
      resultado = resultadoFalhaSegura();
    }

    const persistido = await this.repo.persistir({
      clinicaId,
      agendamentoId,
      pacienteId: contexto.pacienteId,
      canal: canalElegivel,
      janela: 'MANUAL',
      transporte: this.transporte.nome,
      resultado,
      solicitadoPor: usuarioId,
    });
    return persistido;
  }

  async listarPendencias(clinicaId: string, pagina: number, tamanho: number) {
    return this.repo.listarPendencias(clinicaId, pagina, tamanho);
  }
}
