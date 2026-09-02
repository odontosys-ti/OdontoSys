import { describe, expect, it } from 'vitest';

import { validarPortasLivres } from '../../../scripts/system';

describe('orquestrador do sistema', () => {
  it('recusa iniciar dev quando a API já está ocupada', () => {
    expect(() => validarPortasLivres('dev', { api: true, web: false })).toThrow(
      'API :3333 já está ativa'
    );
  });

  it('recusa iniciar dev quando a web local já está ocupada', () => {
    expect(() => validarPortasLivres('dev', { api: false, web: true })).toThrow(
      'Web dev :5173 já está ativa'
    );
  });
});
