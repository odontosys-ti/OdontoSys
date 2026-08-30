import { hash } from 'argon2';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  clinica,
  usuario,
  profissional,
  paciente,
  procedimento,
  agendamento,
} from '../src/platform/db/schema';
import { subHours, addDays } from 'date-fns';

const runSeed = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // 1. Criar clínica
    const clinicaId = '11111111-1111-1111-1111-111111111111';
    await db.insert(clinica).values({
      id: clinicaId,
      nome: 'Clínica OdontoSys Demo',
      fusoHorario: 'America/Sao_Paulo',
      ativo: true,
    });
    console.log('✅ Clínica criada');

    // 2. Criar usuários (RECEPCAO, DENTISTA, ADMIN)
    const senhaHash = await hash('senha123');

    const usuarioRecepcaoId = '22222222-2222-2222-2222-222222222222';
    const usuarioDentistaId = '33333333-3333-3333-3333-333333333333';
    const usuarioAdminId = '44444444-4444-4444-4444-444444444444';

    await db.insert(usuario).values([
      {
        id: usuarioRecepcaoId,
        clinicaId,
        nome: 'Maria Recepcionista',
        email: 'recepcao@odontosys.local',
        senhaHash,
        papel: 'RECEPCAO',
        ativo: true,
      },
      {
        id: usuarioDentistaId,
        clinicaId,
        nome: 'Dr. João Dentista',
        email: 'dentista@odontosys.local',
        senhaHash,
        papel: 'DENTISTA',
        ativo: true,
      },
      {
        id: usuarioAdminId,
        clinicaId,
        nome: 'Admin Sistema',
        email: 'admin@odontosys.local',
        senhaHash,
        papel: 'ADMIN',
        ativo: true,
      },
    ]);
    console.log('✅ Usuários criados');

    // 3. Criar profissionais
    const profissionalId = '55555555-5555-5555-5555-555555555555';
    const profissional2Id = '66666666-6666-6666-6666-666666666666';

    await db.insert(profissional).values([
      {
        id: profissionalId,
        clinicaId,
        usuarioId: usuarioDentistaId,
        nome: 'Dr. João Silva',
        cro: '12345',
        especialidade: 'Clínica Geral',
        ativo: true,
      },
      {
        id: profissional2Id,
        clinicaId,
        usuarioId: usuarioDentistaId,
        nome: 'Dra. Ana Costa',
        cro: '12346',
        especialidade: 'Ortodontia',
        ativo: true,
      },
    ]);
    console.log('✅ Profissionais criados');

    // 4. Criar pacientes
    const paciente1Id = '77777777-7777-7777-7777-777777777777';
    const paciente2Id = '88888888-8888-8888-8888-888888888888';
    const paciente3Id = '99999999-9999-9999-9999-999999999999';

    await db.insert(paciente).values([
      {
        id: paciente1Id,
        clinicaId,
        nome: 'Paulo Silva',
        documento: '12345678901',
        nascimento: new Date('1990-05-15'),
        observacoes: 'Alérgico a anestésicos com epinefrina',
        ativo: true,
      },
      {
        id: paciente2Id,
        clinicaId,
        nome: 'Carla Santos',
        documento: '12345678902',
        nascimento: new Date('1985-03-22'),
        observacoes: '',
        ativo: true,
      },
      {
        id: paciente3Id,
        clinicaId,
        nome: 'Bruno Oliveira',
        documento: '12345678903',
        nascimento: new Date('1995-07-10'),
        observacoes: 'Medo de agulha',
        ativo: true,
      },
    ]);
    console.log('✅ Pacientes criados');

    // 5. Criar procedimentos
    const procedimento1Id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const procedimento2Id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const procedimento3Id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    await db.insert(procedimento).values([
      {
        id: procedimento1Id,
        clinicaId,
        nome: 'Limpeza',
        duracaoMinutos: 30,
        ativo: true,
      },
      {
        id: procedimento2Id,
        clinicaId,
        nome: 'Restauração',
        duracaoMinutos: 60,
        ativo: true,
      },
      {
        id: procedimento3Id,
        clinicaId,
        nome: 'Extração',
        duracaoMinutos: 45,
        ativo: true,
      },
    ]);
    console.log('✅ Procedimentos criados');

    // 6. Criar agendamentos
    const hoje = new Date();
    const amanha = addDays(hoje, 1);
    const proximaSemana = addDays(hoje, 7);

    await db.insert(agendamento).values([
      {
        clinicaId,
        pacienteId: paciente1Id,
        profissionalId,
        procedimentoId: procedimento1Id,
        inicio: new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate(), 9, 0),
        fim: new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate(), 9, 30),
        status: 'AGENDADO',
        criadoPor: usuarioRecepcaoId,
      },
      {
        clinicaId,
        pacienteId: paciente2Id,
        profissionalId,
        procedimentoId: procedimento2Id,
        inicio: new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate(), 10, 0),
        fim: new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate(), 11, 0),
        status: 'AGENDADO',
        criadoPor: usuarioRecepcaoId,
      },
      {
        clinicaId,
        pacienteId: paciente3Id,
        profissionalId: profissional2Id,
        procedimentoId: procedimento3Id,
        inicio: new Date(
          proximaSemana.getFullYear(),
          proximaSemana.getMonth(),
          proximaSemana.getDate(),
          14,
          0,
        ),
        fim: new Date(
          proximaSemana.getFullYear(),
          proximaSemana.getMonth(),
          proximaSemana.getDate(),
          14,
          45,
        ),
        status: 'AGENDADO',
        criadoPor: usuarioRecepcaoId,
      },
    ]);
    console.log('✅ Agendamentos criados');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📝 Credenciais para teste:');
    console.log('  Recepção: recepcao@odontosys.local / senha123');
    console.log('  Dentista: dentista@odontosys.local / senha123');
    console.log('  Admin:    admin@odontosys.local / senha123');
  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

runSeed().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
