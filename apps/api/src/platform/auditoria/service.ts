import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from '../db/schema';
import { registroAuditoria } from '../db/schema';
import { criarUuidV7 } from '../uuid';

export type Tx = NodePgDatabase<typeof schema>;

export type AcaoAuditoria = 'CRIAR' | 'EDITAR' | 'DELETAR';

export async function registrarAuditoria(
  tx: Tx,
  entrada: {
    clinicaId: string;
    usuarioId: string;
    entidade: string;
    entidadeId: string;
    acao: AcaoAuditoria;
    dadosAntes?: unknown;
    dadosDepois?: unknown;
  }
): Promise<void> {
  await tx.insert(registroAuditoria).values({
    id: criarUuidV7(),
    clinicaId: entrada.clinicaId,
    usuarioId: entrada.usuarioId,
    entidade: entrada.entidade,
    entidadeId: entrada.entidadeId,
    acao: entrada.acao,
    dadosAntes: entrada.dadosAntes ?? null,
    dadosDepois: entrada.dadosDepois ?? null,
  });
}
