-- Create enums
CREATE TYPE "papel" AS ENUM ('RECEPCAO', 'DENTISTA', 'ADMIN');
CREATE TYPE "status_agendamento" AS ENUM ('AGENDADO', 'CANCELADO');
CREATE TYPE "acao_auditoria" AS ENUM ('CRIAR', 'EDITAR', 'DELETAR');

-- Create clinica table
CREATE TABLE "clinica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"fuso_horario" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create usuario table
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"papel" "papel" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
);

-- Create profissional table
CREATE TABLE "profissional" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"cro" text NOT NULL,
	"especialidade" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profissional_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT,
	CONSTRAINT "profissional_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT
);

-- Create paciente table
CREATE TABLE "paciente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"documento" text NOT NULL,
	"nascimento" timestamp with time zone NOT NULL,
	"observacoes" text DEFAULT '',
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paciente_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
);

-- Create procedimento table
CREATE TABLE "procedimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"duracao_minutos" integer NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procedimento_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
);

-- Create agendamento table
CREATE TABLE "agendamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"paciente_id" uuid NOT NULL,
	"profissional_id" uuid NOT NULL,
	"procedimento_id" uuid NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fim" timestamp with time zone NOT NULL,
	"status" "status_agendamento" DEFAULT 'AGENDADO' NOT NULL,
	"criado_por" uuid NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agendamento_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT,
	CONSTRAINT "agendamento_paciente_id_paciente_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT,
	CONSTRAINT "agendamento_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE RESTRICT,
	CONSTRAINT "agendamento_procedimento_id_procedimento_id_fk" FOREIGN KEY ("procedimento_id") REFERENCES "procedimento"("id") ON DELETE RESTRICT,
	CONSTRAINT "agendamento_criado_por_usuario_id_fk" FOREIGN KEY ("criado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT,
	CONSTRAINT "fim_greater_than_inicio" CHECK ("fim" > "inicio")
);

-- Create registro_auditoria table
CREATE TABLE "registro_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" uuid NOT NULL,
	"acao" "acao_auditoria" NOT NULL,
	"dados_antes" jsonb,
	"dados_depois" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auditoria_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT,
	CONSTRAINT "auditoria_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT
);

-- Create configuracao_clinica table
CREATE TABLE "configuracao_clinica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"chave" text NOT NULL,
	"valor" jsonb NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "configuracao_clinica_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
);

-- Create indexes (T-06)
CREATE UNIQUE INDEX "email_clinica_unique" ON "usuario" ("clinica_id", "email");
CREATE INDEX "profissional_clinica_idx" ON "profissional" ("clinica_id");
CREATE INDEX "paciente_clinica_idx" ON "paciente" ("clinica_id");
CREATE INDEX "procedimento_clinica_idx" ON "procedimento" ("clinica_id");
CREATE INDEX "agendamento_profissional_inicio_idx" ON "agendamento" ("profissional_id", "inicio");
CREATE INDEX "agendamento_clinica_idx" ON "agendamento" ("clinica_id");
CREATE INDEX "auditoria_clinica_idx" ON "registro_auditoria" ("clinica_id");
CREATE INDEX "auditoria_entidade_idx" ON "registro_auditoria" ("entidade", "entidade_id");
CREATE UNIQUE INDEX "clinica_chave_unique" ON "configuracao_clinica" ("clinica_id", "chave");
