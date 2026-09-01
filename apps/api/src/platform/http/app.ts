import Fastify, { type FastifyInstance } from 'fastify';
import { SchemaHealth } from '@odontosys/contracts';

import { registrarRotasAgendamentos } from '../../modules/agendamentos/http/routes';
import { registrarRotasAuth } from '../../modules/auth/http/routes';
import { registrarRotasPacientes } from '../../modules/pacientes/http/routes';
import { registrarRotasProcedimentos } from '../../modules/procedimentos/http/routes';
import { registrarRotasProfissionais } from '../../modules/profissionais/http/routes';
import { registrarPlugins } from '../auth/jwt';
import { env } from '../config';
import { pingBanco } from '../db';
import { criarOpcoesLogger } from '../logger';
import { criarUuidV7 } from '../uuid';
import { registrarHandlerErro } from './error-handler';
import { schemaRota } from './schema';

export async function criarApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: criarOpcoesLogger(),
    trustProxy: env().TRUST_PROXY,
    bodyLimit: 64 * 1024,
    genReqId: () => criarUuidV7(),
    requestIdHeader: 'x-request-id',
  });

  await registrarPlugins(app);
  registrarHandlerErro(app);

  app.get(
    '/health',
    { schema: schemaRota({ resposta: SchemaHealth, erros: [500, 503] }) },
    async (_request, reply) => {
      const bancoOk = await pingBanco();
      const status = bancoOk ? 'ok' : 'degradado';
      return reply.status(bancoOk ? 200 : 503).send({
        status,
        banco: bancoOk ? 'ok' : 'indisponivel',
        timestamp: new Date().toISOString(),
      });
    }
  );

  await app.register(
    async (api) => {
      await registrarRotasAuth(api);
      await registrarRotasPacientes(api);
      await registrarRotasProfissionais(api);
      await registrarRotasProcedimentos(api);
      await registrarRotasAgendamentos(api);
    },
    { prefix: '/api/v1' }
  );

  return app;
}

export async function iniciarApp(): Promise<void> {
  const configuracao = env();
  const app = await criarApp();

  const encerrar = async (): Promise<void> => {
    app.log.info('encerrando graciosamente');
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void encerrar();
  });
  process.on('SIGINT', () => {
    void encerrar();
  });

  await app.listen({ port: configuracao.API_PORT, host: '0.0.0.0' });
}
