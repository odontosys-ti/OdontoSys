import type { ProfissionalResponse } from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import type {
  IProfissionalRepository,
  Profissional,
  ProfissionalAtualizacao,
  ProfissionalNovo,
} from '../domain/profissional';
import { ProfissionalRepository } from '../infra/profissional.repository';

export function serializarProfissional(item: Profissional): ProfissionalResponse {
  return {
    id: item.id,
    usuarioId: item.usuarioId,
    nome: item.nome,
    cro: item.cro,
    especialidade: item.especialidade,
    ativo: item.ativo,
    criadoEm: paraIso(item.criadoEm),
    atualizadoEm: paraIso(item.atualizadoEm),
  };
}

export class ServicoProfissionais {
  constructor(private readonly repo: IProfissionalRepository = new ProfissionalRepository()) {}

  async listar(clinicaId: string, pagina: number, tamanho: number, busca?: string) {
    return this.repo.listar(clinicaId, pagina, tamanho, busca);
  }

  async obter(clinicaId: string, id: string): Promise<Profissional> {
    const encontrado = await this.repo.obterPorId(clinicaId, id);
    if (!encontrado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return encontrado;
  }

  async criar(
    clinicaId: string,
    usuarioIdAuditoria: string,
    dados: Omit<ProfissionalNovo, 'clinicaId'>
  ): Promise<Profissional> {
    return this.repo.criar({ ...dados, clinicaId }, usuarioIdAuditoria);
  }

  async atualizar(
    clinicaId: string,
    usuarioIdAuditoria: string,
    id: string,
    dados: ProfissionalAtualizacao
  ): Promise<Profissional> {
    const atualizado = await this.repo.atualizar(clinicaId, id, dados, usuarioIdAuditoria);
    if (!atualizado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return atualizado;
  }
}
