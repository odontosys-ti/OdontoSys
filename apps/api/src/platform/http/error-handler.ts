import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { AppError, CatalogoErros } from '../erros';

type ErroValidacaoFastify = Error & {
  validation: Array<{
    instancePath?: string;
    message?: string;
    params?: { missingProperty?: string };
  }>;
};

type ErroRequisicaoFastify = Error & { statusCode?: number };

function ehErroValidacaoFastify(erro: unknown): erro is ErroValidacaoFastify {
  return (
    erro instanceof Error &&
    'validation' in erro &&
    Array.isArray((erro as { validation?: unknown }).validation)
  );
}

function ehErroRequisicaoFastify(erro: unknown): erro is ErroRequisicaoFastify {
  return erro instanceof Error && (erro as ErroRequisicaoFastify).statusCode === 400;
}

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

    if (ehErroValidacaoFastify(erro)) {
      request.log.info({ requestId }, 'validação inválida');
      return reply.status(400).send({
        erro: {
          codigo: 'VALIDACAO_INVALIDA',
          mensagem: CatalogoErros.VALIDACAO_INVALIDA.mensagem,
          detalhes: erro.validation.map((item) => ({
            campo:
              item.params?.missingProperty ?? item.instancePath?.replace(/^\//, '') ?? 'requisicao',
            mensagem: item.message ?? 'Valor inválido',
          })),
        },
        requestId,
      });
    }

    if (ehErroRequisicaoFastify(erro)) {
      request.log.info({ requestId }, 'requisição inválida');
      return reply.status(400).send({
        erro: {
          codigo: 'VALIDACAO_INVALIDA',
          mensagem: CatalogoErros.VALIDACAO_INVALIDA.mensagem,
          detalhes: [],
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
