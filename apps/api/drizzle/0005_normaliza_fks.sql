-- A migração de dados 0004 precisou postergar FKs durante o remapeamento.
-- Depois da transição, restaura-se a validação imediata usada pelo schema original.
ALTER TABLE "usuario" DROP CONSTRAINT "usuario_clinica_id_clinica_id_fk";
ALTER TABLE "profissional" DROP CONSTRAINT "profissional_clinica_id_clinica_id_fk";
ALTER TABLE "profissional" DROP CONSTRAINT "profissional_usuario_id_usuario_id_fk";
ALTER TABLE "paciente" DROP CONSTRAINT "paciente_clinica_id_clinica_id_fk";
ALTER TABLE "procedimento" DROP CONSTRAINT "procedimento_clinica_id_clinica_id_fk";
ALTER TABLE "agendamento" DROP CONSTRAINT "agendamento_clinica_id_clinica_id_fk";
ALTER TABLE "agendamento" DROP CONSTRAINT "agendamento_paciente_id_paciente_id_fk";
ALTER TABLE "agendamento" DROP CONSTRAINT "agendamento_profissional_id_profissional_id_fk";
ALTER TABLE "agendamento" DROP CONSTRAINT "agendamento_procedimento_id_procedimento_id_fk";
ALTER TABLE "agendamento" DROP CONSTRAINT "agendamento_criado_por_usuario_id_fk";
ALTER TABLE "registro_auditoria" DROP CONSTRAINT "auditoria_clinica_id_clinica_id_fk";
ALTER TABLE "registro_auditoria" DROP CONSTRAINT "auditoria_usuario_id_usuario_id_fk";
ALTER TABLE "configuracao_clinica" DROP CONSTRAINT "configuracao_clinica_clinica_id_clinica_id_fk";

ALTER TABLE "usuario" ADD CONSTRAINT "usuario_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT;
ALTER TABLE "profissional" ADD CONSTRAINT "profissional_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT;
ALTER TABLE "profissional" ADD CONSTRAINT "profissional_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT;
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT;
ALTER TABLE "procedimento" ADD CONSTRAINT "procedimento_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT;
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT;
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_paciente_id_paciente_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT;
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE RESTRICT;
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_procedimento_id_procedimento_id_fk" FOREIGN KEY ("procedimento_id") REFERENCES "procedimento"("id") ON DELETE RESTRICT;
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_criado_por_usuario_id_fk" FOREIGN KEY ("criado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT;
ALTER TABLE "registro_auditoria" ADD CONSTRAINT "auditoria_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT;
ALTER TABLE "registro_auditoria" ADD CONSTRAINT "auditoria_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT;
ALTER TABLE "configuracao_clinica" ADD CONSTRAINT "configuracao_clinica_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT;
