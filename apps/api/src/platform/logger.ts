import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // Redação de dados pessoais
  redact: {
    paths: ['*.nome', '*.email', '*.documento', '*.senha', '*.senhaHash'],
    remove: true,
  },
});
