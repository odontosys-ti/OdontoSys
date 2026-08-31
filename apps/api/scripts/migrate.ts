import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { aplicarDotEnv } from '../src/platform/config';
import { Pool } from 'pg';

aplicarDotEnv();

const pastaMigracoes = join(dirname(fileURLToPath(import.meta.url)), '../drizzle');

export async function executarMigracoes(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      aplicado_em timestamptz NOT NULL DEFAULT now()
    )
  `);

  const arquivos = (await readdir(pastaMigracoes)).filter((nome) => nome.endsWith('.sql')).sort();

  for (const arquivo of arquivos) {
    const ja = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1', [arquivo]);
    if ((ja.rowCount ?? 0) > 0) {
      continue;
    }
    const sql = await readFile(join(pastaMigracoes, arquivo), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (id) VALUES ($1)', [arquivo]);
  }

  await pool.end();
}

const run = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida');
  }
  await executarMigracoes(process.env.DATABASE_URL);
};

if (process.argv[1]?.includes('migrate')) {
  run().catch((erro: unknown) => {
    process.stderr.write(`${erro instanceof Error ? erro.message : 'erro'}\n`);
    process.exit(1);
  });
}
