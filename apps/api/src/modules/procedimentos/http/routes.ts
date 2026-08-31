import {
  SchemaAtualizarProcedimento,
  SchemaCriarProcedimento,
  SchemaPaginacaoQuery,
} from '@odontosys/contracts';
import type { FastifyInstance } from 'fastify';

import { contexto, exigirPapel } from '../../../platform/auth/jwt';
import {
  atualizarProcedimento,
  criarProcedimento,
  listarProcedimentos,
  obterProcedimento,
  serializarProcedimento,
} from '../application/servico';

export async function registrarRotasProcedimentos(app: FastifyInstance): Promise<void> {
  app.get('/procedimentos', { onRequest: [app.authenticate] }, async (request) => {
    const query = SchemaPaginacaoQuery.parse(request.query);
    const sessao = contexto(request);
    const lista = await listarProcedimentos(
      sessao.clinicaId,
      query.pagina,
      query.tamanho,
      query.busca
    );
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
      const criado = await criarProcedimento(sessao.clinicaId, sessao.usuarioId, body);
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
      const atualizado = await atualizarProcedimento(
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
    return serializarProcedimento(await obterProcedimento(sessao.clinicaId, params.id));
  });
}
