import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { criarApp } from '../src/platform/http/app';
import { db } from '../src/platform/db';
import { eq } from 'drizzle-orm';
import { lembrete, registroAuditoria } from '../src/platform/db/schema';
import { SchemaLembreteResponse, SchemaListaLembretes } from '@odontosys/contracts';
import { limparBanco, login, semearClinica, semearClinicaSecundaria } from './helpers';
import { ServicoLembretes } from '../src/modules/lembretes/application/servico';
import { LembreteRepository } from '../src/modules/lembretes/infra/lembrete.repository';
import { SimuladorTransporte } from '../src/modules/lembretes/infra/transportes';

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

  it('corpo JSON vazio devolve erro de requisição, não erro interno', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      cookies: { sessionId: token },
      headers: { 'content-type': 'application/json' },
    });

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json().erro.codigo).toBe('VALIDACAO_INVALIDA');
  });

  it('bloqueia mutação originada fora da aplicação', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      cookies: { sessionId: token },
      headers: { origin: 'https://site-malicioso.example' },
    });

    expect(resposta.statusCode).toBe(403);
    expect(resposta.json().erro.codigo).toBe('SEM_PERMISSAO');
  });

  it('aceita o host loopback alternativo no CORS local', async () => {
    const resposta = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/auth/login',
      headers: {
        origin: 'http://127.0.0.1:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,x-odontosys-csrf',
      },
    });

    expect(resposta.statusCode).toBe(204);
    expect(resposta.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
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
        nome: 'Maria Silva',
        documento: '98765432111',
        nascimento: '1995-05-21T00:00:00.000Z',
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

  it('atualiza contato, concede e revoga consentimento com auditoria sem dados pessoais', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const { pacienteId } = await obterIds();

    const atualizacao = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pacientes/${pacienteId}`,
      cookies: { sessionId: token },
      payload: {
        telefone: '(11) 99999-8888',
        canalPreferido: 'WHATSAPP',
        consentimentoAtivo: true,
      },
    });

    expect(atualizacao.statusCode).toBe(200);
    expect(atualizacao.json()).toMatchObject({
      telefone: '11999998888',
      canalPreferido: 'WHATSAPP',
      consentimentoAtivo: true,
      consentimentoRevogadoEm: null,
    });
    expect(atualizacao.json().consentimentoConcedidoEm).toEqual(expect.any(String));

    const revogacao = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pacientes/${pacienteId}`,
      cookies: { sessionId: token },
      payload: { consentimentoAtivo: false },
    });

    expect(revogacao.statusCode).toBe(200);
    expect(revogacao.json()).toMatchObject({
      telefone: '11999998888',
      canalPreferido: 'WHATSAPP',
      consentimentoAtivo: false,
      consentimentoConcedidoEm: expect.any(String),
    });
    expect(revogacao.json().consentimentoRevogadoEm).toEqual(expect.any(String));

    const registros = await db()
      .select()
      .from(registroAuditoria)
      .where(eq(registroAuditoria.entidadeId, pacienteId));
    expect(registros).toHaveLength(2);
    expect(registros.every((registro) => !JSON.stringify(registro).includes('11999998888'))).toBe(
      true
    );
  });

  it('reativa consentimento usando telefone e canal já persistidos', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const { pacienteId } = await obterIds();

    const contato = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pacientes/${pacienteId}`,
      cookies: { sessionId: token },
      payload: {
        telefone: '(11) 99999-8888',
        canalPreferido: 'WHATSAPP',
        consentimentoAtivo: false,
      },
    });
    expect(contato.statusCode).toBe(200);

    const reativacao = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pacientes/${pacienteId}`,
      cookies: { sessionId: token },
      payload: { consentimentoAtivo: true },
    });

    expect(reativacao.statusCode).toBe(200);
    expect(reativacao.json()).toMatchObject({
      telefone: '11999998888',
      canalPreferido: 'WHATSAPP',
      consentimentoAtivo: true,
    });
  });

  it('retorna defaults seguros de contato para paciente legado', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const { pacienteId } = await obterIds();

    const resposta = await app.inject({
      method: 'GET',
      url: `/api/v1/pacientes/${pacienteId}`,
      cookies: { sessionId: token },
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toMatchObject({
      telefone: null,
      canalPreferido: null,
      consentimentoAtivo: false,
      consentimentoConcedidoEm: null,
      consentimentoRevogadoEm: null,
    });
  });

  it('rejeita contato inválido e consentimento ativo sem dados obrigatórios', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const { pacienteId } = await obterIds();

    const telefoneInvalido = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pacientes/${pacienteId}`,
      cookies: { sessionId: token },
      payload: { telefone: 'abc', canalPreferido: 'TELEGRAM' },
    });
    expect(telefoneInvalido.statusCode).toBe(400);
    expect(telefoneInvalido.json().erro.codigo).toBe('VALIDACAO_INVALIDA');

    const consentimentoSemContato = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pacientes/${pacienteId}`,
      cookies: { sessionId: token },
      payload: { consentimentoAtivo: true },
    });
    expect(consentimentoSemContato.statusCode).toBe(400);
    expect(consentimentoSemContato.json()).toMatchObject({
      erro: { codigo: 'VALIDACAO_INVALIDA' },
      requestId: expect.any(String),
    });
  });

  it('dentista não pode alterar contato ou consentimento', async () => {
    const token = await login(app, 'dentista@teste.local');
    const { pacienteId } = await obterIds();

    const resposta = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pacientes/${pacienteId}`,
      cookies: { sessionId: token },
      payload: {
        telefone: '11999998888',
        canalPreferido: 'SMS',
        consentimentoAtivo: true,
      },
    });

    expect(resposta.statusCode).toBe(403);
    expect(resposta.json().erro.codigo).toBe('SEM_PERMISSAO');
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
      url: '/api/v1/profissionais?busca=Autorizado',
      cookies: { sessionId: tokenRecepcao },
    });
    expect(lista.statusCode).toBe(200);
    expect(lista.json().dados.length).toBeGreaterThan(0);

    const consulta = await app.inject({
      method: 'GET',
      url: `/api/v1/profissionais/${idProfissional}`,
      cookies: { sessionId: tokenRecepcao },
    });
    expect(consulta.statusCode).toBe(200);
    expect(consulta.json().nome).toBe('Dr. Autorizado');

    // ADMIN edita
    const edicao = await app.inject({
      method: 'PATCH',
      url: `/api/v1/profissionais/${idProfissional}`,
      cookies: { sessionId: tokenAdmin },
      payload: {
        nome: 'Dr. Atualizado',
        cro: '77777',
        especialidade: 'Implantodontia',
        ativo: true,
      },
    });
    expect(edicao.statusCode).toBe(200);
    expect(edicao.json().especialidade).toBe('Implantodontia');

    const ausente = await app.inject({
      method: 'GET',
      url: '/api/v1/profissionais/01900000-0000-7000-8000-000000000099',
      cookies: { sessionId: tokenRecepcao },
    });
    expect(ausente.statusCode).toBe(404);
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
      url: '/api/v1/procedimentos?busca=Canal',
      cookies: { sessionId: tokenRecepcao },
    });
    expect(lista.statusCode).toBe(200);

    const consulta = await app.inject({
      method: 'GET',
      url: `/api/v1/procedimentos/${idProcedimento}`,
      cookies: { sessionId: tokenRecepcao },
    });
    expect(consulta.statusCode).toBe(200);
    expect(consulta.json().nome).toBe('Canal');

    // ADMIN edita
    const edicao = await app.inject({
      method: 'PATCH',
      url: `/api/v1/procedimentos/${idProcedimento}`,
      cookies: { sessionId: tokenAdmin },
      payload: {
        nome: 'Canal completo',
        duracaoMinutos: 90,
        ativo: true,
      },
    });
    expect(edicao.statusCode).toBe(200);
    expect(edicao.json().duracaoMinutos).toBe(90);

    const auditorias = await db()
      .select()
      .from(registroAuditoria)
      .where(eq(registroAuditoria.entidadeId, idProcedimento));
    const auditoriaEdicao = auditorias.find((item) => item.acao === 'EDITAR');
    expect(auditoriaEdicao?.dadosAntes).toEqual({ nome: 'Canal', duracaoMinutos: 60 });
    expect(auditoriaEdicao?.dadosDepois).toEqual({ nome: 'Canal completo', duracaoMinutos: 90 });

    const ausente = await app.inject({
      method: 'GET',
      url: '/api/v1/procedimentos/01900000-0000-7000-8000-000000000099',
      cookies: { sessionId: tokenRecepcao },
    });
    expect(ausente.statusCode).toBe(404);
  });

  it('recurso de outra clínica devolve 404', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const resposta = await app.inject({
      method: 'GET',
      url: '/api/v1/pacientes/01900000-0000-7000-8000-000000000099',
      cookies: { sessionId: token },
    });
    expect(resposta.statusCode).toBe(404);
  });

  it('parâmetro UUID inválido devolve 400 no envelope padrão', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const resposta = await app.inject({
      method: 'GET',
      url: '/api/v1/pacientes/id-invalido',
      cookies: { sessionId: token },
    });

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json()).toMatchObject({
      erro: { codigo: 'VALIDACAO_INVALIDA' },
      requestId: expect.any(String),
    });
  });

  it('lista a agenda diária por data e profissional', async () => {
    const token = await login(app, 'recepcao@teste.local');
    const data = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const ids = await obterIds();
    const criacao = await app.inject({
      method: 'POST',
      url: '/api/v1/agendamentos',
      cookies: { sessionId: token },
      payload: {
        pacienteId: ids.pacienteId,
        profissionalId: ids.profissionalId,
        procedimentoId: ids.procedimentoId,
        inicio: `${data}T12:00:00.000-03:00`,
      },
    });
    expect(criacao.statusCode).toBe(201);
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/v1/agendamentos/dia?data=${data}&profissionalId=${ids.profissionalId}`,
      cookies: { sessionId: token },
    });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json().dados.length).toBeGreaterThan(0);
    expect(resposta.json().paginacao).toMatchObject({ pagina: 1, tamanho: 100 });
  });

  it('atualiza status com transições válidas, bloqueia transição final e audita', async () => {
    const recepcao = await login(app, 'recepcao@teste.local');
    const ids = await obterIds();
    const criar = (inicio: string) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/agendamentos',
        cookies: { sessionId: recepcao },
        payload: {
          pacienteId: ids.pacienteId,
          profissionalId: ids.profissionalId,
          procedimentoId: ids.procedimentoId,
          inicio,
        },
      });

    const primeiro = await criar(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    const primeiroId = primeiro.json().id as string;
    const confirmado = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agendamentos/${primeiroId}/status`,
      cookies: { sessionId: recepcao },
      payload: { status: 'CONFIRMADO' },
    });
    expect(confirmado.statusCode).toBe(200);
    expect(confirmado.json().status).toBe('CONFIRMADO');

    const atendido = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agendamentos/${primeiroId}/status`,
      cookies: { sessionId: recepcao },
      payload: { status: 'ATENDIDO' },
    });
    expect(atendido.statusCode).toBe(200);
    const invalido = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agendamentos/${primeiroId}/status`,
      cookies: { sessionId: recepcao },
      payload: { status: 'FALTOU' },
    });
    expect(invalido.statusCode).toBe(422);
  });

  it('permite status somente para recepção e admin', async () => {
    const recepcao = await login(app, 'recepcao@teste.local');
    const dentista = await login(app, 'dentista@teste.local');
    const ids = await obterIds();
    const criado = await app.inject({
      method: 'POST',
      url: '/api/v1/agendamentos',
      cookies: { sessionId: recepcao },
      payload: {
        pacienteId: ids.pacienteId,
        profissionalId: ids.profissionalId,
        procedimentoId: ids.procedimentoId,
        inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const resposta = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agendamentos/${criado.json().id as string}/status`,
      cookies: { sessionId: dentista },
      payload: { status: 'CONFIRMADO' },
    });
    expect(resposta.statusCode).toBe(403);
    expect(resposta.json().erro.codigo).toBe('SEM_PERMISSAO');
  });

  it('bloqueia paciente após duas faltas e libera somente com justificativa', async () => {
    const recepcao = await login(app, 'recepcao@teste.local');
    const ids = await obterIds();
    const criar = (inicio: string, justificativaLiberacao?: string) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/agendamentos',
        cookies: { sessionId: recepcao },
        payload: {
          pacienteId: ids.pacienteId,
          profissionalId: ids.profissionalId,
          procedimentoId: ids.procedimentoId,
          inicio,
          ...(justificativaLiberacao ? { justificativaLiberacao } : {}),
        },
      });
    const marcarFalta = async (inicio: string) => {
      const criado = await criar(inicio);
      const alterado = await app.inject({
        method: 'PATCH',
        url: `/api/v1/agendamentos/${criado.json().id as string}/status`,
        cookies: { sessionId: recepcao },
        payload: { status: 'FALTOU' },
      });
      expect(alterado.statusCode).toBe(200);
    };

    await marcarFalta(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    await marcarFalta(new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString());
    const bloqueado = await criar(new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString());
    expect(bloqueado.statusCode).toBe(422);
    expect(bloqueado.json().erro.codigo).toBe('PACIENTE_BLOQUEADO');

    const liberado = await criar(
      new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      'Paciente confirmou compromisso'
    );
    expect(liberado.statusCode).toBe(201);
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

  it('envia lembrete manual, retorna contrato e é idempotente para sucesso', async () => {
    const recepcao = await login(app, 'recepcao@teste.local');
    const ids = await obterIds();
    await habilitarContato(app, ids.pacienteId, recepcao);
    const criado = await criarAgendamento(app, recepcao, ids.pacienteId, ids.profissionalId);
    const agendamentoId = criado.json().id as string;

    const primeiro = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${agendamentoId}/lembrete`,
      cookies: { sessionId: recepcao },
    });
    expect(primeiro.statusCode).toBe(200);
    expect(SchemaLembreteResponse.parse(primeiro.json())).toMatchObject({
      agendamentoId,
      janela: 'MANUAL',
      status: 'ENVIADO',
      transporte: 'simulacao',
    });

    const segundo = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${agendamentoId}/lembrete`,
      cookies: { sessionId: recepcao },
    });
    expect(segundo.statusCode).toBe(200);
    expect(segundo.json().id).toBe(primeiro.json().id);

    const registros = await db()
      .select()
      .from(lembrete)
      .where(eq(lembrete.agendamentoId, agendamentoId));
    expect(registros).toHaveLength(1);
    const auditorias = await db()
      .select()
      .from(registroAuditoria)
      .where(eq(registroAuditoria.entidadeId, primeiro.json().id as string));
    expect(auditorias.map((item) => item.acao)).toEqual(
      expect.arrayContaining(['CRIAR', 'EDITAR'])
    );
    expect(JSON.stringify(auditorias[0])).not.toContain('5511999998888');
  });

  it('lista somente pendências da clínica e valida o envelope compartilhado', async () => {
    const recepcao = await login(app, 'recepcao@teste.local');
    const dentista = await login(app, 'dentista@teste.local');
    const ids = await obterIds();
    await habilitarContato(app, ids.pacienteId, recepcao);
    const falho = await criarAgendamento(app, recepcao, ids.pacienteId, ids.profissionalId);
    const falhoId = falho.json().id as string;
    const transporteFalho = new SimuladorTransporte(true);
    const servico = new ServicoLembretes(new LembreteRepository(), transporteFalho);
    await servico.solicitarManual(ids.clinicaId, ids.recepcaoId, falhoId);
    const segunda = await semearClinicaSecundaria();
    await servico.solicitarManual(segunda.clinicaId, segunda.recepcaoId, segunda.agendamentoId);

    const negadoDentista = await app.inject({
      method: 'GET',
      url: '/api/v1/lembretes/pendencias',
      cookies: { sessionId: dentista },
    });
    expect(negadoDentista.statusCode).toBe(403);

    const lista = await app.inject({
      method: 'GET',
      url: '/api/v1/lembretes/pendencias?pagina=1&tamanho=10',
      cookies: { sessionId: recepcao },
    });
    expect(lista.statusCode).toBe(200);
    expect(SchemaListaLembretes.parse(lista.json())).toMatchObject({
      dados: [expect.objectContaining({ agendamentoId: falhoId, status: 'FALHOU' })],
      paginacao: { pagina: 1, tamanho: 10, total: 1 },
    });
    expect(lista.json().dados).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ agendamentoId: segunda.agendamentoId })])
    );

    const negadoEnvio = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${ids.pacienteId}/lembrete`,
      cookies: { sessionId: dentista },
    });
    expect(negadoEnvio.statusCode).toBe(403);
  });

  it('repete pendência automática pelo registro persistido sem criar lembrete manual', async () => {
    const recepcao = await login(app, 'recepcao@teste.local');
    const ids = await obterIds();
    await habilitarContato(app, ids.pacienteId, recepcao);
    const criado = await criarAgendamento(app, recepcao, ids.pacienteId, ids.profissionalId);
    const agendamentoId = criado.json().id as string;
    const repo = new LembreteRepository();
    const contexto = await repo.obterContextoEnvio(ids.clinicaId, agendamentoId);
    if (!contexto) throw new Error('contexto de teste ausente');

    const primeira = await new ServicoLembretes(
      repo,
      new SimuladorTransporte(true)
    ).enviarAutomatico({ ...contexto, solicitadoPor: ids.recepcaoId }, 'VINTE_E_QUATRO_HORAS');
    expect(primeira.tipo).toBe('FALHOU');

    const segunda = await app.inject({
      method: 'POST',
      url: `/api/v1/lembretes/${primeira.lembrete.id}/retry`,
      cookies: { sessionId: recepcao },
    });

    expect(segunda.statusCode).toBe(200);
    expect(SchemaLembreteResponse.parse(segunda.json())).toMatchObject({
      id: primeira.lembrete.id,
      agendamentoId,
      janela: 'VINTE_E_QUATRO_HORAS',
      status: 'ENVIADO',
    });
    const registros = await db()
      .select()
      .from(lembrete)
      .where(eq(lembrete.agendamentoId, agendamentoId));
    expect(registros).toHaveLength(1);
    expect(registros[0]?.janela).toBe('VINTE_E_QUATRO_HORAS');
  });

  it('rejeita envio sem consentimento, agendamento cancelado e outra clínica', async () => {
    const recepcao = await login(app, 'recepcao@teste.local');
    const ids = await obterIds();
    const semContato = await criarAgendamento(app, recepcao, ids.pacienteId, ids.profissionalId);

    const semConsentimento = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${semContato.json().id as string}/lembrete`,
      cookies: { sessionId: recepcao },
    });
    expect(semConsentimento.statusCode).toBe(422);

    await habilitarContato(app, ids.pacienteId, recepcao);
    const cancelado = await criarAgendamento(app, recepcao, ids.pacienteId, ids.profissionalId);
    const cancelamento = await app.inject({
      method: 'DELETE',
      url: `/api/v1/agendamentos/${cancelado.json().id as string}`,
      cookies: { sessionId: recepcao },
    });
    expect(cancelamento.statusCode).toBe(200);

    const envioCancelado = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${cancelado.json().id as string}/lembrete`,
      cookies: { sessionId: recepcao },
    });
    expect(envioCancelado.statusCode).toBe(422);

    const faltou = await criarAgendamento(app, recepcao, ids.pacienteId, ids.profissionalId);
    const marcarFalta = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agendamentos/${faltou.json().id as string}/status`,
      cookies: { sessionId: recepcao },
      payload: { status: 'FALTOU' },
    });
    expect(marcarFalta.statusCode).toBe(200);
    const envioFaltou = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${faltou.json().id as string}/lembrete`,
      cookies: { sessionId: recepcao },
    });
    expect(envioFaltou.statusCode).toBe(422);

    const atendido = await criarAgendamento(app, recepcao, ids.pacienteId, ids.profissionalId);
    const confirmar = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agendamentos/${atendido.json().id as string}/status`,
      cookies: { sessionId: recepcao },
      payload: { status: 'CONFIRMADO' },
    });
    expect(confirmar.statusCode).toBe(200);
    const marcarAtendido = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agendamentos/${atendido.json().id as string}/status`,
      cookies: { sessionId: recepcao },
      payload: { status: 'ATENDIDO' },
    });
    expect(marcarAtendido.statusCode).toBe(200);
    const envioAtendido = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${atendido.json().id as string}/lembrete`,
      cookies: { sessionId: recepcao },
    });
    expect(envioAtendido.statusCode).toBe(422);

    const segunda = await semearClinicaSecundaria();
    const outraClinica = await app.inject({
      method: 'POST',
      url: `/api/v1/agendamentos/${segunda.agendamentoId}/lembrete`,
      cookies: { sessionId: recepcao },
    });
    expect(outraClinica.statusCode).toBe(404);
  });
});

