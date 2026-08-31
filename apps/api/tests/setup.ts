import { afterAll, beforeAll } from 'vitest';

import { executarMigracoes } from '../scripts/migrate';
import { carregarEnv, definirEnv, limparEnvCache } from '../src/platform/config';
import { fecharDb } from '../src/platform/db';

const url =
  process.env.DATABASE_TEST_URL ??
  process.env.DATABASE_URL ??
  'postgresql://odontosys:odontosys_test@localhost:5433/odontosys_test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = url;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'chave-de-teste-com-pelo-menos-32-caracteres';
process.env.WEB_ORIGIN = 'http://localhost:5173';

beforeAll(async () => {
  limparEnvCache();
  definirEnv(
    carregarEnv({
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: url,
      JWT_SECRET: process.env.JWT_SECRET,
    })
  );
  await executarMigracoes(url);
});

afterAll(async () => {
  await fecharDb();
});
