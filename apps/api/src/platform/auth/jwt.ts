import { createHmac } from 'crypto';
import jwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';

/**
 * Registra plugin JWT para autenticação
 */
export async function registrarPluginJwt(app: FastifyInstance): Promise<void> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres');
  }

  await app.register(jwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    cookie: {
      cookieName: 'sessionId',
      signed: false,
    },
  });
}

/**
 * Payload do JWT
 */
export interface TokenPayload {
  usuarioId: string;
  clinicaId: string;
  papel: 'RECEPCAO' | 'DENTISTA' | 'ADMIN';
  email: string;
}

/**
 * Gera token JWT
 */
export function gerarToken(app: FastifyInstance, payload: TokenPayload): string {
  return app.jwt.sign(payload);
}

/**
 * Verifica token JWT
 */
export async function verificarToken(
  app: FastifyInstance,
  token: string,
): Promise<TokenPayload | null> {
  try {
    return (await app.jwt.verify(token)) as TokenPayload;
  } catch {
    return null;
  }
}
