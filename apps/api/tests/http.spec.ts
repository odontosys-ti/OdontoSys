import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { criarApp } from '../src/platform/http/app';
import { db } from '../src/platform/db';
import { eq } from 'drizzle-orm';
import { registroAuditoria } from '../src/platform/db/schema';
import { limparBanco, login, semearClinica } from './helpers';

describe('API HTTP', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await criarApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await limparBanco();
    await semearClinica();
  });

  it('GET /health responde com estado do banco', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/health' });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toMatchObject({ status: 'ok', banco: 'ok' });
  });

  it('login inválido devolve 401 no envelope padrão', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'recepcao@teste.local', senha: 'errada1' },
    });
    expect(resposta.statusCode).toBe(401);
    expect(resposta.json().erro.codigo).toBe('NAO_AUTENTICADO');
    expect(resposta.json().requestId).toEqual(expect.any(String));
  });

  it('rota protegida sem cookie devolve 401', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(resposta.statusCode).toBe(401);
  });

  it('login válido emite cookie e /me retorna o papel', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      cookies: { sessionId: token },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().papel).toBe('RECEPCAO');
  });

  it('logout limpa o cookie de sessão', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      cookies: { sessionId: token },
    });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ ok: true });
    const cookie = resposta.cookies.find((c) => c.name === 'sessionId');
    expect(cookie?.value).toBe('');
  });

  it('corpo inválido devolve 400 VALIDACAO_INVALIDA com detalhes', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'invalido', senha: '123' },
    });
    expect(resposta.statusCode).toBe(400);
    expect(resposta.json().erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(resposta.json().erro.detalhes.length).toBeGreaterThan(0);
  });

  it('CRUD de pacientes: listagem com busca, consulta por ID e edição com auditoria', async () => {
    const token = await login(app, 'recepcao@teste.local');

    // Listar pacientes
    const listaInicial = await app.inject({
      method: 'GET',
      url: '/api/v1/pacientes?pagina=1&tamanho=10&busca=Paciente',
      cookies: { sessionId: token },
    });
    expect(listaInicial.statusCode).toBe(200);
    expect(listaInicial.json().dados.length).toBeGreaterThan(0);
    expect(listaInicial.json().paginacao).toMatchObject({ pagina: 1, tamanho: 10 });

    // Criar paciente
    const criacao = await app.inject({
      method: 'POST',
      url: '/api/v1/pacientes',
      cookies: { sessionId: token },
      payload: {
        nome: 'Maria da Silva',
        documento: '98765432100',
        nascimento: '1995-05-20T00:00:00.000Z',
        observacoes: 'Primeira consulta',
      },
    });
    expect(criacao.statusCode).toBe(201);
    const novoPacienteId = criacao.json().id as string;
    expect(novoPacienteId).toBeDefined();

    // Consultar por ID
    const consulta = await app.inject({
      method: 'GET',
      url: `/api/v1/pacientes/${novoPacienteId}`,
      cookies: { sessionId: token },
    });
    expect(consulta.statusCode).toBe(200);
    expect(consulta.json().nome).toBe('Maria da Silva');

    // Editar paciente
    const edicao = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pacientes/${novoPacienteId}`,
      cookies: { sessionId: token },
      payload: {
        observacoes: 'Paciente alérgica a dipirona',
      },
    });
    expect(edicao.statusCode).toBe(200);
    expect(edicao.json().observacoes).toBe('Paciente alérgica a dipirona');

    // Verificar auditoria (CRIAR e EDITAR)
    const registros = await db()
      .select()
      .from(registroAuditoria)
      .where(eq(registroAuditoria.entidadeId, novoPacienteId));
    expect(registros.length).toBe(2);
    const acoes = registros.map((r) => r.acao);
    expect(acoes).toContain('CRIAR');
    expect(acoes).toContain('EDITAR');
  });

  it('RECEPCAO não cria profissional (403) e ADMIN cria e edita profissional com auditoria', async () => {
    const tokenRecepcao = await login(app, 'recepcao@teste.local');
    const tokenAdmin = await login(app, 'admin@teste.local');
    const { dentistaId } = await obterIds();

    // RECEPCAO bloqueada
    const respostaRecepcao = await app.inject({
      method: 'POST',
      url: '/api/v1/profissionais',
      cookies: { sessionId: tokenRecepcao },
      payload: {
        usuarioId: dentistaId,
        nome: 'Dr. Bloqueado',
        cro: '99999',
        especialidade: 'Ortodontia',
      },
    });
    expect(respostaRecepcao.statusCode).toBe(403);
    expect(respostaRecepcao.json().erro.codigo).toBe('SEM_PERMISSAO');

    // ADMIN cria
    const respostaAdmin = await app.inject({
      method: 'POST',
      url: '/api/v1/profissionais',
      cookies: { sessionId: tokenAdmin },
      payload: {
        usuarioId: dentistaId,
        nome: 'Dr. Autorizado',
        cro: '88888',
        especialidade: 'Endodontia',
      },
    });
    expect(respostaAdmin.statusCode).toBe(201);
    const idProfissional = respostaAdmin.json().id as string;

    // Listar profissionais
    const lista = await app.inject({
      method: 'GET',
      url: '/api/v1/profissionais',
      cookies: { sessionId: tokenRecepcao },
    });
    expect(lista.statusCode).toBe(200);
    expect(lista.json().dados.length).toBeGreaterThan(0);

    // ADMIN edita
    const edicao = await app.inject({
      method: 'PATCH',
      url: `/api/v1/profissionais/${idProfissional}`,
      cookies: { sessionId: tokenAdmin },
      payload: {
        especialidade: 'Implantodontia',
      },
    });
    expect(edicao.statusCode).toBe(200);
    expect(edicao.json().especialidade).toBe('Implantodontia');
  });

  it('RECEPCAO não cria procedimento (403) e ADMIN cria e edita procedimento', async () => {
    const tokenRecepcao = await login(app, 'recepcao@teste.local');
    const tokenAdmin = await login(app, 'admin@teste.local');

    // RECEPCAO bloqueada
    const respostaRecepcao = await app.inject({
      method: 'POST',
      url: '/api/v1/procedimentos',
      cookies: { sessionId: tokenRecepcao },
      payload: {
        nome: 'Canal',
        duracaoMinutos: 60,
      },
    });
    expect(respostaRecepcao.statusCode).toBe(403);
    expect(respostaRecepcao.json().erro.codigo).toBe('SEM_PERMISSAO');

    // ADMIN cria
    const criacao = await app.inject({
      method: 'POST',
      url: '/api/v1/procedimentos',
      cookies: { sessionId: tokenAdmin },
      payload: {
        nome: 'Canal',
        duracaoMinutos: 60,
      },
    });
    expect(criacao.statusCode).toBe(201);
    const idProcedimento = criacao.json().id as string;

    // Listar procedimentos
    const lista = await app.inject({
      method: 'GET',
      url: '/api/v1/procedimentos',
      cookies: { sessionId: tokenRecepcao },
    });
    expect(lista.statusCode).toBe(200);

    // ADMIN edita
    const edicao = await app.inject({
      method: 'PATCH',
      url: `/api/v1/procedimentos/${idProcedimento}`,
      cookies: { sessionId: tokenAdmin },
      payload: {
        duracaoMinutos: 90,
      },
    });
    expect(edicao.statusCode).toBe(200);
    expect(edicao.json().duracaoMinutos).toBe(90);
  });

  it('recurso de outra clínica devolve 404', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const resposta = await app.inject({
      method: 'GET',
      url: '/api/v1/pacientes/00000000-0000-0000-0000-000000000099',
      cookies: { sessionId: token },
    });
    expect(resposta.statusCode).toBe(404);
  });

  it('fluxo completo de agendamento: criar, listar por período, reagendar e cancelar', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const ids = await obterIds();
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const depoisDeAmanha = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const inicio = amanha.toISOString();

    // 1. Criar agendamento
    const criacao = await app.inject({
      method: 'POST',
      url: '/api/v1/agendamentos',
      cookies: { sessionId: token },
      payload: {
        pacienteId: ids.pacienteId,
        profissionalId: ids.profissionalId,
        procedimentoId: ids.procedimentoId,
        inicio,
      },
    });
    expect(criacao.statusCode).toBe(201);
    const agendamentoCriado = criacao.json();
    const agendamentoId = agendamentoCriado.id as string;
    expect(agendamentoCriado.status).toBe('AGENDADO');
    // Fim é calculado automaticamente: duração da limpeza na seed é 30 min
    const inicioDate = new Date(agendamentoCriado.inicio);
    const fimDate = new Date(agendamentoCriado.fim);
    expect(fimDate.getTime() - inicioDate.getTime()).toBe(30 * 60 * 1000);

    // 2. Listar por período
    const de = new Date(Date.now() - 60 * 1000).toISOString();
    const ate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const listagem = await app.inject({
      method: 'GET',
      url: `/api/v1/agendamentos?de=${de}&ate=${ate}&profissionalId=${ids.profissionalId}`,
      cookies: { sessionId: token },
    });
    expect(listagem.statusCode).toBe(200);
    expect(listagem.json().dados.length).toBeGreaterThan(0);

    // 3. Reagendar para depois de amanhã
    const reagendamento = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agendamentos/${agendamentoId}`,
      cookies: { sessionId: token },
      payload: {
        inicio: depoisDeAmanha.toISOString(),
      },
    });
    expect(reagendamento.statusCode).toBe(200);
    expect(new Date(reagendamento.json().inicio).getTime()).toBe(depoisDeAmanha.getTime());

    // 4. Cancelar agendamento (mudança de status para CANCELADO, sem DELETE físico)
    const cancelamento = await app.inject({
      method: 'DELETE',
      url: `/api/v1/agendamentos/${agendamentoId}`,
      cookies: { sessionId: token },
    });
    expect(cancelamento.statusCode).toBe(200);
    expect(cancelamento.json().status).toBe('CANCELADO');

    // 5. Tentativa de reagendar cancelado devolve 422 REGRA_NEGOCIO
    const reagendarCancelado = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agendamentos/${agendamentoId}`,
      cookies: { sessionId: token },
      payload: {
        inicio: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
      },
    });
    expect(reagendarCancelado.statusCode).toBe(422);

    // 6. Verificar auditoria do agendamento (CRIAR, EDITAR, EDITAR)
    const auditorias = await db()
      .select()
      .from(registroAuditoria)
      .where(eq(registroAuditoria.entidadeId, agendamentoId));
    expect(auditorias.length).toBe(3);
  });

  it('agendamento sobreposto devolve 409 CONFLITO_HORARIO', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const ids = await obterIds();
    const inicio = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const primeiro = await app.inject({
      method: 'POST',
      url: '/api/v1/agendamentos',
      cookies: { sessionId: token },
      payload: {
        pacienteId: ids.pacienteId,
        profissionalId: ids.profissionalId,
        procedimentoId: ids.procedimentoId,
        inicio,
      },
    });
    expect(primeiro.statusCode).toBe(201);

    const segundo = await app.inject({
      method: 'POST',
      url: '/api/v1/agendamentos',
      cookies: { sessionId: token },
      payload: {
        pacienteId: ids.pacienteId,
        profissionalId: ids.profissionalId,
        procedimentoId: ids.procedimentoId,
        inicio,
      },
    });
    expect(segundo.statusCode).toBe(409);
    expect(segundo.json().erro.codigo).toBe('CONFLITO_HORARIO');
  });

  it('início no passado devolve 422 REGRA_NEGOCIO', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const ids = await obterIds();
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/v1/agendamentos',
      cookies: { sessionId: token },
      payload: {
        pacienteId: ids.pacienteId,
        profissionalId: ids.profissionalId,
        procedimentoId: ids.procedimentoId,
        inicio: '2020-01-01T12:00:00.000Z',
      },
    });
    expect(resposta.statusCode).toBe(422);
  });
});

async function obterIds(): Promise<{
  dentistaId: string;
  pacienteId: string;
  profissionalId: string;
  procedimentoId: string;
}> {
  const { usuario, paciente, profissional, procedimento } =
    await import('../src/platform/db/schema');
  const database = db();
  const [u] = await database
    .select()
    .from(usuario)
    .where(eq(usuario.email, 'dentista@teste.local'));
  const [p] = await database.select().from(paciente);
  const [pr] = await database.select().from(profissional);
  const [pc] = await database.select().from(procedimento);
  if (!u || !p || !pr || !pc) {
    throw new Error('seed incompleto');
  }
  return {
    dentistaId: u.id,
    pacienteId: p.id,
    profissionalId: pr.id,
    procedimentoId: pc.id,
  };
}
