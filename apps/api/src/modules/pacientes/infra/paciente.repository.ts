import { and, count, desc, eq, ilike } from 'drizzle-orm';

import { registrarAuditoria } from '../../../platform/auditoria/service';
import { db } from '../../../platform/db';
import { paciente } from '../../../platform/db/schema';
import { criarUuidV7 } from '../../../platform/uuid';
import type {
  IPacienteRepository,
  ListaPaginada,
  Paciente,
  PacienteAtualizacao,
  PacienteNovo,
} from '../domain/paciente';

function mapear(linha: typeof paciente.$inferSelect): Paciente {
  return {
    id: linha.id,
    clinicaId: linha.clinicaId,
    nome: linha.nome,
    documento: linha.documento,
    nascimento: linha.nascimento,
    observacoes: linha.observacoes,
    ativo: linha.ativo,
    criadoEm: linha.criadoEm,
    atualizadoEm: linha.atualizadoEm,
  };
}

export class PacienteRepository implements IPacienteRepository {
  async listar(
    clinicaId: string,
    pagina: number,
    tamanho: number,
    busca?: string
  ): Promise<ListaPaginada<Paciente>> {
    const filtros = [eq(paciente.clinicaId, clinicaId), eq(paciente.ativo, true)];
    if (busca && busca.trim() !== '') {
      filtros.push(ilike(paciente.nome, `%${busca.trim()}%`));
    }

    const where = and(...filtros);
    const offset = (pagina - 1) * tamanho;

    const [linhas, totais] = await Promise.all([
      db()
        .select()
        .from(paciente)
        .where(where)
        .orderBy(desc(paciente.criadoEm))
        .limit(tamanho)
        .offset(offset),
      db().select({ total: count() }).from(paciente).where(where),
    ]);

    return { itens: linhas.map(mapear), total: totais[0]?.total ?? 0 };
  }

  async obterPorId(clinicaId: string, id: string): Promise<Paciente | null> {
    const linhas = await db()
      .select()
      .from(paciente)
      .where(and(eq(paciente.id, id), eq(paciente.clinicaId, clinicaId)))
      .limit(1);
    const linha = linhas[0];
    return linha ? mapear(linha) : null;
  }

  async criar(dados: PacienteNovo, usuarioIdAuditoria: string): Promise<Paciente> {
    return db().transaction(async (tx) => {
      const agora = new Date();
      const [linha] = await tx
        .insert(paciente)
        .values({
          id: criarUuidV7(),
          clinicaId: dados.clinicaId,
          nome: dados.nome,
          documento: dados.documento,
          nascimento: dados.nascimento,
          observacoes: dados.observacoes,
          ativo: true,
          criadoEm: agora,
          atualizadoEm: agora,
        })
        .returning();
      if (!linha) {
        throw new Error('Falha ao criar paciente');
      }
      await registrarAuditoria(tx, {
        clinicaId: dados.clinicaId,
        usuarioId: usuarioIdAuditoria,
        entidade: 'paciente',
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
    dados: PacienteAtualizacao,
    usuarioIdAuditoria: string
  ): Promise<Paciente | null> {
    return db().transaction(async (tx) => {
      const existentes = await tx
        .select()
        .from(paciente)
        .where(and(eq(paciente.id, id), eq(paciente.clinicaId, clinicaId)))
        .limit(1);
      const existente = existentes[0];
      if (!existente) {
        return null;
      }
      const [linha] = await tx
        .update(paciente)
        .set({ ...dados, atualizadoEm: new Date() })
        .where(and(eq(paciente.id, id), eq(paciente.clinicaId, clinicaId)))
        .returning();
      if (!linha) {
        return null;
      }
      const camposAlterados = Object.entries(dados)
        .filter(([, valor]) => valor !== undefined)
        .map(([campo]) => campo);
      await registrarAuditoria(tx, {
        clinicaId,
        usuarioId: usuarioIdAuditoria,
        entidade: 'paciente',
        entidadeId: id,
        acao: 'EDITAR',
        dadosAntes: { camposAlterados },
        dadosDepois: { camposAlterados },
      });
      return mapear(linha);
    });
  }
}
