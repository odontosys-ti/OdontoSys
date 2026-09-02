-- Os IDs originais do seed tinham formato UUID textual, mas não respeitavam
-- os bits de versão/variante exigidos pelo contrato compartilhado com o web.
-- Esta migração preserva uma base local já semeada e remapeia apenas os IDs demo.
BEGIN;

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

ALTER TABLE "usuario"
  ADD CONSTRAINT "usuario_clinica_id_clinica_id_fk"
  FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "profissional"
  ADD CONSTRAINT "profissional_clinica_id_clinica_id_fk"
  FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "profissional"
  ADD CONSTRAINT "profissional_usuario_id_usuario_id_fk"
  FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "paciente"
  ADD CONSTRAINT "paciente_clinica_id_clinica_id_fk"
  FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "procedimento"
  ADD CONSTRAINT "procedimento_clinica_id_clinica_id_fk"
  FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "agendamento"
  ADD CONSTRAINT "agendamento_clinica_id_clinica_id_fk"
  FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "agendamento"
  ADD CONSTRAINT "agendamento_paciente_id_paciente_id_fk"
  FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "agendamento"
  ADD CONSTRAINT "agendamento_profissional_id_profissional_id_fk"
  FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "agendamento"
  ADD CONSTRAINT "agendamento_procedimento_id_procedimento_id_fk"
  FOREIGN KEY ("procedimento_id") REFERENCES "procedimento"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "agendamento"
  ADD CONSTRAINT "agendamento_criado_por_usuario_id_fk"
  FOREIGN KEY ("criado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "registro_auditoria"
  ADD CONSTRAINT "auditoria_clinica_id_clinica_id_fk"
  FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "registro_auditoria"
  ADD CONSTRAINT "auditoria_usuario_id_usuario_id_fk"
  FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "configuracao_clinica"
  ADD CONSTRAINT "configuracao_clinica_clinica_id_clinica_id_fk"
  FOREIGN KEY ("clinica_id") REFERENCES "clinica"("id") ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

SET CONSTRAINTS ALL DEFERRED;

UPDATE "clinica"
SET "id" = '11111111-1111-4111-8111-111111111111'
WHERE "id" = '11111111-1111-1111-1111-111111111111';

UPDATE "usuario"
SET "id" = CASE "id"
  WHEN '22222222-2222-2222-2222-222222222222' THEN '22222222-2222-4222-8222-222222222222'
  WHEN '33333333-3333-3333-3333-333333333333' THEN '33333333-3333-4333-8333-333333333333'
  WHEN '44444444-4444-4444-4444-444444444444' THEN '44444444-4444-4444-8444-444444444444'
  ELSE "id"
END,
"clinica_id" = CASE "clinica_id"
  WHEN '11111111-1111-1111-1111-111111111111' THEN '11111111-1111-4111-8111-111111111111'
  ELSE "clinica_id"
END
WHERE "id" IN (
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
)
OR "clinica_id" = '11111111-1111-1111-1111-111111111111';

UPDATE "profissional"
SET "id" = CASE "id"
  WHEN '55555555-5555-5555-5555-555555555555' THEN '55555555-5555-4555-8555-555555555555'
  WHEN '66666666-6666-6666-6666-666666666666' THEN '66666666-6666-4666-8666-666666666666'
  ELSE "id"
END,
"clinica_id" = CASE "clinica_id"
  WHEN '11111111-1111-1111-1111-111111111111' THEN '11111111-1111-4111-8111-111111111111'
  ELSE "clinica_id"
END,
"usuario_id" = CASE "usuario_id"
  WHEN '33333333-3333-3333-3333-333333333333' THEN '33333333-3333-4333-8333-333333333333'
  ELSE "usuario_id"
END
WHERE "id" IN (
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
)
OR "clinica_id" = '11111111-1111-1111-1111-111111111111';

UPDATE "paciente"
SET "id" = CASE "id"
  WHEN '77777777-7777-7777-7777-777777777777' THEN '77777777-7777-4777-8777-777777777777'
  WHEN '88888888-8888-8888-8888-888888888888' THEN '88888888-8888-4888-8888-888888888888'
  WHEN '99999999-9999-9999-9999-999999999999' THEN '99999999-9999-4999-8999-999999999999'
  ELSE "id"
END,
"clinica_id" = CASE "clinica_id"
  WHEN '11111111-1111-1111-1111-111111111111' THEN '11111111-1111-4111-8111-111111111111'
  ELSE "clinica_id"
END
WHERE "id" IN (
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999'
)
OR "clinica_id" = '11111111-1111-1111-1111-111111111111';

UPDATE "procedimento"
SET "id" = CASE "id"
  WHEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  WHEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' THEN 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  WHEN 'cccccccc-cccc-cccc-cccc-cccccccccccc' THEN 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ELSE "id"
END,
"clinica_id" = CASE "clinica_id"
  WHEN '11111111-1111-1111-1111-111111111111' THEN '11111111-1111-4111-8111-111111111111'
  ELSE "clinica_id"
END
WHERE "id" IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
)
OR "clinica_id" = '11111111-1111-1111-1111-111111111111';

