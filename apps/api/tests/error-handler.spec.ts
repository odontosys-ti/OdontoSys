import Fastify from 'fastify';
import { z } from 'zod';

import { AppError } from '../src/platform/erros';
import { registrarHandlerErro } from '../src/platform/http/error-handler';

async function requisitarComErro(erro: unknown) {
  const app = Fastify({ logger: false });
  registrarHandlerErro(app);
  app.get('/', async () => {
    throw erro;
  });

  try {
    return await app.inject({ method: 'GET', url: '/' });
  } finally {
    await app.close();
  }
}

describe('handler global de erros', () => {
  it('normaliza erros Zod com detalhes por campo', async () => {
    const resultado = z.object({ nome: z.string().min(1) }).safeParse({ nome: '' });
    if (resultado.success) throw new Error('fixture Zod inválida');

    const resposta = await requisitarComErro(resultado.error);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json()).toMatchObject({
      erro: {
        codigo: 'VALIDACAO_INVALIDA',
        detalhes: [{ campo: 'nome', mensagem: expect.any(String) }],
      },
      requestId: expect.any(String),
    });
  });

  it('aplica detalhes seguros quando a validação Fastify não informa campo nem mensagem', async () => {
    const erro = Object.assign(new Error('validação'), { validation: [{}] });

    const resposta = await requisitarComErro(erro);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json()).toMatchObject({
      erro: {
        codigo: 'VALIDACAO_INVALIDA',
        detalhes: [{ campo: 'requisicao', mensagem: 'Valor inválido' }],
      },
    });
  });

  it('preserva o catálogo para erros internos conhecidos', async () => {
    const resposta = await requisitarComErro(new AppError('ERRO_INTERNO'));

    expect(resposta.statusCode).toBe(500);
    expect(resposta.json()).toMatchObject({
      erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor', detalhes: [] },
    });
  });

  it('não expõe detalhes de erros inesperados', async () => {
    const resposta = await requisitarComErro(new Error('segredo interno'));

    expect(resposta.statusCode).toBe(500);
    expect(resposta.json()).toMatchObject({
      erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor', detalhes: [] },
      requestId: expect.any(String),
    });
    expect(resposta.body).not.toContain('segredo interno');
  });
});
