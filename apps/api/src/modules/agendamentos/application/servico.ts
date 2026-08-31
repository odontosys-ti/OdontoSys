import { and, count, eq, gte, lte, ne } from 'drizzle-orm';

import { registrarAuditoria } from '../../../platform/auditoria/service';
import { db } from '../../../platform/db';
import { agendamento, paciente, procedimento, profissional } from '../../../platform/db/schema';
import { AppError } from '../../../platform/erros';
import { paraIso } from '../../../platform/http/datas';
import { criarUuidV7 } from '../../../platform/uuid';
import {
  type Agendamento,
  calcularFim,
  intervalosSobrepostos,
  validarDuracao,
  validarInicioFuturo,
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

export function serializarAgendamento(item: Agendamento) {
  return {
    id: item.id,
    pacienteId: item.pacienteId,
    profissionalId: item.profissionalId,
    procedimentoId: item.procedimentoId,
    inicio: paraIso(item.inicio),
    fim: paraIso(item.fim),
    status: item.status,
    criadoEm: paraIso(item.criadoEm),
    atualizadoEm: paraIso(item.atualizadoEm),
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

async function garantirRecursosAtivos(
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

export async function buscarConflito(
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

export async function listarAgendamentos(
  clinicaId: string,
  pagina: number,
  tamanho: number,
  de: Date,
  ate: Date,
  profissionalId?: string
) {
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

export async function criarAgendamento(
  clinicaId: string,
  usuarioId: string,
  dados: { pacienteId: string; profissionalId: string; procedimentoId: string; inicio: Date },
  agora: Date = new Date()
): Promise<Agendamento> {
  validarInicioFuturo(dados.inicio, agora);
  const { duracaoMinutos } = await garantirRecursosAtivos(clinicaId, dados);
  const fim = calcularFim(dados.inicio, duracaoMinutos);

  try {
    return await db().transaction(async (tx) => {
      if (await buscarConflito(dados.profissionalId, dados.inicio, fim)) {
        throw new AppError('CONFLITO_HORARIO');
      }
      const agoraDb = new Date();
      const [linha] = await tx
        .insert(agendamento)
        .values({
          id: criarUuidV7(),
          clinicaId,
          pacienteId: dados.pacienteId,
          profissionalId: dados.profissionalId,
          procedimentoId: dados.procedimentoId,
          inicio: dados.inicio,
          fim,
          status: 'AGENDADO',
          criadoPor: usuarioId,
          criadoEm: agoraDb,
          atualizadoEm: agoraDb,
        })
        .returning();
      if (!linha) {
        throw new Error('Falha ao criar agendamento');
      }
      await registrarAuditoria(tx, {
        clinicaId,
        usuarioId,
        entidade: 'agendamento',
        entidadeId: linha.id,
        acao: 'CRIAR',
        dadosDepois: { id: linha.id, inicio: paraIso(dados.inicio), fim: paraIso(fim) },
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

export async function reagendarAgendamento(
  clinicaId: string,
  usuarioId: string,
  id: string,
  inicio: Date,
  agora: Date = new Date()
): Promise<Agendamento> {
  validarInicioFuturo(inicio, agora);

  try {
    return await db().transaction(async (tx) => {
      const existentes = await tx
        .select()
        .from(agendamento)
        .where(and(eq(agendamento.id, id), eq(agendamento.clinicaId, clinicaId)))
        .limit(1);
      const existente = existentes[0];
      if (!existente) {
        throw new AppError('NAO_ENCONTRADO');
      }
      if (existente.status === 'CANCELADO') {
        throw new AppError('REGRA_NEGOCIO', [
          { mensagem: 'Não é possível reagendar um agendamento cancelado.' },
        ]);
      }

      const [proc] = await tx
        .select()
        .from(procedimento)
        .where(eq(procedimento.id, existente.procedimentoId))
        .limit(1);
      if (!proc) {
        throw new AppError('NAO_ENCONTRADO');
      }
      const fim = calcularFim(inicio, proc.duracaoMinutos);
      if (await buscarConflito(existente.profissionalId, inicio, fim, id)) {
        throw new AppError('CONFLITO_HORARIO');
      }

      const [linha] = await tx
        .update(agendamento)
        .set({ inicio, fim, atualizadoEm: new Date() })
        .where(eq(agendamento.id, id))
        .returning();
      if (!linha) {
        throw new AppError('NAO_ENCONTRADO');
      }
      await registrarAuditoria(tx, {
        clinicaId,
        usuarioId,
        entidade: 'agendamento',
        entidadeId: id,
        acao: 'EDITAR',
        dadosAntes: { inicio: paraIso(existente.inicio) },
        dadosDepois: { inicio: paraIso(inicio) },
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

export async function cancelarAgendamento(
  clinicaId: string,
  usuarioId: string,
  id: string
): Promise<Agendamento> {
  return db().transaction(async (tx) => {
    const existentes = await tx
      .select()
      .from(agendamento)
      .where(and(eq(agendamento.id, id), eq(agendamento.clinicaId, clinicaId)))
      .limit(1);
    const existente = existentes[0];
    if (!existente) {
      throw new AppError('NAO_ENCONTRADO');
    }
    const [linha] = await tx
      .update(agendamento)
      .set({ status: 'CANCELADO', atualizadoEm: new Date() })
      .where(eq(agendamento.id, id))
      .returning();
    if (!linha) {
      throw new AppError('NAO_ENCONTRADO');
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
