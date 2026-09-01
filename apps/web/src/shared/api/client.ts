import type { EnvelopeErro } from '@odontosys/contracts';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensagem: string
  ) {
    super(mensagem);
  }
}

export async function api<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const metodo = (init.method ?? 'GET').toUpperCase();
  const mutacao = !['GET', 'HEAD', 'OPTIONS'].includes(metodo);
  const resposta = await fetch(`${baseUrl}${caminho}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(mutacao ? { 'X-OdontoSys-CSRF': '1' } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!resposta.ok) {
    let codigo = 'ERRO_INTERNO';
    let mensagem = 'Falha na requisição';
    try {
      const corpo = (await resposta.json()) as EnvelopeErro;
      codigo = corpo.erro.codigo;
      mensagem = corpo.erro.mensagem;
    } catch {
      mensagem = resposta.statusText;
    }
    throw new ApiError(resposta.status, codigo, mensagem);
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  return (await resposta.json()) as T;
}
