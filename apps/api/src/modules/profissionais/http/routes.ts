import {
  SchemaAtualizarProfissional,
  SchemaCriarProfissional,
  SchemaIdParams,
  SchemaListaProfissionais,
  SchemaPaginacaoQuery,
  SchemaProfissionalResponse,
  type IdParams,
} from '@odontosys/contracts';
import type { FastifyInstance } from 'fastify';

import { contexto, exigirPapel } from '../../../platform/auth/jwt';
import { schemaRota } from '../../../platform/http/schema';
import { ServicoProfissionais, serializarProfissional } from '../application/servico';

export async function registrarRotasProfissionais(app: FastifyInstance): Promise<void> {
  const servico = new ServicoProfissionais();

  app.get(
    '/profissionais',
    {
      onRequest: [app.authenticate],
      schema: schemaRota({
        querystring: SchemaPaginacaoQuery,
        resposta: SchemaListaProfissionais,
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
        dados: lista.itens.map(serializarProfissional),
        paginacao: { pagina: query.pagina, tamanho: query.tamanho, total: lista.total },
      };
    }
  );

  app.post(
    '/profissionais',
    {
      onRequest: [app.authenticate, exigirPapel('ADMIN')],
      schema: schemaRota({
        body: SchemaCriarProfissional,
        resposta: SchemaProfissionalResponse,
        status: 201,
        autenticada: true,
      }),
    },
    async (request, reply) => {
      const body = SchemaCriarProfissional.parse(request.body);
      const sessao = contexto(request);
      const criado = await servico.criar(sessao.clinicaId, sessao.usuarioId, body);
      return reply.status(201).send(serializarProfissional(criado));
    }
  );

  app.patch<{ Params: IdParams }>(
    '/profissionais/:id',
    {
      onRequest: [app.authenticate, exigirPapel('ADMIN')],
      schema: schemaRota({
        params: SchemaIdParams,
        body: SchemaAtualizarProfissional,
        resposta: SchemaProfissionalResponse,
        autenticada: true,
      }),
    },
    async (request) => {
      const params = SchemaIdParams.parse(request.params);
      const body = SchemaAtualizarProfissional.parse(request.body);
      const sessao = contexto(request);
      const atualizado = await servico.atualizar(
        sessao.clinicaId,
        sessao.usuarioId,
        params.id,
        body
      );
      return serializarProfissional(atualizado);
    }
  );

  app.get<{ Params: IdParams }>(
    '/profissionais/:id',
    {
      onRequest: [app.authenticate],
      schema: schemaRota({
        params: SchemaIdParams,
        resposta: SchemaProfissionalResponse,
        autenticada: true,
      }),
    },
    async (request) => {
      const params = SchemaIdParams.parse(request.params);
      const sessao = contexto(request);
      return serializarProfissional(await servico.obter(sessao.clinicaId, params.id));
    }
  );
}
