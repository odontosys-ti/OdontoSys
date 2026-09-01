import { and, count, desc, eq, ilike } from 'drizzle-orm';

import { registrarAuditoria } from '../../../platform/auditoria/service';
import { db } from '../../../platform/db';
import { procedimento } from '../../../platform/db/schema';
import { criarUuidV7 } from '../../../platform/uuid';
import type {
  IProcedimentoRepository,
  ListaPaginada,
  Procedimento,
  ProcedimentoAtualizacao,
  ProcedimentoNovo,
} from '../domain/procedimento';

function mapear(linha: typeof procedimento.$inferSelect): Procedimento {
  return {
    id: linha.id,
    clinicaId: linha.clinicaId,
    nome: linha.nome,
    duracaoMinutos: linha.duracaoMinutos,
    ativo: linha.ativo,
    criadoEm: linha.criadoEm,
    atualizadoEm: linha.atualizadoEm,
  };
}

export class ProcedimentoRepository implements IProcedimentoRepository {
  async listar(
    clinicaId: string,
    pagina: number,
    tamanho: number,
    busca?: string
  ): Promise<ListaPaginada<Procedimento>> {
    const filtros = [eq(procedimento.clinicaId, clinicaId), eq(procedimento.ativo, true)];
    if (busca && busca.trim() !== '') {
      filtros.push(ilike(procedimento.nome, `%${busca.trim()}%`));
    }
    const where = and(...filtros);
    const [linhas, totais] = await Promise.all([
      db()
        .select()
        .from(procedimento)
        .where(where)
        .orderBy(desc(procedimento.criadoEm))
        .limit(tamanho)
        .offset((pagina - 1) * tamanho),
      db().select({ total: count() }).from(procedimento).where(where),
    ]);
    return { itens: linhas.map(mapear), total: totais[0]?.total ?? 0 };
  }

  async obterPorId(clinicaId: string, id: string): Promise<Procedimento | null> {
    const linhas = await db()
      .select()
      .from(procedimento)
      .where(and(eq(procedimento.id, id), eq(procedimento.clinicaId, clinicaId)))
      .limit(1);
    const linha = linhas[0];
    return linha ? mapear(linha) : null;
  }

  async criar(dados: ProcedimentoNovo, usuarioIdAuditoria: string): Promise<Procedimento> {
    return db().transaction(async (tx) => {
      const agora = new Date();
      const [linha] = await tx
        .insert(procedimento)
        .values({
          id: criarUuidV7(),
          clinicaId: dados.clinicaId,
          nome: dados.nome,
          duracaoMinutos: dados.duracaoMinutos,
          ativo: true,
          criadoEm: agora,
          atualizadoEm: agora,
        })
        .returning();
      if (!linha) {
        throw new Error('Falha ao criar procedimento');
      }
      await registrarAuditoria(tx, {
        clinicaId: dados.clinicaId,
        usuarioId: usuarioIdAuditoria,
        entidade: 'procedimento',
        entidadeId: linha.id,
        acao: 'CRIAR',
        dadosDepois: { id: linha.id },
      });
      return mapear(linha);
    });
  }

  async atualizar(
    clinicaId: string,
    id: string,
    dados: ProcedimentoAtualizacao,
    usuarioIdAuditoria: string
  ): Promise<Procedimento | null> {
    return db().transaction(async (tx) => {
      const [existente] = await tx
        .select()
        .from(procedimento)
        .where(and(eq(procedimento.id, id), eq(procedimento.clinicaId, clinicaId)))
        .limit(1);
      if (!existente) {
        return null;
      }
      const [linha] = await tx
        .update(procedimento)
        .set({ ...dados, atualizadoEm: new Date() })
        .where(and(eq(procedimento.id, id), eq(procedimento.clinicaId, clinicaId)))
        .returning();
      if (!linha) {
        return null;
      }
      const dadosAntes: Record<string, string | number> = {};
      const dadosDepois: Record<string, string | number> = {};
      if (dados.nome !== undefined) {
        dadosAntes.nome = existente.nome;
        dadosDepois.nome = linha.nome;
      }
      if (dados.duracaoMinutos !== undefined) {
        dadosAntes.duracaoMinutos = existente.duracaoMinutos;
        dadosDepois.duracaoMinutos = linha.duracaoMinutos;
      }
      await registrarAuditoria(tx, {
        clinicaId,
        usuarioId: usuarioIdAuditoria,
        entidade: 'procedimento',
        entidadeId: id,
        acao: 'EDITAR',
        dadosAntes,
        dadosDepois,
      });
      return mapear(linha);
    });
  }
}
