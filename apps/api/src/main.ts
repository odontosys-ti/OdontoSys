import { iniciarApp } from './platform/http/app';

const porta = parseInt(process.env.API_PORT || '3333', 10);

iniciarApp(porta).catch((erro) => {
  console.error('Erro fatal:', erro);
  process.exit(1);
});
