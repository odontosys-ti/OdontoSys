import { paraJsonSchema, SchemaErro } from '@odontosys/contracts';
import type { FastifySchema } from 'fastify';
import type { ZodType } from 'zod';

type EntradaSchema = {
  body?: ZodType;
  querystring?: ZodType;
  params?: ZodType;
  resposta: ZodType;
  status?: number;
  autenticada?: boolean;
  erros?: number[];
};

const errosPadrao = [400, 401, 403, 404, 409, 422, 500];

export function schemaRota(entrada: EntradaSchema): FastifySchema {
  const status = entrada.status ?? 200;
  const codigosErro = entrada.erros ?? errosPadrao;
  const response: Record<number, Record<string, unknown>> = {
    [status]: paraJsonSchema(entrada.resposta),
  };

  for (const codigo of codigosErro) {
    if (codigo !== status) {
      response[codigo] = paraJsonSchema(SchemaErro);
    }
  }

  const schema: FastifySchema = { response };
  if (entrada.body) schema.body = paraJsonSchema(entrada.body);
  if (entrada.querystring) schema.querystring = paraJsonSchema(entrada.querystring);
  if (entrada.params) schema.params = paraJsonSchema(entrada.params);
  if (entrada.autenticada) schema.security = [{ cookieAuth: [] }];
  return schema;
}
