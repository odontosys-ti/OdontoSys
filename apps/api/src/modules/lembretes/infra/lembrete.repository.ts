import { and, count, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';

import { registrarAuditoria } from '../../../platform/auditoria/service';
import { db } from '../../../platform/db';
import { agendamento, clinica, lembrete, paciente } from '../../../platform/db/schema';
import { criarUuidV7 } from '../../../platform/uuid';
import {
  sanitizarResultadoTransporte,
  type ContextoAutomaticoLembrete,
  type ContextoEnvioLembrete,
  type EntradaReivindicacaoLembrete,
  type ILembreteRepository,
  type ILembreteAutomaticoRepository,
  type Lembrete,
  type ListaLembretes,
  type ResultadoPersistenciaLembrete,
  type ReivindicacaoLembrete,
} from '../domain/lembrete';

export const LEASE_LEMBRETE_MS = 30_000;

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
    emProcessamento: linha.emProcessamento,
    claimToken: linha.claimToken,
    claimExpiraEm: linha.claimExpiraEm,
    solicitadoPor: linha.solicitadoPor,
    criadoEm: linha.criadoEm,
    atualizadoEm: linha.atualizadoEm,
  };
}

export class LembreteRepository implements ILembreteRepository, ILembreteAutomaticoRepository {
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
    return linhas[0] ?? null;
  }

  async listarContextosAutomaticos(de: Date, ate: Date): Promise<ContextoAutomaticoLembrete[]> {
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
        solicitadoPor: agendamento.criadoPor,
      })
      .from(agendamento)
      .innerJoin(paciente, eq(paciente.id, agendamento.pacienteId))
      .innerJoin(clinica, eq(clinica.id, agendamento.clinicaId))
      .where(and(gte(agendamento.inicio, de), lte(agendamento.inicio, ate)))
      .orderBy(agendamento.inicio);
    return linhas;
  }

  async reivindicar(entrada: EntradaReivindicacaoLembrete): Promise<ReivindicacaoLembrete> {
    return db().transaction(async (tx) => {
      const agora = new Date();
      const expiraEm = new Date(agora.getTime() + (entrada.leaseMs ?? LEASE_LEMBRETE_MS));
      const claimToken = criarUuidV7();
      const chave = and(
        eq(lembrete.clinicaId, entrada.clinicaId),
        eq(lembrete.agendamentoId, entrada.agendamentoId),
        eq(lembrete.janela, entrada.janela),
        eq(lembrete.canal, entrada.canal)
      );

      let [existente] = await tx.select().from(lembrete).where(chave).for('update');
      if (!existente) {
        const [criado] = await tx
          .insert(lembrete)
          .values({
            id: criarUuidV7(),
            clinicaId: entrada.clinicaId,
            agendamentoId: entrada.agendamentoId,
            pacienteId: entrada.pacienteId,
            canal: entrada.canal,
            janela: entrada.janela,
            status: 'FALHOU',
            transporte: entrada.transporte,
            providerId: null,
            codigoFalha: 'EM_PROCESSAMENTO',
            mensagemFalha: 'Envio em processamento.',
            emProcessamento: true,
            claimToken,
            claimExpiraEm: expiraEm,
            solicitadoPor: entrada.solicitadoPor,
            criadoEm: agora,
            atualizadoEm: agora,
          })
          .onConflictDoNothing({
            target: [lembrete.agendamentoId, lembrete.janela, lembrete.canal],
          })
          .returning();

        if (criado) {
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
          return {
            tipo: 'DISPARAR',
            lembrete: mapear(criado),
            claimToken,
            idempotenciaKey: entrada.idempotenciaKey,
          };
        }

        [existente] = await tx.select().from(lembrete).where(chave).for('update');
      }

      if (!existente) throw new Error('Falha ao reivindicar lembrete');
      if (['ENVIADO', 'ENTREGUE'].includes(existente.status) && !existente.emProcessamento) {
        return { tipo: 'IDEMPOTENTE', lembrete: mapear(existente) };
      }
      if (
        existente.emProcessamento &&
        existente.claimExpiraEm !== null &&
        existente.claimExpiraEm > agora
      ) {
        return { tipo: 'EM_PROCESSAMENTO', lembrete: mapear(existente) };
      }

      const [reivindicado] = await tx
        .update(lembrete)
        .set({
          transporte: entrada.transporte,
          emProcessamento: true,
          claimToken,
          claimExpiraEm: expiraEm,
          solicitadoPor: entrada.solicitadoPor,
          atualizadoEm: agora,
        })
        .where(eq(lembrete.id, existente.id))
        .returning();
      if (!reivindicado) throw new Error('Falha ao atualizar reivindicação do lembrete');
      await registrarAuditoria(tx, {
        clinicaId: entrada.clinicaId,
        usuarioId: entrada.solicitadoPor,
        entidade: 'lembrete',
        entidadeId: reivindicado.id,
        acao: 'EDITAR',
        dadosAntes: { status: existente.status },
        dadosDepois: {
          canal: entrada.canal,
          janela: entrada.janela,
          status: reivindicado.status,
          transporte: entrada.transporte,
          tentativa: 'RETRY',
        },
      });
      return {
        tipo: 'DISPARAR',
        lembrete: mapear(reivindicado),
        claimToken,
        idempotenciaKey: entrada.idempotenciaKey,
      };
    });
  }

  async renovarClaim(entrada: {
    lembreteId: string;
    claimToken: string;
    leaseMs: number;
  }): Promise<boolean> {
    const agora = new Date();
    const atualizado = await db()
      .update(lembrete)
      .set({
        claimExpiraEm: new Date(agora.getTime() + entrada.leaseMs),
        atualizadoEm: agora,
      })
      .where(
        and(
          eq(lembrete.id, entrada.lembreteId),
          eq(lembrete.claimToken, entrada.claimToken),
          eq(lembrete.emProcessamento, true)
        )
      )
      .returning({ id: lembrete.id });
    return atualizado.length === 1;
  }

  async finalizar(entrada: ResultadoPersistenciaLembrete): Promise<Lembrete> {
    return db().transaction(async (tx) => {
      const resultado = sanitizarResultadoTransporte(entrada.resultado);
      const agora = new Date();
      const [atualizado] = await tx
        .update(lembrete)
        .set({
          status: resultado.status,
          transporte: entrada.transporte,
          providerId: resultado.providerId,
          codigoFalha: resultado.codigoFalha,
          mensagemFalha: resultado.mensagemFalha,
          emProcessamento: false,
          claimToken: null,
          claimExpiraEm: null,
          solicitadoPor: entrada.solicitadoPor,
          atualizadoEm: agora,
        })
        .where(
          and(
            eq(lembrete.id, entrada.lembreteId),
            eq(lembrete.claimToken, entrada.claimToken),
            eq(lembrete.emProcessamento, true)
          )
        )
        .returning();

      const finalizado =
        atualizado ??
        (
          await tx
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
            .limit(1)
        )[0];
      if (!finalizado) throw new Error('Falha ao finalizar lembrete');
      if (atualizado) {
        await registrarAuditoria(tx, {
          clinicaId: entrada.clinicaId,
          usuarioId: entrada.solicitadoPor,
          entidade: 'lembrete',
          entidadeId: atualizado.id,
          acao: 'EDITAR',
          dadosAntes: { status: 'EM_PROCESSAMENTO' },
          dadosDepois: {
            canal: entrada.canal,
            janela: entrada.janela,
            status: atualizado.status,
            transporte: entrada.transporte,
          },
        });
      }
      return mapear(finalizado);
    });
  }

  async listarPendencias(
    clinicaId: string,
    pagina: number,
    tamanho: number
  ): Promise<ListaLembretes> {
    const agora = new Date();
    const filtro = and(
      eq(lembrete.clinicaId, clinicaId),
      eq(lembrete.status, 'FALHOU'),
      or(
        eq(lembrete.emProcessamento, false),
        and(
          eq(lembrete.emProcessamento, true),
          or(isNull(lembrete.claimExpiraEm), lte(lembrete.claimExpiraEm, agora))
        )
      )
    );
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
