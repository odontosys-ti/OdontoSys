import { z } from 'zod';

// ========================================
// Enums
// ========================================

export const PapelEnum = z.enum(['RECEPCAO', 'DENTISTA', 'ADMIN']);
export type Papel = z.infer<typeof PapelEnum>;

// ========================================
// Auth
// ========================================

export const SchemaLogin = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});
export type LoginRequest = z.infer<typeof SchemaLogin>;

export const SchemaLoginResponse = z.object({
  usuarioId: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  papel: PapelEnum,
  clinicaId: z.string().uuid(),
});
export type LoginResponse = z.infer<typeof SchemaLoginResponse>;

export const SchemaMeResponse = z.object({
  usuarioId: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  papel: PapelEnum,
  clinicaId: z.string().uuid(),
});
export type MeResponse = z.infer<typeof SchemaMeResponse>;

// ========================================
// Pacientes
// ========================================

export const SchemaCriarPaciente = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  documento: z.string().min(11, 'Documento inválido'),
  nascimento: z.coerce.date(),
  observacoes: z.string().optional().default(''),
});
export type CriarPacienteRequest = z.infer<typeof SchemaCriarPaciente>;

export const SchemaAtualizarPaciente = SchemaCriarPaciente.partial();
export type AtualizarPacienteRequest = z.infer<typeof SchemaAtualizarPaciente>;

export const SchemaPacienteResponse = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  documento: z.string(),
  nascimento: z.date(),
  observacoes: z.string(),
  ativo: z.boolean(),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
});
export type PacienteResponse = z.infer<typeof SchemaPacienteResponse>;

// ========================================
// Profissionais
// ========================================

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
  nome: z.string(),
  cro: z.string(),
  especialidade: z.string(),
  usuarioId: z.string().uuid(),
  ativo: z.boolean(),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
});
export type ProfissionalResponse = z.infer<typeof SchemaProfissionalResponse>;

// ========================================
// Procedimentos
// ========================================

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
  criadoEm: z.date(),
  atualizadoEm: z.date(),
});
export type ProcedimentoResponse = z.infer<typeof SchemaProcedimentoResponse>;

// ========================================
// Agendamentos
// ========================================

export const SchemaCriarAgendamento = z.object({
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  procedimentoId: z.string().uuid(),
  inicio: z.coerce.date(),
});
export type CriarAgendamentoRequest = z.infer<typeof SchemaCriarAgendamento>;

export const SchemaAtualizarAgendamento = z.object({
  inicio: z.coerce.date().optional(),
});
export type AtualizarAgendamentoRequest = z.infer<typeof SchemaAtualizarAgendamento>;

export const SchemaAgendamentoResponse = z.object({
  id: z.string().uuid(),
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  procedimentoId: z.string().uuid(),
  inicio: z.date(),
  fim: z.date(),
  status: z.enum(['AGENDADO', 'CANCELADO']),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
});
export type AgendamentoResponse = z.infer<typeof SchemaAgendamentoResponse>;

// ========================================
// Paginação
// ========================================

export const SchemaPaginacao = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  tamanho: z.coerce.number().int().positive().default(10),
});

export const SchemaListaResponse = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    dados: z.array(schema),
    paginacao: z.object({
      pagina: z.number(),
      tamanho: z.number(),
      total: z.number(),
    }),
  });
