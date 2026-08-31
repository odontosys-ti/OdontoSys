import { and, count, eq, gte, lte, ne } from 'drizzle-orm';

import { registrarAuditoria } from '../../../platform/auditoria/service';
import { db } from '../../../platform/db';
import { agendamento, paciente, procedimento, profissional } from '../../../platform/db/schema';
import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import { criarUuidV7 } from '../../../platform/uuid';
import {
  type Agendamento,
  type AgendamentoNovo,
  type IAgendamentoRepository,
  type ListaPaginada,
  intervalosSobrepostos,
  validarDuracao,
} from '../domain/agendamento';

function mapear(linha: typeof agendamento.$inferSelect): Agendamento {
  return {
    id: linha.id,
    clinicaId: linha.clinicaId,
    pacienteId: linha.pacienteId,
    profissionalId: linha.profissionalId,
    procedimentoId: linha.procedimentoId,
    inicio: linha.inicio,
    fim: linha.fim,
    status: linha.status,
    criadoPor: linha.criadoPor,
    criadoEm: linha.criadoEm,
    atualizadoEm: linha.atualizadoEm,
  };
}

function ehExclusao(erro: unknown): boolean {
  return (
    typeof erro === 'object' &&
    erro !== null &&
    'code' in erro &&
    (erro as { code: string }).code === '23P01'
  );
}

export class AgendamentoRepository implements IAgendamentoRepository {
  async listar(
    clinicaId: string,
    pagina: number,
    tamanho: number,
    de: Date,
    ate: Date,
    profissionalId?: string
  ): Promise<ListaPaginada<Agendamento>> {
    const filtros = [
      eq(agendamento.clinicaId, clinicaId),
      gte(agendamento.inicio, de),
      lte(agendamento.inicio, ate),
    ];
    if (profissionalId) {
      filtros.push(eq(agendamento.profissionalId, profissionalId));
    }
    const where = and(...filtros);
    const [linhas, totais] = await Promise.all([
      db()
        .select()
        .from(agendamento)
        .where(where)
        .orderBy(agendamento.inicio)
        .limit(tamanho)
        .offset((pagina - 1) * tamanho),
      db().select({ total: count() }).from(agendamento).where(where),
    ]);
    return { itens: linhas.map(mapear), total: totais[0]?.total ?? 0 };
  }

  async obterPorId(clinicaId: string, id: string): Promise<Agendamento | null> {
    const linhas = await db()
      .select()
      .from(agendamento)
      .where(and(eq(agendamento.id, id), eq(agendamento.clinicaId, clinicaId)))
      .limit(1);
    const linha = linhas[0];
    return linha ? mapear(linha) : null;
  }

  async buscarConflito(
    profissionalId: string,
    inicio: Date,
    fim: Date,
    ignorarId?: string
  ): Promise<boolean> {
    const filtros = [
      eq(agendamento.profissionalId, profissionalId),
      eq(agendamento.status, 'AGENDADO'),
    ];
    if (ignorarId) {
      filtros.push(ne(agendamento.id, ignorarId));
    }
    const existentes = await db()
      .select()
      .from(agendamento)
      .where(and(...filtros));
    return existentes.some((item) =>
      intervalosSobrepostos({ inicio, fim }, { inicio: item.inicio, fim: item.fim })
    );
  }

  async verificarRecursosAtivos(
    clinicaId: string,
    ids: { pacienteId: string; profissionalId: string; procedimentoId: string }
  ): Promise<{ duracaoMinutos: number }> {
    const [pac] = await db()
      .select()
      .from(paciente)
      .where(and(eq(paciente.id, ids.pacienteId), eq(paciente.clinicaId, clinicaId)))
      .limit(1);
    const [pro] = await db()
      .select()
      .from(profissional)
      .where(and(eq(profissional.id, ids.profissionalId), eq(profissional.clinicaId, clinicaId)))
      .limit(1);
    const [proc] = await db()
      .select()
      .from(procedimento)
      .where(and(eq(procedimento.id, ids.procedimentoId), eq(procedimento.clinicaId, clinicaId)))
      .limit(1);

    if (!pac || !pro || !proc) {
      throw new AppError('NAO_ENCONTRADO');
    }
    if (!pac.ativo || !pro.ativo || !proc.ativo) {
      throw new AppError('REGRA_NEGOCIO', [
        { mensagem: 'Paciente, profissional e procedimento precisam estar ativos.' },
      ]);
    }
    validarDuracao(proc.duracaoMinutos);
    return { duracaoMinutos: proc.duracaoMinutos };
  }

