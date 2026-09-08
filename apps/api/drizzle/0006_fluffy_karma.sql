CREATE TYPE "public"."janela_lembrete" AS ENUM('MANUAL', 'VINTE_E_QUATRO_HORAS', 'QUARENTA_E_OITO_HORAS');--> statement-breakpoint
CREATE TYPE "public"."status_lembrete" AS ENUM('ENVIADO', 'ENTREGUE', 'FALHOU');--> statement-breakpoint
CREATE TABLE "lembrete" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clinica_id" uuid NOT NULL,
	"agendamento_id" uuid NOT NULL,
	"paciente_id" uuid NOT NULL,
	"canal" "canal_mensagem" NOT NULL,
	"janela" "janela_lembrete" NOT NULL,
	"status" "status_lembrete" NOT NULL,
	"transporte" text NOT NULL,
	"provider_id" text,
	"codigo_falha" text,
	"mensagem_falha" text,
	"solicitado_por" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_paciente_id_paciente_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_solicitado_por_usuario_id_fk" FOREIGN KEY ("solicitado_por") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lembrete_clinica_status_idx" ON "lembrete" USING btree ("clinica_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "lembrete_logical_key_unique" ON "lembrete" USING btree ("agendamento_id","janela","canal");