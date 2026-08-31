import type { ProcedimentoResponse } from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import type {
  IProcedimentoRepository,
  Procedimento,
  ProcedimentoAtualizacao,
  ProcedimentoNovo,
} from '../domain/procedimento';
import { ProcedimentoRepository } from '../infra/procedimento.repository';

export function serializarProcedimento(item: Procedimento): ProcedimentoResponse {
  return {
    id: item.id,
    nome: item.nome,
    duracaoMinutos: item.duracaoMinutos,
    ativo: item.ativo,
    criadoEm: paraIso(item.criadoEm),
    atualizadoEm: paraIso(item.atualizadoEm),
  };
}

export class ServicoProcedimentos {
  constructor(private readonly repo: IProcedimentoRepository = new ProcedimentoRepository()) {}

  async listar(clinicaId: string, pagina: number, tamanho: number, busca?: string) {
    return this.repo.listar(clinicaId, pagina, tamanho, busca);
  }

  async obter(clinicaId: string, id: string): Promise<Procedimento> {
    const encontrado = await this.repo.obterPorId(clinicaId, id);
    if (!encontrado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return encontrado;
  }

  async criar(
    clinicaId: string,
    usuarioIdAuditoria: string,
    dados: Omit<ProcedimentoNovo, 'clinicaId'>
  ): Promise<Procedimento> {
    return this.repo.criar({ ...dados, clinicaId }, usuarioIdAuditoria);
  }

  async atualizar(
    clinicaId: string,
    usuarioIdAuditoria: string,
    id: string,
    dados: ProcedimentoAtualizacao
  ): Promise<Procedimento> {
    const atualizado = await this.repo.atualizar(clinicaId, id, dados, usuarioIdAuditoria);
    if (!atualizado) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return atualizado;
  }
}
