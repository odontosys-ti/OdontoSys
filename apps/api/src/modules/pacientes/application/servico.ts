import type { PacienteResponse } from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import type {
  IPacienteRepository,
  Paciente,
  PacienteAtualizacao,
  PacienteNovo,
} from '../domain/paciente';
import { PacienteRepository } from '../infra/paciente.repository';

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
  constructor(private readonly repo: IPacienteRepository = new PacienteRepository()) {}

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
    dados: Omit<PacienteNovo, 'clinicaId'>
  ): Promise<Paciente> {
    return this.repo.criar({ ...dados, clinicaId }, usuarioId);
  }

  async atualizar(
    clinicaId: string,
    usuarioId: string,
    id: string,
    dados: PacienteAtualizacao
  ): Promise<Paciente> {
    const atualizado = await this.repo.atualizar(clinicaId, id, dados, usuarioId);
    if (!atualizado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return atualizado;
  }
}