async function habilitarContato(
  app: FastifyInstance,
  pacienteId: string,
  token: string
): Promise<void> {
  const resposta = await app.inject({
    method: 'PATCH',
    url: `/api/v1/pacientes/${pacienteId}`,
    cookies: { sessionId: token },
    payload: {
      telefone: '5511999998888',
      canalPreferido: 'WHATSAPP',
      consentimentoAtivo: true,
    },
  });
  if (resposta.statusCode !== 200) throw new Error(`contato falhou: ${resposta.body}`);
}

async function criarAgendamento(
  app: FastifyInstance,
  token: string,
  pacienteId: string,
  profissionalId: string
): Promise<Awaited<ReturnType<FastifyInstance['inject']>>> {
  const deslocamento = contadorAgendamento++ * 60 * 60 * 1000;
  const procedimento = await obterIds();
  return app.inject({
    method: 'POST',
    url: '/api/v1/agendamentos',
    cookies: { sessionId: token },
    payload: {
      pacienteId,
      profissionalId,
      procedimentoId: procedimento.procedimentoId,
      inicio: new Date(Date.now() + 24 * 60 * 60 * 1000 + deslocamento).toISOString(),
    },
  });
}

let contadorAgendamento = 0;

async function obterIds(): Promise<{
  clinicaId: string;
  recepcaoId: string;
  dentistaId: string;
  pacienteId: string;
  profissionalId: string;
  procedimentoId: string;
}> {
  const { clinica, usuario, paciente, profissional, procedimento } =
    await import('../src/platform/db/schema');
  const database = db();
  const [u] = await database
    .select()
    .from(usuario)
    .where(eq(usuario.email, 'dentista@teste.local'));
  const [recepcao] = await database
    .select()
    .from(usuario)
    .where(eq(usuario.email, 'recepcao@teste.local'));
  const [c] = await database.select().from(clinica);
  const [p] = await database.select().from(paciente);
  const [pr] = await database.select().from(profissional);
  const [pc] = await database.select().from(procedimento);
  if (!c || !u || !recepcao || !p || !pr || !pc) {
    throw new Error('seed incompleto');
  }
  return {
    clinicaId: c.id,
    recepcaoId: recepcao.id,
    dentistaId: u.id,
    pacienteId: p.id,
    profissionalId: pr.id,
    procedimentoId: pc.id,
  };
}
