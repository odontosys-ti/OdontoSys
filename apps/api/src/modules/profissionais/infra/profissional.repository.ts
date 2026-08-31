import { and, count, desc, eq, ilike } from 'drizzle-orm';

import { registrarAuditoria } from '../../../platform/auditoria/service';
import { db } from '../../../platform/db';
import { profissional } from '../../../platform/db/schema';
import { criarUuidV7 } from '../../../platform/uuid';
import type {
  IProfissionalRepository,
  ListaPaginada,
  Profissional,
  ProfissionalAtualizacao,
  ProfissionalNovo,
} from '../domain/profissional';

function mapear(linha: typeof profissional.$inferSelect): Profissional {
  return {
    id: linha.id,
    clinicaId: linha.clinicaId,
    usuarioId: linha.usuarioId,
    nome: linha.nome,
    cro: linha.cro,
    especialidade: linha.especialidade,
    ativo: linha.ativo,
    criadoEm: linha.criadoEm,
    atualizadoEm: linha.atualizadoEm,
  };
}

export class ProfissionalRepository implements IProfissionalRepository {
  async listar(
    clinicaId: string,
    pagina: number,
    tamanho: number,
    busca?: string
  ): Promise<ListaPaginada<Profissional>> {
    const filtros = [eq(profissional.clinicaId, clinicaId), eq(profissional.ativo, true)];
    if (busca && busca.trim() !== '') {
      filtros.push(ilike(profissional.nome, `%${busca.trim()}%`));
    }
    const where = and(...filtros);
    const [linhas, totais] = await Promise.all([
      db()
        .select()
        .from(profissional)
        .where(where)
        .orderBy(desc(profissional.criadoEm))
        .limit(tamanho)
        .offset((pagina - 1) * tamanho),
      db().select({ total: count() }).from(profissional).where(where),
    ]);
    return { itens: linhas.map(mapear), total: totais[0]?.total ?? 0 };
  }

  async obterPorId(clinicaId: string, id: string): Promise<Profissional | null> {
    const linhas = await db()
      .select()
      .from(profissional)
      .where(and(eq(profissional.id, id), eq(profissional.clinicaId, clinicaId)))
      .limit(1);
    const linha = linhas[0];
    return linha ? mapear(linha) : null;
  }

  async criar(dados: ProfissionalNovo, usuarioIdAuditoria: string): Promise<Profissional> {
    return db().transaction(async (tx) => {
      const agora = new Date();
      const [linha] = await tx
        .insert(profissional)
        .values({
          id: criarUuidV7(),
          clinicaId: dados.clinicaId,
          usuarioId: dados.usuarioId,
          nome: dados.nome,
          cro: dados.cro,
          especialidade: dados.especialidade,
          ativo: true,
          criadoEm: agora,
          atualizadoEm: agora,
        })
        .returning();
      if (!linha) {
        throw new Error('Falha ao criar profissional');
      }
      await registrarAuditoria(tx, {
        clinicaId: dados.clinicaId,
        usuarioId: usuarioIdAuditoria,
        entidade: 'profissional',
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
    dados: ProfissionalAtualizacao,
    usuarioIdAuditoria: string
  ): Promise<Profissional | null> {
    return db().transaction(async (tx) => {
      const [linha] = await tx
        .update(profissional)
        .set({ ...dados, atualizadoEm: new Date() })
        .where(and(eq(profissional.id, id), eq(profissional.clinicaId, clinicaId)))
        .returning();
      if (!linha) {
        return null;
      }
      await registrarAuditoria(tx, {
        clinicaId,
        usuarioId: usuarioIdAuditoria,
        entidade: 'profissional',
        entidadeId: id,
        acao: 'EDITAR',
        dadosDepois: { id },
      });
      return mapear(linha);
    });
  }
}
