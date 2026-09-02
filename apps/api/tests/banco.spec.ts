import { sql } from 'drizzle-orm';

import { db } from '../src/platform/db';

describe('garantias do banco', () => {
  it('mantém timestamps completos no registro de auditoria', async () => {
    const resultado = await db().execute<{ column_name: string }>(sql`
      select column_name
      from information_schema.columns
      where table_name = 'registro_auditoria'
        and column_name = 'atualizado_em'
    `);

    expect(resultado.rows).toEqual([{ column_name: 'atualizado_em' }]);
  });

  it('mantém restrição de exclusão contra sobreposição', async () => {
    const resultado = await db().execute<{ conname: string; definicao: string }>(sql`
      select conname, pg_get_constraintdef(oid) as definicao
      from pg_constraint
      where conname = 'agendamento_sem_sobreposicao'
    `);

    expect(resultado.rows).toHaveLength(1);
    expect(resultado.rows[0]?.conname).toBe('agendamento_sem_sobreposicao');
    expect(resultado.rows[0]?.definicao).toMatch(/status <> 'CANCELADO'/);
  });
});
