import { and, count, desc, eq } from 'drizzle-orm';

import { registrarAuditoria } from '../../../platform/auditoria/service';
import { db } from '../../../platform/db';
import { agendamento, clinica, lembrete, paciente } from '../../../platform/db/schema';
import { criarUuidV7 } from '../../../platform/uuid';
import type { CanalMensagem, JanelaLembrete } from '@odontosys/contracts';
import {
  type ContextoEnvioLembrete,
  type ILembreteRepository,
  type Lembrete,
  type ListaLembretes,
  type ResultadoPersistenciaLembrete,
} from '../domain/lembrete';

function mapear(linha: typeof lembrete.$inferSelect): Lembrete {
  return {
    id: linha.id,
    clinicaId: linha.clinicaId,
    agendamentoId: linha.agendamentoId,
    pacienteId: linha.pacienteId,
    canal: linha.canal,
    janela: linha.janela,
    status: linha.status,
    transporte: linha.transporte,
    providerId: linha.providerId,
    codigoFalha: linha.codigoFalha,
    mensagemFalha: linha.mensagemFalha,
    solicitadoPor: linha.solicitadoPor,
    criadoEm: linha.criadoEm,
    atualizadoEm: linha.atualizadoEm,
  };
}

export class LembreteRepository implements ILembreteRepository {
  async obterContextoEnvio(
    clinicaId: string,
    agendamentoId: string
  ): Promise<ContextoEnvioLembrete | null> {
    const linhas = await db()
      .select({
        agendamentoId: agendamento.id,
        clinicaId: agendamento.clinicaId,
        pacienteId: paciente.id,
        inicio: agendamento.inicio,
        statusAgendamento: agendamento.status,
        fusoHorario: clinica.fusoHorario,
        nomePaciente: paciente.nome,
        telefone: paciente.telefone,
        canalPreferido: paciente.canalPreferido,
        consentimentoAtivo: paciente.consentimentoAtivo,
      })
      .from(agendamento)
      .innerJoin(paciente, eq(paciente.id, agendamento.pacienteId))
      .innerJoin(clinica, eq(clinica.id, agendamento.clinicaId))
      .where(and(eq(agendamento.id, agendamentoId), eq(agendamento.clinicaId, clinicaId)))
      .limit(1);
    const linha = linhas[0];
    return linha ?? null;
  }

  async obterPorChave(
    clinicaId: string,
    agendamentoId: string,
    janela: JanelaLembrete,
    canal: CanalMensagem
  ): Promise<Lembrete | null> {
    const linhas = await db()
      .select()
      .from(lembrete)
      .where(
        and(
          eq(lembrete.clinicaId, clinicaId),
          eq(lembrete.agendamentoId, agendamentoId),
          eq(lembrete.janela, janela),
          eq(lembrete.canal, canal)
        )
      )
      .limit(1);
    return linhas[0] ? mapear(linhas[0]) : null;
  }

  async persistir(entrada: ResultadoPersistenciaLembrete): Promise<Lembrete> {
    return db().transaction(async (tx) => {
      const existentes = await tx
        .select()
        .from(lembrete)
        .where(
          and(
            eq(lembrete.clinicaId, entrada.clinicaId),
            eq(lembrete.agendamentoId, entrada.agendamentoId),
            eq(lembrete.janela, entrada.janela),
            eq(lembrete.canal, entrada.canal)
          )
        )
        .limit(1);
      const existente = existentes[0];
      const agora = new Date();
      const valores = {
        status: entrada.resultado.status,
        transporte: entrada.transporte,
        providerId: entrada.resultado.providerId,
        codigoFalha: entrada.resultado.codigoFalha,
        mensagemFalha: entrada.resultado.mensagemFalha,
        solicitadoPor: entrada.solicitadoPor,
        atualizadoEm: agora,
      } as const;

      if (existente) {
        const [atualizado] = await tx
          .update(lembrete)
          .set(valores)
          .where(eq(lembrete.id, existente.id))
          .returning();
        if (!atualizado) throw new Error('Falha ao atualizar lembrete');
        await registrarAuditoria(tx, {
          clinicaId: entrada.clinicaId,
          usuarioId: entrada.solicitadoPor,
          entidade: 'lembrete',
          entidadeId: atualizado.id,
          acao: 'EDITAR',
          dadosAntes: { status: existente.status },
          dadosDepois: {
            canal: entrada.canal,
            janela: entrada.janela,
            status: atualizado.status,
            transporte: entrada.transporte,
          },
        });
        return mapear(atualizado);
      }

      const [criado] = await tx
        .insert(lembrete)
        .values({
          id: criarUuidV7(),
          clinicaId: entrada.clinicaId,
          agendamentoId: entrada.agendamentoId,
          pacienteId: entrada.pacienteId,
          canal: entrada.canal,
          janela: entrada.janela,
          ...valores,
          criadoEm: agora,
        })
        .returning();
      if (!criado) throw new Error('Falha ao criar lembrete');
      await registrarAuditoria(tx, {
        clinicaId: entrada.clinicaId,
        usuarioId: entrada.solicitadoPor,
        entidade: 'lembrete',
        entidadeId: criado.id,
        acao: 'CRIAR',
        dadosDepois: {
          canal: entrada.canal,
          janela: entrada.janela,
          status: criado.status,
          transporte: entrada.transporte,
        },
      });
      return mapear(criado);
    });
  }

  async listarPendencias(
    clinicaId: string,
    pagina: number,
    tamanho: number
  ): Promise<ListaLembretes> {
    const filtro = and(eq(lembrete.clinicaId, clinicaId), eq(lembrete.status, 'FALHOU'));
    const [linhas, totais] = await Promise.all([
      db()
        .select()
        .from(lembrete)
        .where(filtro)
        .orderBy(desc(lembrete.atualizadoEm))
        .limit(tamanho)
        .offset((pagina - 1) * tamanho),
      db().select({ total: count() }).from(lembrete).where(filtro),
    ]);
    return { itens: linhas.map(mapear), total: totais[0]?.total ?? 0 };
  }
}
