import { and, count, desc, eq, ilike } from 'drizzle-orm';

import { registrarAuditoria } from '../../../platform/auditoria/service';
import { db } from '../../../platform/db';
import { profissional } from '../../../platform/db/schema';
import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import { criarUuidV7 } from '../../../platform/uuid';
import type { Profissional } from '../domain/profissional';

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

export function serializarProfissional(item: Profissional) {
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

export async function listarProfissionais(
  clinicaId: string,
  pagina: number,
  tamanho: number,
  busca?: string
) {
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

export async function obterProfissional(clinicaId: string, id: string): Promise<Profissional> {
  const linhas = await db()
    .select()
    .from(profissional)
    .where(and(eq(profissional.id, id), eq(profissional.clinicaId, clinicaId)))
    .limit(1);
  const linha = linhas[0];
  if (!linha) {
    throw new AppError('NAO_ENCONTRADO');
  }
  return mapear(linha);
}

export async function criarProfissional(
  clinicaId: string,
  usuarioId: string,
  dados: { usuarioId: string; nome: string; cro: string; especialidade: string }
): Promise<Profissional> {
  return db().transaction(async (tx) => {
    const agora = new Date();
    const [linha] = await tx
      .insert(profissional)
      .values({
        id: criarUuidV7(),
        clinicaId,
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
      clinicaId,
      usuarioId,
      entidade: 'profissional',
      entidadeId: linha.id,
      acao: 'CRIAR',
      dadosDepois: { id: linha.id },
    });
    return mapear(linha);
  });
}

export async function atualizarProfissional(
  clinicaId: string,
  usuarioId: string,
  id: string,
  dados: Partial<{ usuarioId: string; nome: string; cro: string; especialidade: string }>
): Promise<Profissional> {
  return db().transaction(async (tx) => {
    const [linha] = await tx
      .update(profissional)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(and(eq(profissional.id, id), eq(profissional.clinicaId, clinicaId)))
      .returning();
    if (!linha) {
      throw new AppError('NAO_ENCONTRADO');
    }
    await registrarAuditoria(tx, {
      clinicaId,
      usuarioId,
      entidade: 'profissional',
      entidadeId: id,
      acao: 'EDITAR',
      dadosDepois: { id },
    });
    return mapear(linha);
  });
}
