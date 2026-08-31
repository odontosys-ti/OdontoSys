import type { PacienteResponse } from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import type { Paciente } from '../domain/paciente';
import { PacienteRepository } from '../infra/paciente.repository';
import {
  atualizarPacienteComAuditoria,
  criarPacienteComAuditoria,
} from '../infra/paciente.repository';

export function serializarPaciente(paciente: Paciente): PacienteResponse {
  return {
    id: paciente.id,
    nome: paciente.nome,
    documento: paciente.documento,
    nascimento: paraIso(paciente.nascimento),
    observacoes: paciente.observacoes,
    ativo: paciente.ativo,
    criadoEm: paraIso(paciente.criadoEm),
    atualizadoEm: paraIso(paciente.atualizadoEm),
  };
}

export class ServicoPacientes {
  constructor(private readonly repo = new PacienteRepository()) {}

  async listar(clinicaId: string, pagina: number, tamanho: number, busca?: string) {
    return this.repo.listar(clinicaId, pagina, tamanho, busca);
  }

  async obter(clinicaId: string, id: string): Promise<Paciente> {
    const encontrado = await this.repo.obterPorId(clinicaId, id);
    if (!encontrado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return encontrado;
  }

  async criar(
    clinicaId: string,
    usuarioId: string,
    dados: { nome: string; documento: string; nascimento: Date; observacoes: string }
  ): Promise<Paciente> {
    return criarPacienteComAuditoria({ ...dados, clinicaId }, usuarioId);
  }

  async atualizar(
    clinicaId: string,
    usuarioId: string,
    id: string,
    dados: { nome?: string; documento?: string; nascimento?: Date; observacoes?: string }
  ): Promise<Paciente> {
    const atualizado = await atualizarPacienteComAuditoria(clinicaId, id, dados, usuarioId);
    if (!atualizado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return atualizado;
  }
}
