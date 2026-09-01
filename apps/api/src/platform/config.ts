import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { z } from 'zod';

export function aplicarDotEnv(): void {
  const candidatos = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')];
  for (const arquivo of candidatos) {
    if (!existsSync(arquivo)) {
      continue;
    }
    const texto = readFileSync(arquivo, 'utf8');
    for (const linha of texto.split('\n')) {
      const trimmed = linha.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const eq = trimmed.indexOf('=');
      if (eq < 0) {
        continue;
      }
      const chave = trimmed.slice(0, eq).trim();
      const valor = trimmed.slice(eq + 1).trim();
      if (process.env[chave] === undefined) {
        process.env[chave] = valor;
      }
    }
  }
}

const SchemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  DATABASE_TEST_URL: z.url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'use uma duração como 30m, 8h ou 7d')
    .default('8h'),
  WEB_ORIGIN: z
    .string()
    .refine(
      (valor) => {
        try {
          return ['http:', 'https:'].includes(new URL(valor).protocol);
        } catch {
          return false;
        }
      },
      { message: 'deve ser uma origem HTTP ou HTTPS válida' }
    )
    .default('http://localhost:5173'),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .transform((valor) => valor === 'true')
    .default(false),
  LOG_LEVEL: z.string().min(1).default('info'),
});

export type Env = z.infer<typeof SchemaEnv>;

const multiplicadores = { s: 1, m: 60, h: 3_600, d: 86_400 } as const;

export function duracaoEmSegundos(valor: string): number {
  const correspondencia = /^(\d+)([smhd])$/.exec(valor);
  if (!correspondencia) {
    throw new Error('Duração inválida');
  }
  const quantidade = Number(correspondencia[1]);
  const unidade = correspondencia[2] as keyof typeof multiplicadores;
  return quantidade * multiplicadores[unidade];
}

let cache: Env | undefined;

export function carregarEnv(fonte: NodeJS.ProcessEnv = process.env): Env {
  if (fonte === process.env) {
    aplicarDotEnv();
  }
  const resultado = SchemaEnv.safeParse(fonte);
  if (!resultado.success) {
    const campos = resultado.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${campos}`);
  }
  cache = resultado.data;
  return resultado.data;
}

export function env(): Env {
  if (!cache) {
    return carregarEnv();
  }
  return cache;
}

export function definirEnv(valor: Env): void {
  cache = valor;
}

export function limparEnvCache(): void {
  cache = undefined;
}
