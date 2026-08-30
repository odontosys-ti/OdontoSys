import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { criarApp } from '../../src/platform/http/app';
import { FastifyInstance } from 'fastify';

describe('Auth (T-10)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await criarApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health retorna status ok', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });

  it('POST /auth/login com credenciais válidas retorna token', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'recepcao@odontosys.local',
        senha: 'senha123',
      },
    });

    expect(resposta.statusCode).toBe(200);
    const body = resposta.json();
    expect(body).toHaveProperty('usuarioId');
    expect(body).toHaveProperty('nome');
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('papel');
    expect(body.papel).toBe('RECEPCAO');
  });

  it('POST /auth/login com senha inválida retorna 401', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'recepcao@odontosys.local',
        senha: 'senhaerrada',
      },
    });

    expect(resposta.statusCode).toBe(401);
  });

  it('POST /auth/login com email inválido retorna 401', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'invalido@example.com',
        senha: 'senha123',
      },
    });

    expect(resposta.statusCode).toBe(401);
  });

  it('POST /auth/login com dados inválidos retorna 400', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'nao-eh-email',
        senha: '123',
      },
    });

    expect(resposta.statusCode).toBe(400);
  });

  it('GET /auth/me sem autenticação retorna 401', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: '/auth/me',
    });

    expect(resposta.statusCode).toBe(401);
  });

  it('GET /auth/me com token válido retorna usuário', async () => {
    // Faz login para obter token
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'recepcao@odontosys.local',
        senha: 'senha123',
      },
    });

    const cookies = loginResponse.cookies;
    const token = cookies.find((c) => c.name === 'sessionId')?.value;

    // Usa token para acessar /auth/me
    const meResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      cookies: { sessionId: token },
    });

    expect(meResponse.statusCode).toBe(200);
    const body = meResponse.json();
    expect(body.email).toBe('recepcao@odontosys.local');
    expect(body.papel).toBe('RECEPCAO');
  });

  it('POST /auth/logout com token válido limpa sessão', async () => {
    // Faz login para obter token
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'recepcao@odontosys.local',
        senha: 'senha123',
      },
    });

    const cookies = loginResponse.cookies;
    const token = cookies.find((c) => c.name === 'sessionId')?.value;

    // Faz logout
    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { sessionId: token },
    });

    expect(logoutResponse.statusCode).toBe(200);
  });
});
