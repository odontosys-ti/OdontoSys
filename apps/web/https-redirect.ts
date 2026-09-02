import type { IncomingHttpHeaders } from 'node:http';

export function destinoHttps(
  headers: IncomingHttpHeaders,
  caminho: string | undefined,
  hostPublico: string
): string | undefined {
  const protocolo = headers['x-forwarded-proto'];
  if (headers.host !== hostPublico || protocolo !== 'http') return undefined;
  return `https://${hostPublico}${caminho ?? '/'}`;
}
