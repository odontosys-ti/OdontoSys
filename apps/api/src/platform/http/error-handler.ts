import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { AppError, CatalogoErros } from '../erros';

export function registrarHandlerErro(app: FastifyInstance): void {
  app.setErrorHandler((erro: unknown, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id;

    if (erro instanceof ZodError) {
      request.log.info({ requestId }, 'validação inválida');
      return reply.status(400).send({
        erro: {
          codigo: 'VALIDACAO_INVALIDA',
          mensagem: CatalogoErros.VALIDACAO_INVALIDA.mensagem,
          detalhes: erro.issues.map((issue) => ({
            campo: issue.path.join('.'),
            mensagem: issue.message,
          })),
        },
        requestId,
      });
    }

    if (erro instanceof AppError) {
      if (erro.status >= 500) {
        request.log.error({ requestId, codigo: erro.codigo }, 'erro interno de aplicação');
      } else {
        request.log.info({ requestId, codigo: erro.codigo }, 'erro de negócio');
      }
      return reply.status(erro.status).send({
        erro: {
          codigo: erro.codigo,
          mensagem: erro.message,
          detalhes: erro.detalhes,
        },
        requestId,
      });
    }

    request.log.error({ requestId, err: erro }, 'erro não tratado');
    return reply.status(500).send({
      erro: {
        codigo: 'ERRO_INTERNO',
        mensagem: CatalogoErros.ERRO_INTERNO.mensagem,
        detalhes: [],
      },
      requestId,
    });
  });
}
