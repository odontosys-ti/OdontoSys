import pino from 'pino';

import { env } from './config';

export function criarOpcoesLogger() {
  const configuracao = env();
  const desenvolvimento = configuracao.NODE_ENV === 'development';

  return {
    level: configuracao.LOG_LEVEL,
    redact: {
      paths: [
        'nome',
        'email',
        'documento',
        'senha',
        'senhaHash',
        '*.nome',
        '*.email',
        '*.documento',
        '*.senha',
        '*.senhaHash',
        'req.body.senha',
        'req.body.email',
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers.set-cookie',
      ],
      remove: true,
    },
    transport: desenvolvimento
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  };
}

export function criarLogger(): pino.Logger {
  return pino(criarOpcoesLogger());
}
