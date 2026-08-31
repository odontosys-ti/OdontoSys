import { and, count, desc, eq, ilike } from 'drizzle-orm';

import { registrarAuditoria } from '../../../platform/auditoria/service';
import { db } from '../../../platform/db';
import { procedimento } from '../../../platform/db/schema';
import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import { criarUuidV7 } from '../../../platform/uuid';
import type { Procedimento } from '../domain/procedimento';

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

export function serializarProcedimento(item: Procedimento) {
  return {
    id: item.id,
    nome: item.nome,
    duracaoMinutos: item.duracaoMinutos,
    ativo: item.ativo,
    criadoEm: paraIso(item.criadoEm),
    atualizadoEm: paraIso(item.atualizadoEm),
  };
}

export async function listarProcedimentos(
  clinicaId: string,
  pagina: number,
  tamanho: number,
  busca?: string
) {
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

export async function obterProcedimento(clinicaId: string, id: string): Promise<Procedimento> {
  const linhas = await db()
    .select()
    .from(procedimento)
    .where(and(eq(procedimento.id, id), eq(procedimento.clinicaId, clinicaId)))
    .limit(1);
  const linha = linhas[0];
  if (!linha) {
    throw new AppError('NAO_ENCONTRADO');
  }
  return mapear(linha);
}

export async function criarProcedimento(
  clinicaId: string,
  usuarioId: string,
  dados: { nome: string; duracaoMinutos: number }
): Promise<Procedimento> {
  return db().transaction(async (tx) => {
    const agora = new Date();
    const [linha] = await tx
      .insert(procedimento)
      .values({
        id: criarUuidV7(),
        clinicaId,
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
      clinicaId,
      usuarioId,
      entidade: 'procedimento',
      entidadeId: linha.id,
      acao: 'CRIAR',
      dadosDepois: { id: linha.id },
    });
    return mapear(linha);
  });
}

export async function atualizarProcedimento(
  clinicaId: string,
  usuarioId: string,
  id: string,
  dados: Partial<{ nome: string; duracaoMinutos: number }>
): Promise<Procedimento> {
  return db().transaction(async (tx) => {
    const [linha] = await tx
      .update(procedimento)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(and(eq(procedimento.id, id), eq(procedimento.clinicaId, clinicaId)))
      .returning();
    if (!linha) {
      throw new AppError('NAO_ENCONTRADO');
    }
    await registrarAuditoria(tx, {
      clinicaId,
      usuarioId,
      entidade: 'procedimento',
      entidadeId: id,
      acao: 'EDITAR',
      dadosDepois: { id },
    });
    return mapear(linha);
  });
}
