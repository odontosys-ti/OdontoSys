import { describe, expect, it } from 'vitest';

import { processoPertenceAoOdontoSys, validarPortasLivres } from '../../../scripts/system';

describe('orquestrador do sistema', () => {
  it('reconhece somente o orquestrador deste repositório', () => {
    expect(
      processoPertenceAoOdontoSys(
        'node\0scripts/system.ts\0dev',
        '/projetos/odontosys',
        '/projetos/odontosys'
      )
    ).toBe(true);
    expect(
      processoPertenceAoOdontoSys(
        'node\0scripts/system.ts\0dev',
        '/outro/odontosys',
        '/projetos/odontosys'
      )
    ).toBe(false);
    expect(
      processoPertenceAoOdontoSys('node\0servidor.js', '/projetos/odontosys', '/projetos/odontosys')
    ).toBe(false);
  });

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
