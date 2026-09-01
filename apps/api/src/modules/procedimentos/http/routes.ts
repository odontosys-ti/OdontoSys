import {
  SchemaAtualizarProcedimento,
  SchemaCriarProcedimento,
  SchemaIdParams,
  SchemaListaProcedimentos,
  SchemaPaginacaoQuery,
  SchemaProcedimentoResponse,
  type IdParams,
} from '@odontosys/contracts';
import type { FastifyInstance } from 'fastify';

import { contexto, exigirPapel } from '../../../platform/auth/jwt';
import { schemaRota } from '../../../platform/http/schema';
import { ServicoProcedimentos, serializarProcedimento } from '../application/servico';

export async function registrarRotasProcedimentos(app: FastifyInstance): Promise<void> {
  const servico = new ServicoProcedimentos();

  app.get(
    '/procedimentos',
    {
      onRequest: [app.authenticate],
      schema: schemaRota({
        querystring: SchemaPaginacaoQuery,
        resposta: SchemaListaProcedimentos,
        autenticada: true,
      }),
    },
    async (request) => {
      const query = SchemaPaginacaoQuery.parse(request.query);
      const sessao = contexto(request);
      const lista = await servico.listar(
        sessao.clinicaId,
        query.pagina,
        query.tamanho,
        query.busca
      );
      return {
        dados: lista.itens.map(serializarProcedimento),
        paginacao: { pagina: query.pagina, tamanho: query.tamanho, total: lista.total },
      };
    }
  );

  app.post(
    '/procedimentos',
    {
      onRequest: [app.authenticate, exigirPapel('ADMIN')],
      schema: schemaRota({
        body: SchemaCriarProcedimento,
        resposta: SchemaProcedimentoResponse,
        status: 201,
        autenticada: true,
      }),
    },
    async (request, reply) => {
      const body = SchemaCriarProcedimento.parse(request.body);
      const sessao = contexto(request);
      const criado = await servico.criar(sessao.clinicaId, sessao.usuarioId, body);
      return reply.status(201).send(serializarProcedimento(criado));
    }
  );

  app.patch<{ Params: IdParams }>(
    '/procedimentos/:id',
    {
      onRequest: [app.authenticate, exigirPapel('ADMIN')],
      schema: schemaRota({
        params: SchemaIdParams,
        body: SchemaAtualizarProcedimento,
        resposta: SchemaProcedimentoResponse,
        autenticada: true,
      }),
    },
    async (request) => {
      const params = SchemaIdParams.parse(request.params);
      const body = SchemaAtualizarProcedimento.parse(request.body);
      const sessao = contexto(request);
      const atualizado = await servico.atualizar(
        sessao.clinicaId,
        sessao.usuarioId,
        params.id,
        body
      );
      return serializarProcedimento(atualizado);
    }
  );

  app.get<{ Params: IdParams }>(
    '/procedimentos/:id',
    {
      onRequest: [app.authenticate],
      schema: schemaRota({
        params: SchemaIdParams,
        resposta: SchemaProcedimentoResponse,
        autenticada: true,
      }),
    },
    async (request) => {
      const params = SchemaIdParams.parse(request.params);
      const sessao = contexto(request);
      return serializarProcedimento(await servico.obter(sessao.clinicaId, params.id));
    }
  );
}
