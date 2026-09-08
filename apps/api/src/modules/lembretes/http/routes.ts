import {
  SchemaIdParams,
  SchemaLembreteResponse,
  SchemaListaLembretes,
  SchemaListarPendenciasQuery,
  SchemaSolicitarLembreteManual,
  SchemaSolicitarLembreteRetry,
  type IdParams,
} from '@odontosys/contracts';
import type { FastifyInstance } from 'fastify';

import { contexto, exigirPapel } from '../../../platform/auth/jwt';
import { schemaRota } from '../../../platform/http/schema';
import { serializarLembrete } from '../application/servico';
import { criarServicoLembretesHttp } from './composicao';

export async function registrarRotasLembretes(app: FastifyInstance): Promise<void> {
  const servico = criarServicoLembretesHttp();

  app.post<{ Params: IdParams }>(
    '/agendamentos/:id/lembrete',
    {
      onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')],
      schema: schemaRota({
        params: SchemaIdParams,
        resposta: SchemaLembreteResponse,
        autenticada: true,
      }),
    },
    async (request) => {
      const params = SchemaIdParams.parse(request.params);
      SchemaSolicitarLembreteManual.parse(request.body ?? {});
      const sessao = contexto(request);
      const lembrete = await servico.solicitarManual(sessao.clinicaId, sessao.usuarioId, params.id);
      return serializarLembrete(lembrete);
    }
  );

  app.post<{ Params: IdParams }>(
    '/lembretes/:id/retry',
    {
      onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')],
      schema: schemaRota({
        params: SchemaIdParams,
        resposta: SchemaLembreteResponse,
        autenticada: true,
      }),
    },
    async (request) => {
      const params = SchemaIdParams.parse(request.params);
      SchemaSolicitarLembreteRetry.parse(request.body ?? {});
      const sessao = contexto(request);
      const lembrete = await servico.tentarNovamente(sessao.clinicaId, sessao.usuarioId, params.id);
      return serializarLembrete(lembrete);
    }
  );

  app.get(
    '/lembretes/pendencias',
    {
      onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')],
      schema: schemaRota({
        querystring: SchemaListarPendenciasQuery,
        resposta: SchemaListaLembretes,
        autenticada: true,
      }),
    },
    async (request) => {
      const query = SchemaListarPendenciasQuery.parse(request.query);
      const sessao = contexto(request);
      const lista = await servico.listarPendencias(sessao.clinicaId, query.pagina, query.tamanho);
      return {
        dados: lista.itens.map(serializarLembrete),
        paginacao: { pagina: query.pagina, tamanho: query.tamanho, total: lista.total },
      };
    }
  );
}
