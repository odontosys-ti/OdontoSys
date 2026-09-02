import { describe, expect, it } from 'vitest';

import { SchemaIdParams } from '@odontosys/contracts';

import { IDS } from '../scripts/seed';

describe('dados demo do seed', () => {
  it('usa identificadores UUID válidos para o contrato compartilhado', () => {
    for (const id of Object.values(IDS)) {
      expect(() => SchemaIdParams.parse({ id })).not.toThrow();
    }
  });
});
