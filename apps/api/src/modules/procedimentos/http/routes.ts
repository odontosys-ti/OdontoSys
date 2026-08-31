import {
  SchemaAtualizarProcedimento,
  SchemaCriarProcedimento,
  SchemaPaginacaoQuery,
} from '@odontosys/contracts';
import type { FastifyInstance } from 'fastify';

import { contexto, exigirPapel } from '../../../platform/auth/jwt';
import { ServicoProcedimentos, serializarProcedimento } from '../application/servico';

export async function registrarRotasProcedimentos(app: FastifyInstance): Promise<void> {
  const servico = new ServicoProcedimentos();

  app.get('/procedimentos', { onRequest: [app.authenticate] }, async (request) => {
    const query = SchemaPaginacaoQuery.parse(request.query);
    const sessao = contexto(request);
    const lista = await servico.listar(sessao.clinicaId, query.pagina, query.tamanho, query.busca);
    return {
      dados: lista.itens.map(serializarProcedimento),
      paginacao: { pagina: query.pagina, tamanho: query.tamanho, total: lista.total },
    };
  });

  app.post(
    '/procedimentos',
    { onRequest: [app.authenticate, exigirPapel('ADMIN')] },
    async (request, reply) => {
      const body = SchemaCriarProcedimento.parse(request.body);
      const sessao = contexto(request);
      const criado = await servico.criar(sessao.clinicaId, sessao.usuarioId, body);
      return reply.status(201).send(serializarProcedimento(criado));
    }
  );

  app.patch(
    '/procedimentos/:id',
    { onRequest: [app.authenticate, exigirPapel('ADMIN')] },
    async (request) => {
      const params = request.params as { id: string };
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

  app.get('/procedimentos/:id', { onRequest: [app.authenticate] }, async (request) => {
    const params = request.params as { id: string };
    const sessao = contexto(request);
    return serializarProcedimento(await servico.obter(sessao.clinicaId, params.id));
  });
}
