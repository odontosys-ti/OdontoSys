import { hash } from 'argon2';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { aplicarDotEnv } from '../src/platform/config';
import {
  agendamento,
  clinica,
  paciente,
  procedimento,
  profissional,
  usuario,
} from '../src/platform/db/schema';

aplicarDotEnv();

const IDS = {
  clinica: '11111111-1111-1111-1111-111111111111',
  recepcao: '22222222-2222-2222-2222-222222222222',
  dentista: '33333333-3333-3333-3333-333333333333',
  admin: '44444444-4444-4444-4444-444444444444',
  profissional1: '55555555-5555-5555-5555-555555555555',
  profissional2: '66666666-6666-6666-6666-666666666666',
  paciente1: '77777777-7777-7777-7777-777777777777',
  paciente2: '88888888-8888-8888-8888-888888888888',
  paciente3: '99999999-9999-9999-9999-999999999999',
  procedimento1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  procedimento2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  procedimento3: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
};

const runSeed = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const database = drizzle(pool);
  const senhaHash = await hash('senha123');

  await database.insert(clinica).values({
    id: IDS.clinica,
    nome: 'Clínica OdontoSys Demo',
    fusoHorario: 'America/Sao_Paulo',
    ativo: true,
  });

  await database.insert(usuario).values([
    {
      id: IDS.recepcao,
      clinicaId: IDS.clinica,
      nome: 'Maria Recepcionista',
      email: 'recepcao@odontosys.local',
      senhaHash,
      papel: 'RECEPCAO',
      ativo: true,
    },
    {
      id: IDS.dentista,
      clinicaId: IDS.clinica,
      nome: 'Dr. João Dentista',
      email: 'dentista@odontosys.local',
      senhaHash,
      papel: 'DENTISTA',
      ativo: true,
    },
    {
      id: IDS.admin,
      clinicaId: IDS.clinica,
      nome: 'Admin Sistema',
      email: 'admin@odontosys.local',
      senhaHash,
      papel: 'ADMIN',
      ativo: true,
    },
  ]);

  await database.insert(profissional).values([
    {
      id: IDS.profissional1,
      clinicaId: IDS.clinica,
      usuarioId: IDS.dentista,
      nome: 'Dr. João Silva',
      cro: '12345',
      especialidade: 'Clínica Geral',
      ativo: true,
    },
    {
      id: IDS.profissional2,
      clinicaId: IDS.clinica,
      usuarioId: IDS.dentista,
      nome: 'Dra. Ana Costa',
      cro: '12346',
      especialidade: 'Ortodontia',
      ativo: true,
    },
  ]);

  await database.insert(paciente).values([
    {
      id: IDS.paciente1,
      clinicaId: IDS.clinica,
      nome: 'Paulo Silva',
      documento: '12345678901',
      nascimento: new Date('1990-05-15T00:00:00.000Z'),
      observacoes: '',
      ativo: true,
    },
    {
      id: IDS.paciente2,
      clinicaId: IDS.clinica,
      nome: 'Carla Santos',
      documento: '12345678902',
      nascimento: new Date('1985-03-22T00:00:00.000Z'),
      observacoes: '',
      ativo: true,
    },
    {
      id: IDS.paciente3,
      clinicaId: IDS.clinica,
      nome: 'Bruno Oliveira',
      documento: '12345678903',
      nascimento: new Date('1995-07-10T00:00:00.000Z'),
      observacoes: '',
      ativo: true,
    },
  ]);

  await database.insert(procedimento).values([
    {
      id: IDS.procedimento1,
      clinicaId: IDS.clinica,
      nome: 'Limpeza',
      duracaoMinutos: 30,
      ativo: true,
    },
    {
      id: IDS.procedimento2,
      clinicaId: IDS.clinica,
      nome: 'Restauração',
      duracaoMinutos: 60,
      ativo: true,
    },
    {
      id: IDS.procedimento3,
      clinicaId: IDS.clinica,
      nome: 'Extração',
      duracaoMinutos: 45,
      ativo: true,
    },
  ]);

  const amanha = new Date();
  amanha.setUTCDate(amanha.getUTCDate() + 1);
  amanha.setUTCHours(12, 0, 0, 0);

  await database.insert(agendamento).values({
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    clinicaId: IDS.clinica,
    pacienteId: IDS.paciente1,
    profissionalId: IDS.profissional1,
    procedimentoId: IDS.procedimento1,
    inicio: amanha,
    fim: new Date(amanha.getTime() + 30 * 60_000),
    status: 'AGENDADO',
    criadoPor: IDS.recepcao,
  });

  await pool.end();
};

runSeed().catch((erro: unknown) => {
  process.stderr.write(`${erro instanceof Error ? erro.message : 'erro'}\n`);
  process.exit(1);
});
