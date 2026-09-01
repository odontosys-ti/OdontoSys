import { spawn, type ChildProcess } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { join } from 'node:path';

const ROOT_DIR = process.cwd();
const ENV_PATH = join(ROOT_DIR, '.env');
const ENV_EXAMPLE_PATH = join(ROOT_DIR, '.env.example');

const cor = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
};

function log(mensagem: string): void {
  console.log(`${cor.cyan}[OdontoSys]${cor.reset} ${mensagem}`);
}

function sucesso(mensagem: string): void {
  console.log(`${cor.green}✔ ${mensagem}${cor.reset}`);
}

function erro(mensagem: string): void {
  console.error(`${cor.red}✖ ${mensagem}${cor.reset}`);
}

function executarComando(
  comando: string,
  args: string[],
  ambiente?: NodeJS.ProcessEnv
): Promise<number> {
  return new Promise((resolve) => {
    const processo = spawn(comando, args, {
      cwd: ROOT_DIR,
      env: ambiente ? { ...process.env, ...ambiente } : process.env,
      stdio: 'inherit',
      shell: false,
    });
    processo.on('close', (codigo) => resolve(codigo ?? 1));
    processo.on('error', () => resolve(1));
  });
}

async function testarPorta(porta: number): Promise<boolean> {
  for (const host of ['localhost', '127.0.0.1', '::1']) {
    const disponivel = await new Promise<boolean>((resolve) => {
      const socket = createConnection({ port: porta, host });
      socket.setTimeout(800);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (disponivel) return true;
  }
  return false;
}

async function aguardarPorta(porta: number, tentativas = 30): Promise<boolean> {
  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    if (await testarPorta(porta)) return true;
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
}

async function iniciarServico(
  nome: string,
  comando: string,
  args: string[],
  porta: number,
  processos: ChildProcess[],
  ambiente?: NodeJS.ProcessEnv
): Promise<void> {
  if (await testarPorta(porta)) {
    sucesso(`${nome} já está ativo em :${porta}.`);
    return;
  }

  const processo = spawn(comando, args, {
    cwd: ROOT_DIR,
    env: ambiente ? { ...process.env, ...ambiente } : process.env,
    stdio: 'inherit',
    shell: false,
  });
  processos.push(processo);
  processo.once('error', () => erro(`Falha ao iniciar ${nome}.`));
  processo.once('exit', (codigo) => {
    if (codigo !== null && codigo !== 0) erro(`${nome} encerrou com código ${codigo}.`);
  });

  if (!(await aguardarPorta(porta))) {
    processo.kill('SIGTERM');
    throw new Error(`${nome} não respondeu em :${porta}.`);
  }
  sucesso(`${nome} pronto em :${porta}.`);
}

function garantirEnv(modo: 'dev' | 'production'): void {
  if (existsSync(ENV_PATH)) return;
  if (modo === 'production') {
    throw new Error('Crie o arquivo .env antes de executar bun run production.');
  }
  copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  sucesso('.env criado a partir de .env.example.');
}

function carregarEnvLocal(): void {
  const texto = readFileSync(ENV_PATH, 'utf8');
  for (const linha of texto.split('\n')) {
    const trimmed = linha.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separador = trimmed.indexOf('=');
    if (separador < 0) continue;
    const chave = trimmed.slice(0, separador).trim();
    const valor = trimmed.slice(separador + 1).trim();
    if (process.env[chave] === undefined) process.env[chave] = valor;
  }
}

async function prepararBanco({ testes, seed }: { testes: boolean; seed: boolean }): Promise<void> {
  log('Subindo PostgreSQL local...');
  const servicos = testes ? [] : ['postgres-dev'];
  if ((await executarComando('docker', ['compose', 'up', '-d', ...servicos])) !== 0) {
    throw new Error('Docker não iniciou. Confira se o Docker Desktop está ativo.');
  }

  const bancoDev = await aguardarPorta(5432);
  const bancoTest = !testes || (await aguardarPorta(5433));
  if (!bancoDev || !bancoTest) throw new Error('Timeout aguardando PostgreSQL.');
  sucesso(testes ? 'PostgreSQL dev/test pronto.' : 'PostgreSQL dev pronto.');

  log('Aplicando migrações...');
  if ((await executarComando('pnpm', ['db:migrate'])) !== 0) {
    throw new Error('Falha ao aplicar migrações.');
  }

  if (seed) {
    log('Garantindo dados demo...');
    if ((await executarComando('pnpm', ['db:seed'])) !== 0) {
      throw new Error('Falha ao executar seed.');
    }
  }
  sucesso('Banco pronto.');
}

function ambienteProducao(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    WEB_ORIGIN: process.env.ODONTOSYS_PUBLIC_ORIGIN ?? 'https://odontosys.devstank.com.br',
    VITE_API_URL: '/api/v1',
  };
}

function configurarEncerramento(processos: ChildProcess[]): void {
  let encerrando = false;
  const encerrar = (): void => {
    if (encerrando) return;
    encerrando = true;
    log('Encerrando serviços...');
    for (const processo of processos) {
      if (!processo.killed) processo.kill('SIGTERM');
    }
    process.exit(0);
  };
  process.once('SIGINT', encerrar);
  process.once('SIGTERM', encerrar);
}

async function iniciarServicos(
  servicos: Array<{
    nome: string;
    comando: string;
    args: string[];
    porta: number;
  }>,
  ambiente?: NodeJS.ProcessEnv
): Promise<void> {
  const processos: ChildProcess[] = [];
  configurarEncerramento(processos);
  try {
    await Promise.all(
      servicos.map((servico) =>
        iniciarServico(
          servico.nome,
          servico.comando,
          servico.args,
          servico.porta,
          processos,
          ambiente
        )
      )
    );
  } catch (cause) {
    for (const processo of processos) {
      if (!processo.killed) processo.kill('SIGTERM');
    }
    throw cause;
  }
}

async function comandoDev(): Promise<void> {
  garantirEnv('dev');
  carregarEnvLocal();
  await prepararBanco({ testes: true, seed: true });
  log('Iniciando desenvolvimento...');
  await iniciarServicos([
    {
      nome: 'API dev',
      comando: 'pnpm',
      args: ['--filter=@odontosys/api', 'run', 'dev'],
      porta: 3333,
    },
    {
      nome: 'Web dev',
      comando: 'pnpm',
      args: ['--filter=@odontosys/web', 'run', 'dev'],
      porta: 5173,
    },
  ]);
}

async function comandoProduction(): Promise<void> {
  garantirEnv('production');
  carregarEnvLocal();
  if (await testarPorta(3333)) {
    throw new Error(
      'A API :3333 já está ativa. Encerre o ambiente dev antes de iniciar production.'
    );
  }
  if (await testarPorta(4173)) {
    throw new Error(
      'A Web production :4173 já está ativa. Encerre o processo anterior antes de reiniciar.'
    );
  }
  const ambiente = ambienteProducao();
  await prepararBanco({ testes: false, seed: false });

  log('Gerando build de produção...');
  if ((await executarComando('pnpm', ['build'], ambiente)) !== 0) {
    throw new Error('Falha no build de produção.');
  }
  sucesso('Build pronto.');

  log('Iniciando produção local para o túnel...');
  await iniciarServicos(
    [
      {
        nome: 'API produção',
        comando: 'node',
        args: ['--import', 'tsx', 'apps/api/dist/main.js'],
        porta: 3333,
      },
      {
        nome: 'Web produção',
        comando: 'pnpm',
        args: ['--filter=@odontosys/web', 'run', 'preview'],
        porta: 4173,
      },
    ],
    ambiente
  );
}

async function comandoStop(): Promise<void> {
  if ((await executarComando('docker', ['compose', 'stop'])) !== 0) {
    throw new Error('Falha ao parar os containers.');
  }
  sucesso(
    'PostgreSQL parado. Serviços web/API terminam com Ctrl+C no terminal em que foram iniciados.'
  );
}

async function comandoDown(): Promise<void> {
  if ((await executarComando('docker', ['compose', 'down'])) !== 0) {
    throw new Error('Falha ao remover os containers.');
  }
  sucesso('Containers e rede removidos.');
}

async function comandoStatus(): Promise<void> {
  const [pgDev, pgTest, api, webDev, webProduction] = await Promise.all([
    testarPorta(5432),
    testarPorta(5433),
    testarPorta(3333),
    testarPorta(5173),
    testarPorta(4173),
  ]);
  const estado = (ativo: boolean): string =>
    ativo ? `${cor.green}●${cor.reset}` : `${cor.red}○${cor.reset}`;
  console.log(`PostgreSQL dev : ${estado(pgDev)}  | PostgreSQL test: ${estado(pgTest)}`);
  console.log(`API :3333       ${estado(api)}  | Web dev :5173   ${estado(webDev)}`);
  console.log(`Web production :4173 ${estado(webProduction)}`);
}

async function main(): Promise<void> {
  const acao = process.argv[2] ?? 'dev';
  switch (acao) {
    case 'dev':
      await comandoDev();
      return;
    case 'production':
      await comandoProduction();
      return;
    case 'stop':
      await comandoStop();
      return;
    case 'down':
      await comandoDown();
      return;
    case 'status':
      await comandoStatus();
      return;
    default:
      throw new Error(`Comando desconhecido: ${acao}. Use dev, production, stop, down ou status.`);
  }
}

main().catch((cause: unknown) => {
  erro(cause instanceof Error ? cause.message : 'Falha inesperada.');
  process.exit(1);
});
