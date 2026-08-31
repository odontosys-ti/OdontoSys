import { hash } from 'argon2';
import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { db } from '../src/platform/db';
import {
  agendamento,
  clinica,
  paciente,
  procedimento,
  profissional,
  registroAuditoria,
  usuario,
} from '../src/platform/db/schema';
import { criarUuidV7 } from '../src/platform/uuid';

export const SENHA = 'senha123';

export async function limparBanco(): Promise<void> {
  await db().execute(sql`TRUNCATE TABLE
    agendamento, registro_auditoria, paciente, procedimento, profissional, usuario, configuracao_clinica, clinica
    RESTART IDENTITY CASCADE`);
}

export async function semearClinica(): Promise<{
  clinicaId: string;
  recepcaoId: string;
  adminId: string;
  dentistaId: string;
  profissionalId: string;
  pacienteId: string;
  procedimentoId: string;
}> {
  const senhaHash = await hash(SENHA);
  const clinicaId = criarUuidV7();
  const recepcaoId = criarUuidV7();
  const adminId = criarUuidV7();
  const dentistaId = criarUuidV7();
  const profissionalId = criarUuidV7();
  const pacienteId = criarUuidV7();
  const procedimentoId = criarUuidV7();

  await db().insert(clinica).values({
    id: clinicaId,
    nome: 'Clinica Teste',
    fusoHorario: 'America/Sao_Paulo',
    ativo: true,
  });

  await db()
    .insert(usuario)
    .values([
      {
        id: recepcaoId,
        clinicaId,
        nome: 'Recepcao',
        email: 'recepcao@teste.local',
        senhaHash,
        papel: 'RECEPCAO',
        ativo: true,
      },
      {
        id: adminId,
        clinicaId,
        nome: 'Admin',
        email: 'admin@teste.local',
        senhaHash,
        papel: 'ADMIN',
        ativo: true,
      },
      {
        id: dentistaId,
        clinicaId,
        nome: 'Dentista',
        email: 'dentista@teste.local',
        senhaHash,
        papel: 'DENTISTA',
        ativo: true,
      },
    ]);

  await db().insert(profissional).values({
    id: profissionalId,
    clinicaId,
    usuarioId: dentistaId,
    nome: 'Dr Teste',
    cro: '0001',
    especialidade: 'Geral',
    ativo: true,
  });

  await db()
    .insert(paciente)
    .values({
      id: pacienteId,
      clinicaId,
      nome: 'Paciente Teste',
      documento: '12345678901',
      nascimento: new Date('1990-01-01T00:00:00.000Z'),
      observacoes: '',
      ativo: true,
    });

  await db().insert(procedimento).values({
    id: procedimentoId,
    clinicaId,
    nome: 'Limpeza',
    duracaoMinutos: 30,
    ativo: true,
  });

  return {
    clinicaId,
    recepcaoId,
    adminId,
    dentistaId,
    profissionalId,
    pacienteId,
    procedimentoId,
  };
}

export async function login(app: FastifyInstance, email: string): Promise<string> {
  const resposta = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, senha: SENHA },
  });
  const cookie = resposta.cookies.find((item) => item.name === 'sessionId');
  if (!cookie?.value) {
    throw new Error(`login falhou: ${resposta.statusCode} ${resposta.body}`);
  }
  return cookie.value;
}

export { registroAuditoria, agendamento };
