import { describe, expect, it } from 'vitest';

import { destinoHttps } from '../https-redirect';

describe('entrada pública HTTPS', () => {
  it('redireciona requisições públicas HTTP preservando o caminho', () => {
    expect(
      destinoHttps(
        { host: 'odontosys.devstank.com.br', 'x-forwarded-proto': 'http' },
        '/login?origem=demo',
        'odontosys.devstank.com.br'
      )
    ).toBe('https://odontosys.devstank.com.br/login?origem=demo');
  });

  it('não redireciona HTTPS nem hosts diferentes', () => {
    expect(
      destinoHttps(
        { host: 'odontosys.devstank.com.br', 'x-forwarded-proto': 'https' },
        '/login',
        'odontosys.devstank.com.br'
      )
    ).toBeUndefined();
    expect(
      destinoHttps(
        { host: 'localhost:4173', 'x-forwarded-proto': 'http' },
        '/login',
        'odontosys.devstank.com.br'
      )
    ).toBeUndefined();
  });
});
