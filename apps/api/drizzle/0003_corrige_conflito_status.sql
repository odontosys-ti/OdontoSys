-- Custom SQL migration file, put your code below! --
ALTER TABLE "agendamento" DROP CONSTRAINT "agendamento_sem_sobreposicao";
--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_sem_sobreposicao"
  EXCLUDE USING gist (
    profissional_id WITH =,
    tstzrange(inicio, fim, '[)') WITH &&
  ) WHERE (status <> 'CANCELADO');
