import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';

import { executarPassadaLembretes } from '../scripts/lembretes';
import { criarApp } from '../src/platform/http/app';
import { db, fecharDb } from '../src/platform/db';
import { lembrete, registroAuditoria } from '../src/platform/db/schema';
import { limparBanco, login, semearClinica, semearClinicaSecundaria } from './helpers';

describe('Release 2 — fluxo integrado de lembrete', () => {
  let app: FastifyInstance;
  let ids: Awaited<ReturnType<typeof semearClinica>>;

  beforeAll(async () => {
    app = await criarApp();
  });

  afterAll(async () => {
    await app.close();
    await fecharDb();
  });

  beforeEach(async () => {
    await limparBanco();
    ids = await semearClinica();
  });

  it('percorre paciente consentido, agenda, manual e worker automático idempotente', async () => {
    const sessao = await login(app, 'recepcao@teste.local');
    const pacienteCriado = await app.inject({
      method: 'POST',
      url: '/api/v1/pacientes',
      cookies: { sessionId: sessao },
      payload: {
        nome: 'Paciente E2E',
        documento: '00000000001',
        nascimento: '1990-01-01T00:00:00.000Z',
        observacoes: '',
      },
    });
    expect(pacienteCriado.statusCode).toBe(201);
    const pacienteId = pacienteCriado.json().id as string;

    const consentimento = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pacientes/${pacienteId}`,
      cookies: { sessionId: sessao },
      payload: {
        telefone: '5500000000000',
        canalPreferido: 'WHATSAPP',
        consentimentoAtivo: true,
      },
    });
    expect(consentimento.statusCode).toBe(200);
    expect(consentimento.json()).toMatchObject({ consentimentoAtivo: true });

    const agoraWorker = new Date('2026-09-10T11:00:00.000Z');
    const inicio = new Date('2026-09-11T11:00:00.000Z');
    const agenda = await app.inject({
      method: 'POST',
      url: '/api/v1/agendamentos',
      cookies: { sessionId: sessao },
      payload: {
        pacienteId,
        profissionalId: ids.profissionalId,
        procedimentoId: ids.procedimentoId,
        inicio: inicio.toISOString(),
      },
    });
    expect(agenda.statusCode).toBe(201);
    const agendamentoId = agenda.json().id as string;

    const manual = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${agendamentoId}/lembrete`,
      cookies: { sessionId: sessao },
    });
    expect(manual.statusCode).toBe(200);
    expect(manual.json()).toMatchObject({ janela: 'MANUAL', status: 'ENVIADO' });

    const segundaClinica = await semearClinicaSecundaria();
    const acessoCruzado = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${segundaClinica.agendamentoId}/lembrete`,
      cookies: { sessionId: sessao },
    });
    expect(acessoCruzado.statusCode).toBe(404);

    const primeiraPassada = await executarPassadaLembretes(agoraWorker);
    const segundaPassada = await executarPassadaLembretes(agoraWorker);
    const lembretes = await db()
      .select()
      .from(lembrete)
      .where(and(eq(lembrete.clinicaId, ids.clinicaId), eq(lembrete.agendamentoId, agendamentoId)));
    const auditorias = await db()
      .select()
      .from(registroAuditoria)
      .where(
        and(
          eq(registroAuditoria.clinicaId, ids.clinicaId),
          eq(registroAuditoria.entidade, 'lembrete')
        )
      );

    expect(primeiraPassada).toMatchObject({ selecionados: 1, enviados: 1, falhas: 0 });
    expect(segundaPassada).toMatchObject({ selecionados: 1, enviados: 0, duplicados: 1 });
    expect(lembretes).toHaveLength(2);
    expect(lembretes.map((item) => item.janela)).toEqual(
      expect.arrayContaining(['MANUAL', 'VINTE_E_QUATRO_HORAS'])
    );
    expect(lembretes.every((item) => item.status === 'ENVIADO')).toBe(true);
    expect(auditorias.filter((item) => item.entidade === 'lembrete')).toHaveLength(4);
    expect(JSON.stringify({ primeiraPassada, segundaPassada })).not.toContain('5500000000000');
    expect(JSON.stringify({ primeiraPassada, segundaPassada })).not.toContain('Paciente E2E');
  });
});
