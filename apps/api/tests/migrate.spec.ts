import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';

import { executarMigracoes } from '../scripts/migrate';

describe('migrações', () => {
  it('aplica o histórico completo em um banco vazio', async () => {
    const origem =
      process.env.DATABASE_TEST_URL ??
      'postgresql://odontosys:odontosys_test@localhost:5433/odontosys_test';
    const nomeBanco = `odontosys_migration_${randomUUID().replaceAll('-', '')}`;
    const urlAdmin = new URL(origem);
    urlAdmin.pathname = '/postgres';
    const admin = new Pool({ connectionString: urlAdmin.toString() });
    const urlBanco = new URL(origem);
    urlBanco.pathname = `/${nomeBanco}`;

    await admin.query(`CREATE DATABASE "${nomeBanco}"`);
    try {
      await executarMigracoes(urlBanco.toString());
      const banco = new Pool({ connectionString: urlBanco.toString() });
      try {
        const tabelas = await banco.query<{ table_name: string }>(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN ('clinica', 'registro_auditoria')
          ORDER BY table_name
        `);
        expect(tabelas.rows).toEqual([
          { table_name: 'clinica' },
          { table_name: 'registro_auditoria' },
        ]);
      } finally {
        await banco.end();
      }
    } finally {
      await admin.query(`DROP DATABASE IF EXISTS "${nomeBanco}" WITH (FORCE)`);
      await admin.end();
    }
  });
});
