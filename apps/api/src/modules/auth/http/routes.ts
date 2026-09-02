import type { FastifyInstance } from 'fastify';
import { SchemaLogin, SchemaLoginResponse, SchemaMeResponse, SchemaOk } from '@odontosys/contracts';

import { duracaoEmSegundos, env } from '../../../platform/config';
import { schemaRota } from '../../../platform/http/schema';
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
      onRequest: [app.csrfProtection],
      config: {
        rateLimit: {
          max: env().NODE_ENV === 'test' ? 1000 : 10,
          timeWindow: '1 minute',
        },
      },
      schema: schemaRota({
        body: SchemaLogin,
        resposta: SchemaLoginResponse,
        erros: [400, 401, 500],
      }),
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
        maxAge: duracaoEmSegundos(env().JWT_EXPIRES_IN),
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

  app.get(
    '/auth/me',
    {
      onRequest: [app.authenticate],
      schema: schemaRota({ resposta: SchemaMeResponse, autenticada: true, erros: [401, 404, 500] }),
    },
    async (request) => {
      const usuario = await obterUsuario.executar(request.user.usuarioId);
      return {
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        clinicaId: usuario.clinicaId,
      };
    }
  );

  app.post(
    '/auth/logout',
    {
      onRequest: [app.authenticate],
      schema: schemaRota({ resposta: SchemaOk, autenticada: true, erros: [400, 401, 500] }),
    },
    async (_request, reply) => {
      reply.clearCookie('sessionId', {
        httpOnly: true,
        secure: env().NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return { ok: true };
    }
  );
}
