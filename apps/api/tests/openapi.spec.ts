import type { FastifyInstance } from 'fastify';

import { criarApp } from '../src/platform/http/app';

describe('OpenAPI', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await criarApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('documenta entrada e resposta de criação de paciente', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/docs/json' });
    const documento = resposta.json();
    const operacao = documento.paths['/api/v1/pacientes'].post;

    expect(operacao.requestBody.content['application/json'].schema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['nome', 'documento', 'nascimento']),
    });
    expect(operacao.responses['201'].content['application/json'].schema).toMatchObject({
      type: 'object',
    });
    expect(operacao.responses['400']).toBeDefined();
    expect(operacao.security).toEqual([{ cookieAuth: [] }]);
  });

  it('documenta cookie de sessão e parâmetros UUID', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/docs/json' });
    const documento = resposta.json();

    expect(documento.components.securitySchemes.cookieAuth).toEqual({
      type: 'apiKey',
      in: 'cookie',
      name: 'sessionId',
    });
    expect(documento.paths['/api/v1/pacientes/{id}'].get.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'id', in: 'path', required: true })])
    );
  });
});
