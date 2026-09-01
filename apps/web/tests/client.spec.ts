import { z } from 'zod';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, api } from '../src/shared/api/client';

const SchemaResposta = z.object({ nome: z.string() });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cliente HTTP', () => {
  it('valida a resposta recebida com o contrato informado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ nome: 'Ana' }), { status: 200 }))
    );

    await expect(api('/recurso', SchemaResposta)).resolves.toEqual({ nome: 'Ana' });
  });

  it('rejeita resposta incompatível com o contrato', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ nome: 12 }), { status: 200 }))
    );

    await expect(api('/recurso', SchemaResposta)).rejects.toBeInstanceOf(z.ZodError);
  });

  it('inclui a proteção CSRF nas mutações e preserva o erro da API', async () => {
    const requisicao = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          erro: { codigo: 'SEM_PERMISSAO', mensagem: 'Acesso negado', detalhes: [] },
          requestId: 'req-1',
        }),
        { status: 403 }
      )
    );
    vi.stubGlobal('fetch', requisicao);

    await expect(api('/recurso', SchemaResposta, { method: 'POST' })).rejects.toMatchObject<
      Partial<ApiError>
    >({ status: 403, codigo: 'SEM_PERMISSAO', message: 'Acesso negado' });
    expect(requisicao).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-OdontoSys-CSRF': '1' }),
      })
    );
  });

  it('não envia content-type JSON em mutação sem corpo', async () => {
    const requisicao = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', requisicao);

    await expect(
      api('/auth/logout', z.object({ ok: z.boolean() }), { method: 'POST' })
    ).resolves.toEqual({
      ok: true,
    });

    expect(requisicao).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('aceita resposta sem conteúdo quando o contrato permite', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(api('/recurso', z.undefined(), { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('normaliza erro não estruturado sem vazar o corpo recebido', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('indisponível', { status: 503, statusText: 'Offline' }))
    );

    await expect(api('/recurso', SchemaResposta)).rejects.toMatchObject<Partial<ApiError>>({
      status: 503,
      codigo: 'ERRO_INTERNO',
      message: 'Offline',
    });
  });
});
