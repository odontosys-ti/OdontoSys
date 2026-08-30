import { InferSelectModel, InferInsertModel, sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  enum as pgEnum,
  jsonb,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';

// ========================================
// Enums
// ========================================

export const papelEnum = pgEnum('papel', ['RECEPCAO', 'DENTISTA', 'ADMIN']);
export const statusAgendamentoEnum = pgEnum('status_agendamento', ['AGENDADO', 'CANCELADO']);
export const acaoAuditoriaEnum = pgEnum('acao_auditoria', ['CRIAR', 'EDITAR', 'DELETAR']);

// ========================================
// Tabelas
// ========================================

/**
 * Clínica — contexto para multi-clínica futura
 * Uma linha na seed inicial
 */
export const clinica = pgTable('clinica', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  fusoHorario: text('fuso_horario').notNull().default('America/Sao_Paulo'),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

/**
 * Usuário — autenticação e acesso
 * Papel: RECEPCAO | DENTISTA | ADMIN
 */
export const usuario = pgTable(
  'usuario',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    senhaHash: text('senha_hash').notNull(),
    papel: papelEnum('papel').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailClinicaUnique: uniqueIndex('email_clinica_unique').on(table.clinicaId, table.email),
  }),
);

/**
 * Profissional — dentista que atende
 */
export const profissional = pgTable(
  'profissional',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'restrict' }),
    nome: text('nome').notNull(),
    cro: text('cro').notNull(),
    especialidade: text('especialidade').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    clinicaIdx: index('profissional_clinica_idx').on(table.clinicaId),
  }),
);

/**
 * Paciente — usuário da clínica (sem contato — vem em US-03)
 */
export const paciente = pgTable(
  'paciente',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    nome: text('nome').notNull(),
    documento: text('documento').notNull(),
    nascimento: timestamp('nascimento', { withTimezone: true, mode: 'date' }).notNull(),
    observacoes: text('observacoes').default(''),
    ativo: boolean('ativo').notNull().default(true),
    criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    clinicaIdx: index('paciente_clinica_idx').on(table.clinicaId),
  }),
);

/**
 * Procedimento — tipo de atendimento com duração
 */
export const procedimento = pgTable(
  'procedimento',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    nome: text('nome').notNull(),
    duracaoMinutos: integer('duracao_minutos').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    clinicaIdx: index('procedimento_clinica_idx').on(table.clinicaId),
  }),
);

/**
 * Agendamento — consulta marcada
 * Status: AGENDADO | CANCELADO
 * Fim é calculado a partir de duração do procedimento
 */
export const agendamento = pgTable(
  'agendamento',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    pacienteId: uuid('paciente_id')
      .notNull()
      .references(() => paciente.id, { onDelete: 'restrict' }),
    profissionalId: uuid('profissional_id')
      .notNull()
      .references(() => profissional.id, { onDelete: 'restrict' }),
    procedimentoId: uuid('procedimento_id')
      .notNull()
      .references(() => procedimento.id, { onDelete: 'restrict' }),
    inicio: timestamp('inicio', { withTimezone: true, mode: 'date' }).notNull(),
    fim: timestamp('fim', { withTimezone: true, mode: 'date' }).notNull(),
    status: statusAgendamentoEnum('status').notNull().default('AGENDADO'),
    criadoPor: uuid('criado_por')
      .notNull()
      .references(() => usuario.id, { onDelete: 'restrict' }),
    criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    profissionalInicioIdx: index('agendamento_profissional_inicio_idx').on(
      table.profissionalId,
      table.inicio,
    ),
    clinicaIdx: index('agendamento_clinica_idx').on(table.clinicaId),
    fimGreaterThanInicio: check(
      'fim_greater_than_inicio',
      sql`fim > inicio`,
    ),
  }),
);

/**
 * Registro de Auditoria — rastreabilidade de todas as ações
 * Ação: CRIAR | EDITAR | DELETAR
 */
export const registroAuditoria = pgTable(
  'registro_auditoria',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'restrict' }),
    entidade: text('entidade').notNull(),
    entidadeId: uuid('entidade_id').notNull(),
    acao: acaoAuditoriaEnum('acao').notNull(),
    dadosAntes: jsonb('dados_antes'),
    dadosDepois: jsonb('dados_depois'),
    criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    clinicaIdx: index('auditoria_clinica_idx').on(table.clinicaId),
    entidadeIdx: index('auditoria_entidade_idx').on(table.entidade, table.entidadeId),
  }),
);

/**
 * Configuração da Clínica — mecanismo genérico de parametrização
 * Valor armazenado como JSONB
 */
export const configuracaoClinica = pgTable(
  'configuracao_clinica',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    chave: text('chave').notNull(),
    valor: jsonb('valor').notNull(),
    criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    clinicaChaveUnique: uniqueIndex('clinica_chave_unique').on(table.clinicaId, table.chave),
  }),
);

// ========================================
// Type Exports
// ========================================

export type Clinica = InferSelectModel<typeof clinica>;
export type ClinicaInsert = InferInsertModel<typeof clinica>;

export type Usuario = InferSelectModel<typeof usuario>;
export type UsuarioInsert = InferInsertModel<typeof usuario>;

export type Profissional = InferSelectModel<typeof profissional>;
export type ProfissionalInsert = InferInsertModel<typeof profissional>;

export type Paciente = InferSelectModel<typeof paciente>;
export type PacienteInsert = InferInsertModel<typeof paciente>;

export type Procedimento = InferSelectModel<typeof procedimento>;
export type ProcedimentoInsert = InferInsertModel<typeof procedimento>;

export type Agendamento = InferSelectModel<typeof agendamento>;
export type AgendamentoInsert = InferInsertModel<typeof agendamento>;

export type RegistroAuditoria = InferSelectModel<typeof registroAuditoria>;
export type RegistroAuditoriaInsert = InferInsertModel<typeof registroAuditoria>;

export type ConfiguracaoClinica = InferSelectModel<typeof configuracaoClinica>;
export type ConfiguracaoClinicaInsert = InferInsertModel<typeof configuracaoClinica>;
