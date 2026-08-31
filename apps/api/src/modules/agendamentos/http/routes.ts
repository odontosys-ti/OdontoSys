import {
  SchemaAtualizarAgendamento,
  SchemaCriarAgendamento,
  SchemaListarAgendamentosQuery,
} from '@odontosys/contracts';
import type { FastifyInstance } from 'fastify';

import { contexto, exigirPapel } from '../../../platform/auth/jwt';
import { parseData } from '../../../platform/http/datas';
import { ServicoAgendamentos, serializarAgendamento } from '../application/servico';

export async function registrarRotasAgendamentos(app: FastifyInstance): Promise<void> {
  const servico = new ServicoAgendamentos();

  app.get('/agendamentos', { onRequest: [app.authenticate] }, async (request) => {
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
  });

  app.post(
    '/agendamentos',
    { onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')] },
    async (request, reply) => {
      const body = SchemaCriarAgendamento.parse(request.body);
      const sessao = contexto(request);
      const criado = await servico.criar(sessao.clinicaId, sessao.usuarioId, {
        pacienteId: body.pacienteId,
        profissionalId: body.profissionalId,
        procedimentoId: body.procedimentoId,
        inicio: parseData(body.inicio, 'inicio'),
      });
      return reply.status(201).send(serializarAgendamento(criado));
    }
  );

  app.patch(
    '/agendamentos/:id',
    { onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')] },
    async (request) => {
      const params = request.params as { id: string };
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

  app.delete(
    '/agendamentos/:id',
    { onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')] },
    async (request) => {
      const params = request.params as { id: string };
      const sessao = contexto(request);
      return serializarAgendamento(
        await servico.cancelar(sessao.clinicaId, sessao.usuarioId, params.id)
      );
    }
  );
}
