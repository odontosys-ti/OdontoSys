import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance, FastifyRequest } from 'fastify';

import type { Papel } from '@odontosys/contracts';

import { env } from '../config';
import { AppError } from '../erros';

export type TokenPayload = {
  usuarioId: string;
  clinicaId: string;
  papel: Papel;
};

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export async function registrarPlugins(app: FastifyInstance): Promise<void> {
  const configuracao = env();

  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: configuracao.WEB_ORIGIN,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(jwt, {
    secret: configuracao.JWT_SECRET,
    sign: { expiresIn: configuracao.JWT_EXPIRES_IN },
    cookie: {
      cookieName: 'sessionId',
      signed: false,
    },
  });
  await app.register(rateLimit, {
    global: false,
  });
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'OdontoSys API',
        version: '0.1.0',
        description: 'API base da Sprint 0 — cadastros e agendamento simples.',
      },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError('NAO_AUTENTICADO');
    }
  });
}

export function exigirPapel(...papeis: Papel[]) {
  return async (request: FastifyRequest): Promise<void> => {
    if (!papeis.includes(request.user.papel)) {
      throw new AppError('SEM_PERMISSAO');
    }
  };
}

export function contexto(request: FastifyRequest): TokenPayload {
  return request.user;
}
