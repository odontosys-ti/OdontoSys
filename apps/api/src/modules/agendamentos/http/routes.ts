import {
  SchemaAtualizarAgendamento,
  SchemaAtualizarStatusAgendamento,
  SchemaAgendamentosDiaQuery,
  SchemaAgendamentoResponse,
  SchemaCriarAgendamento,
  SchemaIdParams,
  SchemaListaAgendamentos,
  SchemaListarAgendamentosQuery,
  type IdParams,
} from '@odontosys/contracts';
import type { FastifyInstance } from 'fastify';

import { contexto, exigirPapel } from '../../../platform/auth/jwt';
import { parseData } from '../../../platform/http/datas';
import { schemaRota } from '../../../platform/http/schema';
import { ServicoAgendamentos, serializarAgendamento } from '../application/servico';

export async function registrarRotasAgendamentos(app: FastifyInstance): Promise<void> {
  const servico = new ServicoAgendamentos();

  app.get(
    '/agendamentos/dia',
    {
      onRequest: [app.authenticate],
      schema: schemaRota({
        querystring: SchemaAgendamentosDiaQuery,
        resposta: SchemaListaAgendamentos,
        autenticada: true,
      }),
    },
    async (request) => {
      const query = SchemaAgendamentosDiaQuery.parse(request.query);
      const sessao = contexto(request);
      const lista = await servico.listarDia(sessao.clinicaId, query.data, query.profissionalId);
      return {
        dados: lista.itens.map(serializarAgendamento),
        paginacao: { pagina: 1, tamanho: 100, total: lista.total },
      };
    }
  );

  app.get(
    '/agendamentos',
    {
      onRequest: [app.authenticate],
      schema: schemaRota({
        querystring: SchemaListarAgendamentosQuery,
        resposta: SchemaListaAgendamentos,
        autenticada: true,
      }),
    },
    async (request) => {
      const query = SchemaListarAgendamentosQuery.parse(request.query);
      const sessao = contexto(request);
      const lista = await servico.listar(
        sessao.clinicaId,
        query.pagina,
        query.tamanho,
        parseData(query.de, 'de'),
        parseData(query.ate, 'ate'),
        query.profissionalId
      );
      return {
        dados: lista.itens.map(serializarAgendamento),
        paginacao: { pagina: query.pagina, tamanho: query.tamanho, total: lista.total },
      };
    }
  );

  app.post(
    '/agendamentos',
    {
      onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')],
      schema: schemaRota({
        body: SchemaCriarAgendamento,
        resposta: SchemaAgendamentoResponse,
        status: 201,
        autenticada: true,
      }),
    },
    async (request, reply) => {
      const body = SchemaCriarAgendamento.parse(request.body);
      const sessao = contexto(request);
      const criado = await servico.criar(sessao.clinicaId, sessao.usuarioId, {
        pacienteId: body.pacienteId,
        profissionalId: body.profissionalId,
        procedimentoId: body.procedimentoId,
        inicio: parseData(body.inicio, 'inicio'),
        justificativaLiberacao: body.justificativaLiberacao,
      });
      return reply.status(201).send(serializarAgendamento(criado));
    }
  );

  app.patch<{ Params: IdParams }>(
    '/agendamentos/:id',
    {
      onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')],
      schema: schemaRota({
        params: SchemaIdParams,
        body: SchemaAtualizarAgendamento,
        resposta: SchemaAgendamentoResponse,
        autenticada: true,
      }),
    },
    async (request) => {
      const params = SchemaIdParams.parse(request.params);
      const body = SchemaAtualizarAgendamento.parse(request.body);
      const sessao = contexto(request);
      const atualizado = await servico.reagendar(
        sessao.clinicaId,
        sessao.usuarioId,
        params.id,
        parseData(body.inicio, 'inicio')
      );
      return serializarAgendamento(atualizado);
    }
  );

  app.patch<{ Params: IdParams }>(
    '/agendamentos/:id/status',
    {
      onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')],
      schema: schemaRota({
        params: SchemaIdParams,
        body: SchemaAtualizarStatusAgendamento,
        resposta: SchemaAgendamentoResponse,
        autenticada: true,
      }),
    },
    async (request) => {
      const params = SchemaIdParams.parse(request.params);
      const body = SchemaAtualizarStatusAgendamento.parse(request.body);
      const sessao = contexto(request);
      const atualizado = await servico.atualizarStatus(
        sessao.clinicaId,
        sessao.usuarioId,
        params.id,
        body.status
      );
      return serializarAgendamento(atualizado);
    }
  );

  app.delete<{ Params: IdParams }>(
    '/agendamentos/:id',
    {
      onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')],
      schema: schemaRota({
        params: SchemaIdParams,
        resposta: SchemaAgendamentoResponse,
        autenticada: true,
      }),
    },
    async (request) => {
      const params = SchemaIdParams.parse(request.params);
      const sessao = contexto(request);
      return serializarAgendamento(
        await servico.cancelar(sessao.clinicaId, sessao.usuarioId, params.id)
      );
    }
  );
}
