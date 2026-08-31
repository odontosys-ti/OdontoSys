import {
  SchemaAtualizarProfissional,
  SchemaCriarProfissional,
  SchemaPaginacaoQuery,
} from '@odontosys/contracts';
import type { FastifyInstance } from 'fastify';

import { contexto, exigirPapel } from '../../../platform/auth/jwt';
import { ServicoProfissionais, serializarProfissional } from '../application/servico';

export async function registrarRotasProfissionais(app: FastifyInstance): Promise<void> {
  const servico = new ServicoProfissionais();

  app.get('/profissionais', { onRequest: [app.authenticate] }, async (request) => {
    const query = SchemaPaginacaoQuery.parse(request.query);
    const sessao = contexto(request);
    const lista = await servico.listar(sessao.clinicaId, query.pagina, query.tamanho, query.busca);
    return {
      dados: lista.itens.map(serializarProfissional),
      paginacao: { pagina: query.pagina, tamanho: query.tamanho, total: lista.total },
    };
  });

  app.post(
    '/profissionais',
    { onRequest: [app.authenticate, exigirPapel('ADMIN')] },
    async (request, reply) => {
      const body = SchemaCriarProfissional.parse(request.body);
      const sessao = contexto(request);
      const criado = await servico.criar(sessao.clinicaId, sessao.usuarioId, body);
      return reply.status(201).send(serializarProfissional(criado));
    }
  );

  app.patch(
    '/profissionais/:id',
    { onRequest: [app.authenticate, exigirPapel('ADMIN')] },
    async (request) => {
      const params = request.params as { id: string };
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

  app.get('/profissionais/:id', { onRequest: [app.authenticate] }, async (request) => {
    const params = request.params as { id: string };
    const sessao = contexto(request);
    return serializarProfissional(await servico.obter(sessao.clinicaId, params.id));
  });
}