  async obterProcedimentoPorId(
    clinicaId: string,
    id: string
  ): Promise<{ duracaoMinutos: number } | null> {
    const [proc] = await db()
      .select()
      .from(procedimento)
      .where(and(eq(procedimento.id, id), eq(procedimento.clinicaId, clinicaId)))
      .limit(1);
    return proc ? { duracaoMinutos: proc.duracaoMinutos } : null;
  }

  async criar(dados: AgendamentoNovo): Promise<Agendamento> {
    try {
      return await db().transaction(async (tx) => {
        if (await this.buscarConflito(dados.profissionalId, dados.inicio, dados.fim)) {
          throw new AppError('CONFLITO_HORARIO');
        }
        const agoraDb = new Date();
        const [linha] = await tx
          .insert(agendamento)
          .values({
            id: criarUuidV7(),
            clinicaId: dados.clinicaId,
            pacienteId: dados.pacienteId,
            profissionalId: dados.profissionalId,
            procedimentoId: dados.procedimentoId,
            inicio: dados.inicio,
            fim: dados.fim,
            status: 'AGENDADO',
            criadoPor: dados.criadoPor,
            criadoEm: agoraDb,
            atualizadoEm: agoraDb,
          })
          .returning();
        if (!linha) {
          throw new Error('Falha ao criar agendamento');
        }
        await registrarAuditoria(tx, {
          clinicaId: dados.clinicaId,
          usuarioId: dados.criadoPor,
          entidade: 'agendamento',
          entidadeId: linha.id,
          acao: 'CRIAR',
          dadosDepois: { id: linha.id, inicio: paraIso(dados.inicio), fim: paraIso(dados.fim) },
        });
        return mapear(linha);
      });
    } catch (erro) {
      if (ehExclusao(erro)) {
        throw new AppError('CONFLITO_HORARIO');
      }
      throw erro;
    }
  }

  async reagendar(
    clinicaId: string,
    usuarioId: string,
    id: string,
    novoInicio: Date,
    novoFim: Date
  ): Promise<Agendamento | null> {
    try {
      return await db().transaction(async (tx) => {
        const existentes = await tx
          .select()
          .from(agendamento)
          .where(and(eq(agendamento.id, id), eq(agendamento.clinicaId, clinicaId)))
          .limit(1);
        const existente = existentes[0];
        if (!existente) {
          return null;
        }
        if (existente.status === 'CANCELADO') {
          throw new AppError('REGRA_NEGOCIO', [
            { mensagem: 'Não é possível reagendar um agendamento cancelado.' },
          ]);
        }

        if (await this.buscarConflito(existente.profissionalId, novoInicio, novoFim, id)) {
          throw new AppError('CONFLITO_HORARIO');
        }

        const [linha] = await tx
          .update(agendamento)
          .set({ inicio: novoInicio, fim: novoFim, atualizadoEm: new Date() })
          .where(eq(agendamento.id, id))
          .returning();
        if (!linha) {
          return null;
        }
        await registrarAuditoria(tx, {
          clinicaId,
          usuarioId,
          entidade: 'agendamento',
          entidadeId: id,
          acao: 'EDITAR',
          dadosAntes: { inicio: paraIso(existente.inicio) },
          dadosDepois: { inicio: paraIso(novoInicio) },
        });
        return mapear(linha);
      });
    } catch (erro) {
      if (ehExclusao(erro)) {
        throw new AppError('CONFLITO_HORARIO');
      }
      throw erro;
    }
  }

  async cancelar(clinicaId: string, usuarioId: string, id: string): Promise<Agendamento | null> {
    return db().transaction(async (tx) => {
      const existentes = await tx
        .select()
        .from(agendamento)
        .where(and(eq(agendamento.id, id), eq(agendamento.clinicaId, clinicaId)))
        .limit(1);
      const existente = existentes[0];
      if (!existente) {
        return null;
      }
      const [linha] = await tx
        .update(agendamento)
        .set({ status: 'CANCELADO', atualizadoEm: new Date() })
        .where(eq(agendamento.id, id))
        .returning();
      if (!linha) {
        return null;
      }
      await registrarAuditoria(tx, {
        clinicaId,
        usuarioId,
        entidade: 'agendamento',
        entidadeId: id,
        acao: 'EDITAR',
        dadosAntes: { status: existente.status },
        dadosDepois: { status: 'CANCELADO' },
      });
      return mapear(linha);
    });
  }
}
