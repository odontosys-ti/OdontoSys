import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { aplicarDotEnv, carregarEnv, duracaoEmSegundos } from '../src/platform/config';

const base = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://odontosys:test@localhost:5432/odontosys_test',
  JWT_SECRET: 'chave-de-teste-com-pelo-menos-32-caracteres',
  WEB_ORIGIN: 'http://localhost:5173',
};

describe('configuração', () => {
  it('converte a duração da sessão para segundos', () => {
    expect(duracaoEmSegundos('8h')).toBe(28_800);
    expect(duracaoEmSegundos('30m')).toBe(1_800);
    expect(() => duracaoEmSegundos('amanhã')).toThrow('Duração inválida');
  });

  it('rejeita duração de sessão e origem inválidas', () => {
    expect(() => carregarEnv({ ...base, JWT_EXPIRES_IN: 'amanhã' })).toThrow('JWT_EXPIRES_IN');
    expect(() => carregarEnv({ ...base, WEB_ORIGIN: '*' })).toThrow('WEB_ORIGIN');
  });

  it('não confia em proxy por padrão', () => {
    expect(carregarEnv(base).TRUST_PROXY).toBe(false);
    expect(carregarEnv({ ...base, TRUST_PROXY: 'true' }).TRUST_PROXY).toBe(true);
  });

  it('carrega .env sem sobrescrever variáveis existentes', () => {
    const pastaAnterior = process.cwd();
    const pasta = mkdtempSync(join(tmpdir(), 'odontosys-env-'));
    process.env.ODONTOSYS_EXISTENTE = 'ambiente';
    writeFileSync(
      join(pasta, '.env'),
      [
        '',
        '# comentário',
        'LINHA_SEM_IGUAL',
        'ODONTOSYS_NOVA=arquivo',
        'ODONTOSYS_EXISTENTE=arquivo',
      ].join('\n')
    );

    try {
      process.chdir(pasta);
      aplicarDotEnv();
      expect(process.env.ODONTOSYS_NOVA).toBe('arquivo');
      expect(process.env.ODONTOSYS_EXISTENTE).toBe('ambiente');
    } finally {
      process.chdir(pastaAnterior);
      delete process.env.ODONTOSYS_NOVA;
      delete process.env.ODONTOSYS_EXISTENTE;
      rmSync(pasta, { recursive: true, force: true });
    }
  });
});
