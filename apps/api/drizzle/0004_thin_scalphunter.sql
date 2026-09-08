CREATE TYPE "public"."canal_mensagem" AS ENUM('WHATSAPP', 'SMS');--> statement-breakpoint
ALTER TABLE "paciente" ADD COLUMN "telefone" text;--> statement-breakpoint
ALTER TABLE "paciente" ADD COLUMN "canal_preferido" "canal_mensagem";--> statement-breakpoint
ALTER TABLE "paciente" ADD COLUMN "consentimento_ativo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "paciente" ADD COLUMN "consentimento_concedido_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "paciente" ADD COLUMN "consentimento_revogado_em" timestamp with time zone;