import type { AgendamentoResponse } from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import {
  type Agendamento,
  type IAgendamentoRepository,
  calcularFim,
  validarInicioFuturo,
} from '../domain/agendamento';
import { AgendamentoRepository } from '../infra/agendamento.repository';

export function serializarAgendamento(item: Agendamento): AgendamentoResponse {
  return {
    id: item.id,
    pacienteId: item.pacienteId,
    profissionalId: item.profissionalId,
    procedimentoId: item.procedimentoId,
    inicio: paraIso(item.inicio),
    fim: paraIso(item.fim),
    status: item.status,
    criadoEm: paraIso(item.criadoEm),
    atualizadoEm: paraIso(item.atualizadoEm),
  };
}

export class ServicoAgendamentos {
  constructor(private readonly repo: IAgendamentoRepository = new AgendamentoRepository()) {}

  async listar(
    clinicaId: string,
    pagina: number,
    tamanho: number,
    de: Date,
    ate: Date,
    profissionalId?: string
  ) {
    return this.repo.listar(clinicaId, pagina, tamanho, de, ate, profissionalId);
  }

  async obter(clinicaId: string, id: string): Promise<Agendamento> {
    const encontrado = await this.repo.obterPorId(clinicaId, id);
    if (!encontrado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return encontrado;
  }

  async criar(
    clinicaId: string,
    usuarioId: string,
    dados: { pacienteId: string; profissionalId: string; procedimentoId: string; inicio: Date },
    agora: Date = new Date()
  ): Promise<Agendamento> {
    validarInicioFuturo(dados.inicio, agora);
    const { duracaoMinutos } = await this.repo.verificarRecursosAtivos(clinicaId, dados);
    const fim = calcularFim(dados.inicio, duracaoMinutos);

    return this.repo.criar({
      clinicaId,
      pacienteId: dados.pacienteId,
      profissionalId: dados.profissionalId,
      procedimentoId: dados.procedimentoId,
      inicio: dados.inicio,
      fim,
      criadoPor: usuarioId,
    });
  }

  async reagendar(
    clinicaId: string,
    usuarioId: string,
    id: string,
    inicio: Date,
    agora: Date = new Date()
  ): Promise<Agendamento> {
    validarInicioFuturo(inicio, agora);

    const existente = await this.repo.obterPorId(clinicaId, id);
    if (!existente) {
      throw new AppError('NAO_ENCONTRADO');
    }
    if (existente.status === 'CANCELADO') {
      throw new AppError('REGRA_NEGOCIO', [
        { mensagem: 'Não é possível reagendar um agendamento cancelado.' },
      ]);
    }

    const proc = await this.repo.obterProcedimentoPorId(clinicaId, existente.procedimentoId);
    if (!proc) {
      throw new AppError('NAO_ENCONTRADO');
    }
    const fim = calcularFim(inicio, proc.duracaoMinutos);

    const atualizado = await this.repo.reagendar(clinicaId, usuarioId, id, inicio, fim);
    if (!atualizado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return atualizado;
  }

  async cancelar(clinicaId: string, usuarioId: string, id: string): Promise<Agendamento> {
    const atualizado = await this.repo.cancelar(clinicaId, usuarioId, id);
    if (!atualizado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return atualizado;
  }
}
