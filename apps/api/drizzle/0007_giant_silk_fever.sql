ALTER TABLE "lembrete" ADD COLUMN "em_processamento" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lembrete" ADD COLUMN "claim_token" text;--> statement-breakpoint
ALTER TABLE "lembrete" ADD COLUMN "claim_expira_em" timestamp with time zone;