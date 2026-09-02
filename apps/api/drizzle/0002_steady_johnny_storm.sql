ALTER TYPE "public"."status_agendamento" ADD VALUE 'CONFIRMADO' BEFORE 'CANCELADO';--> statement-breakpoint
ALTER TYPE "public"."status_agendamento" ADD VALUE 'FALTOU' BEFORE 'CANCELADO';--> statement-breakpoint
ALTER TYPE "public"."status_agendamento" ADD VALUE 'ATENDIDO' BEFORE 'CANCELADO';