UPDATE "agendamento"
SET "id" = CASE "id"
  WHEN 'dddddddd-dddd-dddd-dddd-dddddddddddd' THEN 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  ELSE "id"
END,
"clinica_id" = CASE "clinica_id"
  WHEN '11111111-1111-1111-1111-111111111111' THEN '11111111-1111-4111-8111-111111111111'
  ELSE "clinica_id"
END,
"paciente_id" = CASE "paciente_id"
  WHEN '77777777-7777-7777-7777-777777777777' THEN '77777777-7777-4777-8777-777777777777'
  WHEN '88888888-8888-8888-8888-888888888888' THEN '88888888-8888-4888-8888-888888888888'
  WHEN '99999999-9999-9999-9999-999999999999' THEN '99999999-9999-4999-8999-999999999999'
  ELSE "paciente_id"
END,
"profissional_id" = CASE "profissional_id"
  WHEN '55555555-5555-5555-5555-555555555555' THEN '55555555-5555-4555-8555-555555555555'
  WHEN '66666666-6666-6666-6666-666666666666' THEN '66666666-6666-4666-8666-666666666666'
  ELSE "profissional_id"
END,
"procedimento_id" = CASE "procedimento_id"
  WHEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  WHEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' THEN 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  WHEN 'cccccccc-cccc-cccc-cccc-cccccccccccc' THEN 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ELSE "procedimento_id"
END,
"criado_por" = CASE "criado_por"
  WHEN '22222222-2222-2222-2222-222222222222' THEN '22222222-2222-4222-8222-222222222222'
  WHEN '33333333-3333-3333-3333-333333333333' THEN '33333333-3333-4333-8333-333333333333'
  WHEN '44444444-4444-4444-4444-444444444444' THEN '44444444-4444-4444-8444-444444444444'
  ELSE "criado_por"
END
WHERE "id" = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
OR "clinica_id" = '11111111-1111-1111-1111-111111111111';

UPDATE "registro_auditoria"
SET "clinica_id" = CASE "clinica_id"
  WHEN '11111111-1111-1111-1111-111111111111' THEN '11111111-1111-4111-8111-111111111111'
  ELSE "clinica_id"
END,
"usuario_id" = CASE "usuario_id"
  WHEN '22222222-2222-2222-2222-222222222222' THEN '22222222-2222-4222-8222-222222222222'
  WHEN '33333333-3333-3333-3333-333333333333' THEN '33333333-3333-4333-8333-333333333333'
  WHEN '44444444-4444-4444-4444-444444444444' THEN '44444444-4444-4444-8444-444444444444'
  ELSE "usuario_id"
END,
"entidade_id" = CASE "entidade_id"
  WHEN '55555555-5555-5555-5555-555555555555' THEN '55555555-5555-4555-8555-555555555555'
  WHEN '66666666-6666-6666-6666-666666666666' THEN '66666666-6666-4666-8666-666666666666'
  WHEN '77777777-7777-7777-7777-777777777777' THEN '77777777-7777-4777-8777-777777777777'
  WHEN '88888888-8888-8888-8888-888888888888' THEN '88888888-8888-4888-8888-888888888888'
  WHEN '99999999-9999-9999-9999-999999999999' THEN '99999999-9999-4999-8999-999999999999'
  WHEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  WHEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' THEN 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  WHEN 'cccccccc-cccc-cccc-cccc-cccccccccccc' THEN 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  WHEN 'dddddddd-dddd-dddd-dddd-dddddddddddd' THEN 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  ELSE "entidade_id"
END
WHERE "clinica_id" = '11111111-1111-1111-1111-111111111111'
OR "usuario_id" IN (
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
)
OR "entidade_id" IN (
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

UPDATE "configuracao_clinica"
SET "clinica_id" = '11111111-1111-4111-8111-111111111111'
WHERE "clinica_id" = '11111111-1111-1111-1111-111111111111';

COMMIT;
