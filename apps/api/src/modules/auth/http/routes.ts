import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SchemaLogin, SchemaLoginResponse, SchemaMeResponse } from '@odontosys/contracts';
import { AppError } from '../../../platform/erros';
import { gerarToken, TokenPayload } from '../../../platform/auth/jwt';
import { CasoDeUsoAutenticar, CasoDeUsoObterUsuarioAutenticado } from '../application/autenticar';
import { UsuarioRepository, HashServiceArgon2 } from '../infra/usuario.repository';

export async function registrarRotasAuth(app: FastifyInstance): Promise<void> {
  const repositorio = new UsuarioRepository();
  const hashService = new HashServiceArgon2();
  const casoDeUsoAutenticar = new CasoDeUsoAutenticar(repositorio, hashService);
  const casoDeUsoObterUsuario = new CasoDeUsoObterUsuarioAutenticado(repositorio);

  /**
   * POST /auth/login
   * Autentica e emite cookie de sessão
   */
  app.post<{ Body: typeof SchemaLogin }>('/auth/login', async (request, reply) => {
    try {
      const body = SchemaLogin.parse(request.body);

      // Obter clinicaId do contexto (será adicionado depois)
      // Por agora, usar hardcoded para seed
      const clinicaId = '11111111-1111-1111-1111-111111111111';

      const usuario = await casoDeUsoAutenticar.executar(body.email, body.senha, clinicaId);

      // Gerar token
      const payload: TokenPayload = {
        usuarioId: usuario.id,
        clinicaId: usuario.clinicaId,
        papel: usuario.papel as 'RECEPCAO' | 'DENTISTA' | 'ADMIN',
        email: usuario.email,
      };

      const token = gerarToken(app, payload);

      // Definir cookie
      reply.setCookie('sessionId', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 dias
      });

      return SchemaLoginResponse.parse({
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        clinicaId: usuario.clinicaId,
      });
    } catch (erro) {
      if (erro instanceof Error && erro.message.includes('Usuário ou senha')) {
        throw new AppError('NAO_AUTENTICADO');
      }
      throw erro;
    }
  });

  /**
   * GET /auth/me
   * Retorna usuário autenticado
   * Requer token no cookie
   */
  app.get<{ Reply: typeof SchemaMeResponse }>(
    '/auth/me',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const usuarioId = (request.user as any).usuarioId;

      const usuario = await casoDeUsoObterUsuario.executar(usuarioId);

      return SchemaMeResponse.parse({
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        clinicaId: usuario.clinicaId,
      });
    },
  );

  /**
   * POST /auth/logout
   * Limpa cookie de sessão
   */
  app.post('/auth/logout', { onRequest: app.authenticate }, async (request, reply) => {
    reply.clearCookie('sessionId', { path: '/' });
    return { ok: true };
  });
}
