import {
  SchemaAtualizarPaciente,
  SchemaCriarPaciente,
  SchemaPaginacaoQuery,
} from '@odontosys/contracts';
import type { FastifyInstance } from 'fastify';

import { contexto, exigirPapel } from '../../../platform/auth/jwt';
import { AppError } from '../../../platform/erros';
import { parseData } from '../../../platform/http/datas';
import { ServicoPacientes, serializarPaciente } from '../application/servico';

export async function registrarRotasPacientes(app: FastifyInstance): Promise<void> {
  const servico = new ServicoPacientes();

  app.get('/pacientes', { onRequest: [app.authenticate] }, async (request) => {
    const query = SchemaPaginacaoQuery.parse(request.query);
    const sessao = contexto(request);
    const lista = await servico.listar(sessao.clinicaId, query.pagina, query.tamanho, query.busca);
    return {
      dados: lista.itens.map(serializarPaciente),
      paginacao: { pagina: query.pagina, tamanho: query.tamanho, total: lista.total },
    };
  });

  app.post(
    '/pacientes',
    { onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')] },
    async (request, reply) => {
      const body = SchemaCriarPaciente.parse(request.body);
      const sessao = contexto(request);
      const criado = await servico.criar(sessao.clinicaId, sessao.usuarioId, {
        nome: body.nome,
        documento: body.documento,
        nascimento: parseData(body.nascimento, 'nascimento'),
        observacoes: body.observacoes,
      });
      return reply.status(201).send(serializarPaciente(criado));
    }
  );

  app.get(
    '/pacientes/:id',
    { onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')] },
    async (request) => {
      const params = request.params as { id: string };
      const sessao = contexto(request);
      const encontrado = await servico.obter(sessao.clinicaId, params.id);
      return serializarPaciente(encontrado);
    }
  );

  app.patch(
    '/pacientes/:id',
    { onRequest: [app.authenticate, exigirPapel('RECEPCAO', 'ADMIN')] },
    async (request) => {
      const params = request.params as { id: string };
      const body = SchemaAtualizarPaciente.parse(request.body);
      const sessao = contexto(request);
      if (Object.keys(body).length === 0) {
        throw new AppError('VALIDACAO_INVALIDA', [{ mensagem: 'Nenhum campo para atualizar' }]);
      }
      const atualizado = await servico.atualizar(sessao.clinicaId, sessao.usuarioId, params.id, {
        nome: body.nome,
        documento: body.documento,
        nascimento: body.nascimento ? parseData(body.nascimento, 'nascimento') : undefined,
        observacoes: body.observacoes,
      });
      return serializarPaciente(atualizado);
    }
  );
}
