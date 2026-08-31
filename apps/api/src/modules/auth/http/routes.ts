import type { FastifyInstance } from 'fastify';
import { SchemaLogin } from '@odontosys/contracts';

import { env } from '../../../platform/config';
import { CasoDeUsoAutenticar, CasoDeUsoObterUsuarioAutenticado } from '../application/autenticar';
import { HashServiceArgon2, UsuarioRepository } from '../infra/usuario.repository';

export async function registrarRotasAuth(app: FastifyInstance): Promise<void> {
  const repositorio = new UsuarioRepository();
  const hashService = new HashServiceArgon2();
  const autenticar = new CasoDeUsoAutenticar(repositorio, hashService);
  const obterUsuario = new CasoDeUsoObterUsuarioAutenticado(repositorio);

  app.post(
    '/auth/login',
    {
      config: {
        rateLimit: {
          max: env().NODE_ENV === 'test' ? 1000 : 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const body = SchemaLogin.parse(request.body);
      const usuario = await autenticar.executar(body.email, body.senha);
      const token = await reply.jwtSign({
        usuarioId: usuario.id,
        clinicaId: usuario.clinicaId,
        papel: usuario.papel,
      });

      reply.setCookie('sessionId', token, {
        httpOnly: true,
        secure: env().NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 8 * 60 * 60,
      });

      return {
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        clinicaId: usuario.clinicaId,
      };
    }
  );

  app.get('/auth/me', { onRequest: [app.authenticate] }, async (request) => {
    const usuario = await obterUsuario.executar(request.user.usuarioId);
    return {
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      clinicaId: usuario.clinicaId,
    };
  });

  app.post('/auth/logout', { onRequest: [app.authenticate] }, async (_request, reply) => {
    reply.clearCookie('sessionId', { path: '/' });
    return { ok: true };
  });
}
