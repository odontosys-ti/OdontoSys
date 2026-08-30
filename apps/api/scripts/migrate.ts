import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';

const runMigrate = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🔄 Executando migrações...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrações concluídas com sucesso');

  await pool.end();
};

runMigrate().catch((err) => {
  console.error('❌ Erro ao executar migrações:', err);
  process.exit(1);
});
