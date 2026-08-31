import { z } from 'zod';

export const PapelEnum = z.enum(['RECEPCAO', 'DENTISTA', 'ADMIN']);
export type Papel = z.infer<typeof PapelEnum>;

export const StatusAgendamentoEnum = z.enum(['AGENDADO', 'CANCELADO']);
export type StatusAgendamento = z.infer<typeof StatusAgendamentoEnum>;

export const SchemaErro = z.object({
  erro: z.object({
    codigo: z.string(),
    mensagem: z.string(),
    detalhes: z.array(z.unknown()),
  }),
  requestId: z.string(),
});
export type EnvelopeErro = z.infer<typeof SchemaErro>;

export const SchemaPaginacaoQuery = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  tamanho: z.coerce.number().int().positive().max(100).default(10),
  busca: z.string().optional(),
});

export const SchemaPaginacao = z.object({
  pagina: z.number(),
  tamanho: z.number(),
  total: z.number(),
});

export function schemaLista<T extends z.ZodType>(item: T) {
  return z.object({
    dados: z.array(item),
    paginacao: SchemaPaginacao,
  });
}

export const SchemaLogin = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});
export type LoginRequest = z.infer<typeof SchemaLogin>;

export const SchemaUsuarioPublico = z.object({
  usuarioId: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  papel: PapelEnum,
  clinicaId: z.string().uuid(),
});
export type UsuarioPublico = z.infer<typeof SchemaUsuarioPublico>;

export const SchemaLoginResponse = SchemaUsuarioPublico;
export type LoginResponse = UsuarioPublico;
export const SchemaMeResponse = SchemaUsuarioPublico;
export type MeResponse = UsuarioPublico;

export const SchemaCriarPaciente = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  documento: z.string().min(11, 'Documento inválido'),
  nascimento: z.string().min(1, 'Nascimento é obrigatório'),
  observacoes: z.string().optional().default(''),
});
export type CriarPacienteRequest = z.infer<typeof SchemaCriarPaciente>;

export const SchemaAtualizarPaciente = SchemaCriarPaciente.partial();
export type AtualizarPacienteRequest = z.infer<typeof SchemaAtualizarPaciente>;

export const SchemaPacienteResponse = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  documento: z.string(),
  nascimento: z.string(),
  observacoes: z.string(),
  ativo: z.boolean(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});
export type PacienteResponse = z.infer<typeof SchemaPacienteResponse>;
export const SchemaListaPacientes = schemaLista(SchemaPacienteResponse);

export const SchemaCriarProfissional = z.object({
  usuarioId: z.string().uuid(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  cro: z.string().min(1, 'CRO é obrigatório'),
  especialidade: z.string().min(1, 'Especialidade é obrigatória'),
});
export type CriarProfissionalRequest = z.infer<typeof SchemaCriarProfissional>;

export const SchemaAtualizarProfissional = SchemaCriarProfissional.partial();
export type AtualizarProfissionalRequest = z.infer<typeof SchemaAtualizarProfissional>;

export const SchemaProfissionalResponse = z.object({
  id: z.string().uuid(),
  usuarioId: z.string().uuid(),
  nome: z.string(),
  cro: z.string(),
  especialidade: z.string(),
  ativo: z.boolean(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});
export type ProfissionalResponse = z.infer<typeof SchemaProfissionalResponse>;
export const SchemaListaProfissionais = schemaLista(SchemaProfissionalResponse);

export const SchemaCriarProcedimento = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  duracaoMinutos: z.number().int().positive('Duração deve ser maior que 0'),
});
export type CriarProcedimentoRequest = z.infer<typeof SchemaCriarProcedimento>;

export const SchemaAtualizarProcedimento = SchemaCriarProcedimento.partial();
export type AtualizarProcedimentoRequest = z.infer<typeof SchemaAtualizarProcedimento>;

export const SchemaProcedimentoResponse = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  duracaoMinutos: z.number(),
  ativo: z.boolean(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});
export type ProcedimentoResponse = z.infer<typeof SchemaProcedimentoResponse>;
export const SchemaListaProcedimentos = schemaLista(SchemaProcedimentoResponse);

export const SchemaCriarAgendamento = z.object({
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  procedimentoId: z.string().uuid(),
  inicio: z.string().min(1, 'Início é obrigatório'),
});
export type CriarAgendamentoRequest = z.infer<typeof SchemaCriarAgendamento>;

export const SchemaAtualizarAgendamento = z.object({
  inicio: z.string().min(1, 'Início é obrigatório'),
});
export type AtualizarAgendamentoRequest = z.infer<typeof SchemaAtualizarAgendamento>;

export const SchemaListarAgendamentosQuery = SchemaPaginacaoQuery.extend({
  de: z.string().min(1),
  ate: z.string().min(1),
  profissionalId: z.string().uuid().optional(),
});

export const SchemaAgendamentoResponse = z.object({
  id: z.string().uuid(),
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  procedimentoId: z.string().uuid(),
  inicio: z.string(),
  fim: z.string(),
  status: StatusAgendamentoEnum,
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});
export type AgendamentoResponse = z.infer<typeof SchemaAgendamentoResponse>;
export const SchemaListaAgendamentos = schemaLista(SchemaAgendamentoResponse);
