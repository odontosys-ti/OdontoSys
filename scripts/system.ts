import { spawn, type ChildProcess } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import { join } from 'node:path';

const ROOT_DIR = process.cwd();
const ENV_PATH = join(ROOT_DIR, '.env');
const ENV_EXAMPLE_PATH = join(ROOT_DIR, '.env.example');

// Utilitários de formatação de console
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(mensagem: string): void {
  console.log(`${c.cyan}[OdontoSys]${c.reset} ${mensagem}`);
}

function logSucesso(mensagem: string): void {
  console.log(`${c.green}✔ ${mensagem}${c.reset}`);
}

function logErro(mensagem: string): void {
  console.error(`${c.red}✖ ${mensagem}${c.reset}`);
}

function executarComando(comando: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn(comando, args, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: false,
    });
    proc.on('close', (code) => resolve(code ?? 0));
    proc.on('error', () => resolve(1));
  });
}

async function testarPorta(porta: number, timeoutMs = 800): Promise<boolean> {
  const hosts = ['localhost', '127.0.0.1', '::1'];
  for (const host of hosts) {
    const ok = await new Promise<boolean>((resolve) => {
      const socket = createConnection({ port: porta, host });
      socket.setTimeout(timeoutMs);
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
    if (ok) return true;
  }
  return false;
}

async function aguardarBanco(porta: number, maxTentativas = 30): Promise<boolean> {
  for (let i = 0; i < maxTentativas; i++) {
    const pronto = await testarPorta(porta);
    if (pronto) return true;
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
}

// 1. Comando: START
async function comandoStart(): Promise<void> {
  console.log(`
${c.blue}${c.bold}======================================================
  🦷 OdontoSys — Inicialização Inteligente do Sistema
======================================================${c.reset}
`);

  // Passo 1: Garantir .env
  if (!existsSync(ENV_PATH)) {
    log(`Arquivo .env não encontrado. Criando a partir de .env.example...`);
    copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
    logSucesso('Arquivo .env criado com sucesso.');
  }

  // Passo 2: Subir containers Docker
  log('Verificando e iniciando containers do banco de dados (PostgreSQL)...');
  const codeDocker = await executarComando('docker', ['compose', 'up', '-d']);
  if (codeDocker !== 0) {
    logErro(
      'Falha ao iniciar os containers do Docker. Certifique-se de que o Docker está rodando.'
    );
    process.exit(1);
  }

  // Passo 3: Aguardar banco de dados
  log('Aguardando banco de dados responder na porta 5432...');
  const bancoDevPronto = await aguardarBanco(5432);
  const bancoTestPronto = await aguardarBanco(5433);

  if (!bancoDevPronto || !bancoTestPronto) {
    logErro('Timeout aguardando inicialização do PostgreSQL.');
    process.exit(1);
  }
  logSucesso('Bancos de dados de desenvolvimento (5432) e testes (5433) prontos!');

  // Passo 4: Executar migrações e seed
  log('Aplicando migrações e dados de seed...');
  const codeMigrate = await executarComando('pnpm', [
    '--filter=@odontosys/api',
    'run',
    'db:migrate',
  ]);
  if (codeMigrate !== 0) {
    logErro('Falha ao aplicar migrações do banco.');
    process.exit(1);
  }

  const codeSeed = await executarComando('pnpm', ['--filter=@odontosys/api', 'run', 'db:seed']);
  if (codeSeed !== 0) {
    logErro('Falha ao semear banco de dados.');
    process.exit(1);
  }
  logSucesso('Migrações aplicadas e seed garantido com sucesso.');

  // Passo 5: Exibir Banner de Serviços
  console.log(`
${c.green}${c.bold}✔ Todos os serviços e dependências estão prontos!${c.reset}

${c.bold}Endereços Locais:${c.reset}
  🌐 ${c.cyan}Aplicação Web (React/Tailwind):${c.reset} ${c.bold}http://localhost:5173${c.reset}
  ⚙️  ${c.cyan}API Backend (Fastify):${c.reset}         ${c.bold}http://localhost:3333${c.reset}
  📖 ${c.cyan}Documentação Swagger / OpenAPI:${c.reset} ${c.bold}http://localhost:3333/docs${c.reset}

${c.bold}Credenciais Demo (Seed):${c.reset}
  👤 ${c.yellow}Recepção:${c.reset} recepcao@odontosys.local / senha123
  👤 ${c.blue}Dentista:${c.reset} dentista@odontosys.local / senha123
  👤 ${c.magenta}Admin:${c.reset}    admin@odontosys.local    / senha123

${c.dim}Pressione Ctrl+C a qualquer momento para encerrar todos os processos.${c.reset}
`);

  // Passo 6: Iniciar processos da API e Web em paralelo com graceful shutdown
  const processos: ChildProcess[] = [];

  const apiProc = spawn('pnpm', ['--filter=@odontosys/api', 'run', 'dev'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: false,
  });
  processos.push(apiProc);

  const webProc = spawn('pnpm', ['--filter=@odontosys/web', 'run', 'dev'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: false,
  });
  processos.push(webProc);

  const encerrar = () => {
    log('Encerrando processos da API e Web...');
    for (const proc of processos) {
      if (!proc.killed) {
        proc.kill('SIGTERM');
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', encerrar);
  process.on('SIGTERM', encerrar);
}

// 2. Comando: STOP
async function comandoStop(): Promise<void> {
  console.log(`
${c.yellow}${c.bold}======================================================
  🛑 OdontoSys — Parada Completa do Sistema
======================================================${c.reset}
`);

  log('Parando containers do Docker (PostgreSQL dev & test)...');
  await executarComando('docker', ['compose', 'stop']);
  logSucesso('Containers parados com sucesso.');

  console.log(`
${c.green}${c.bold}✔ Sistema OdontoSys pausado com sucesso!${c.reset}
${c.dim}Para iniciar novamente, execute: pnpm start:all${c.reset}
`);
}

// 3. Comando: DOWN
async function comandoDown(): Promise<void> {
  console.log(`
${c.yellow}${c.bold}======================================================
  🛑 OdontoSys — Desligamento Completo dos Containers
======================================================${c.reset}
`);

  log('Removendo containers e redes do Docker...');
  await executarComando('docker', ['compose', 'down']);
  logSucesso('Containers e redes removidos.');
}

// 4. Comando: STATUS
async function comandoStatus(): Promise<void> {
  console.log(`
${c.cyan}${c.bold}======================================================
  📊 OdontoSys — Status dos Serviços
======================================================${c.reset}
`);

  const pgDev = await testarPorta(5432);
  const pgTest = await testarPorta(5433);
  const apiHttp = await testarPorta(3333);
  const webHttp = await testarPorta(5173);

  console.log(
    `  PostgreSQL Dev (5432):  ${pgDev ? `${c.green}● Rodando${c.reset}` : `${c.red}○ Parado${c.reset}`}`
  );
  console.log(
    `  PostgreSQL Test (5433): ${pgTest ? `${c.green}● Rodando${c.reset}` : `${c.red}○ Parado${c.reset}`}`
  );
  console.log(
    `  API Backend (3333):     ${apiHttp ? `${c.green}● Ativa (http://localhost:3333)${c.reset}` : `${c.red}○ Inativa${c.reset}`}`
  );
  console.log(
    `  Web Frontend (5173):    ${webHttp ? `${c.green}● Ativa (http://localhost:5173)${c.reset}` : `${c.red}○ Inativa${c.reset}`}`
  );
  console.log('');
}

// Roteador de comandos da CLI
const acao = process.argv[2] ?? 'start';

switch (acao) {
  case 'start':
  case 'up':
    comandoStart().catch((err) => {
      logErro(String(err));
      process.exit(1);
    });
    break;
  case 'stop':
    comandoStop().catch((err) => {
      logErro(String(err));
      process.exit(1);
    });
    break;
  case 'down':
    comandoDown().catch((err) => {
      logErro(String(err));
      process.exit(1);
    });
    break;
  case 'status':
    comandoStatus().catch((err) => {
      logErro(String(err));
      process.exit(1);
    });
    break;
  default:
    logErro(`Comando desconhecido: ${acao}. Use: start, stop, down ou status.`);
    process.exit(1);
}
