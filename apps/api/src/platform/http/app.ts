import Fastify from 'fastify';
import { registrarRotasAuth } from '../../modules/auth/http/routes';
import { registrarHandlerGlobalErro, adicionarRequestIdEmRespostas } from './error-handler';
import { registrarPluginJwt } from '../auth/jwt';
import { logger } from '../logger';

export async function criarApp(): Promise<ReturnType<typeof Fastify>> {
  const app = Fastify({
    logger,
    trustProxy: true,
  });

  // Registrar plugins
  await registrarPluginJwt(app);

  // Hooks e middleware
  adicionarRequestIdEmRespostas(app);

  // Handler de erro global
  registrarHandlerGlobalErro(app);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Registrar rotas
  await registrarRotasAuth(app);

  return app;
}

export async function iniciarApp(porta: number = 3333): Promise<void> {
  const app = await criarApp();

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM recebido, encerrando graciosamente...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT recebido, encerrando graciosamente...');
    await app.close();
    process.exit(0);
  });

  try {
    await app.listen({ port: porta, host: '0.0.0.0' });
    logger.info(`🚀 API rodando em http://localhost:${porta}`);
  } catch (erro) {
    logger.error(erro, 'Erro ao iniciar aplicação');
    process.exit(1);
  }
}
