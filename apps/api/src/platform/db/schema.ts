import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const papelEnum = pgEnum('papel', ['RECEPCAO', 'DENTISTA', 'ADMIN']);
export const statusAgendamentoEnum = pgEnum('status_agendamento', ['AGENDADO', 'CANCELADO']);
export const acaoAuditoriaEnum = pgEnum('acao_auditoria', ['CRIAR', 'EDITAR', 'DELETAR']);

const timestamps = {
  criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
};

export const clinica = pgTable('clinica', {
  id: uuid('id').primaryKey(),
  nome: text('nome').notNull(),
  fusoHorario: text('fuso_horario').notNull().default('America/Sao_Paulo'),
  ativo: boolean('ativo').notNull().default(true),
  ...timestamps,
});

export const usuario = pgTable(
  'usuario',
  {
    id: uuid('id').primaryKey(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    senhaHash: text('senha_hash').notNull(),
    papel: papelEnum('papel').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex('email_clinica_unique').on(table.clinicaId, table.email)]
);

export const profissional = pgTable(
  'profissional',
  {
    id: uuid('id').primaryKey(),
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
    ...timestamps,
  },
  (table) => [index('profissional_clinica_idx').on(table.clinicaId)]
);

export const paciente = pgTable(
  'paciente',
  {
    id: uuid('id').primaryKey(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    nome: text('nome').notNull(),
    documento: text('documento').notNull(),
    nascimento: timestamp('nascimento', { withTimezone: true, mode: 'date' }).notNull(),
    observacoes: text('observacoes').notNull().default(''),
    ativo: boolean('ativo').notNull().default(true),
    ...timestamps,
  },
  (table) => [index('paciente_clinica_idx').on(table.clinicaId)]
);

export const procedimento = pgTable(
  'procedimento',
  {
    id: uuid('id').primaryKey(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    nome: text('nome').notNull(),
    duracaoMinutos: integer('duracao_minutos').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    ...timestamps,
  },
  (table) => [index('procedimento_clinica_idx').on(table.clinicaId)]
);

export const agendamento = pgTable(
  'agendamento',
  {
    id: uuid('id').primaryKey(),
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
    ...timestamps,
  },
  (table) => [
    index('agendamento_profissional_inicio_idx').on(table.profissionalId, table.inicio),
    index('agendamento_clinica_idx').on(table.clinicaId),
    check('fim_greater_than_inicio', sql`${table.fim} > ${table.inicio}`),
  ]
);

export const registroAuditoria = pgTable(
  'registro_auditoria',
  {
    id: uuid('id').primaryKey(),
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
    criadoEm: timestamp('criado_em', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('auditoria_clinica_idx').on(table.clinicaId),
    index('auditoria_entidade_idx').on(table.entidade, table.entidadeId),
  ]
);

export const configuracaoClinica = pgTable(
  'configuracao_clinica',
  {
    id: uuid('id').primaryKey(),
    clinicaId: uuid('clinica_id')
      .notNull()
      .references(() => clinica.id, { onDelete: 'restrict' }),
    chave: text('chave').notNull(),
    valor: jsonb('valor').notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('clinica_chave_unique').on(table.clinicaId, table.chave)]
);
