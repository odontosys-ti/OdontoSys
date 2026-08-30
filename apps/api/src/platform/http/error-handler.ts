import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ErrorCatalog } from './erros';
import { logger } from './logger';

/**
 * Gera um requestId único
 */
function gerarRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Intercepta erros e converte em resposta padrão
 */
export function registrarHandlerGlobalErro(app: FastifyInstance): void {
  app.setErrorHandler(async (erro, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = gerarRequestId();

    // Erro de validação Zod
    if (erro instanceof ZodError) {
      logger.warn({ requestId, erro: erro.errors }, 'Validação inválida');
      return reply.status(400).send({
        erro: {
          codigo: 'VALIDACAO_INVALIDA',
          mensagem: 'Validação de dados falhou',
          detalhes: erro.errors.map((e) => ({
            campo: e.path.join('.'),
            mensagem: e.message,
          })),
        },
        requestId,
      });
    }

    // Erro de aplicação
    if (erro instanceof AppError) {
      if (erro.status !== 500) {
        logger.info({ requestId, codigo: erro.codigo }, 'Erro de negócio');
      } else {
        logger.error(
          { requestId, codigo: erro.codigo, stack: erro.stack },
          'Erro interno de aplicação',
        );
      }
      return reply.status(erro.status).send({
        erro: {
          codigo: erro.codigo,
          mensagem: erro.message,
          detalhes: erro.detalhes || [],
        },
        requestId,
      });
    }

    // Erro desconhecido
    logger.error(
      { requestId, erro: erro.message, stack: erro.stack },
      'Erro não tratado',
    );

    return reply.status(500).send({
      erro: {
        codigo: 'ERRO_INTERNO',
        mensagem: 'Erro interno do servidor',
        detalhes: [],
      },
      requestId,
    });
  });
}

/**
 * Hook para adicionar requestId à resposta
 */
export function adicionarRequestIdEmRespostas(app: FastifyInstance): void {
  app.addHook('preHandler', async (request: FastifyRequest) => {
    request.id = gerarRequestId();
  });
}
