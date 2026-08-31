import { carregarEnv } from './platform/config';
import { iniciarApp } from './platform/http/app';

try {
  carregarEnv();
} catch (erro) {
  const mensagem = erro instanceof Error ? erro.message : 'Falha ao carregar ambiente';
  process.stderr.write(`${mensagem}\n`);
  process.exit(1);
}

void iniciarApp();
