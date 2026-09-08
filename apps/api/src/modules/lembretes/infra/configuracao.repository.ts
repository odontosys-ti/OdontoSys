import { and, eq } from 'drizzle-orm';

import { db } from '../../../platform/db';
import { configuracaoClinica } from '../../../platform/db/schema';
import {
  CHAVE_CONFIGURACAO_LEMBRETES,
  type IConfiguracaoClinicaRepository,
} from '../domain/configuracao';

export class ConfiguracaoClinicaRepository implements IConfiguracaoClinicaRepository {
  async obter(clinicaId: string): Promise<unknown | null> {
    const [registro] = await db()
      .select({ valor: configuracaoClinica.valor })
      .from(configuracaoClinica)
      .where(
        and(
          eq(configuracaoClinica.clinicaId, clinicaId),
          eq(configuracaoClinica.chave, CHAVE_CONFIGURACAO_LEMBRETES)
        )
      )
      .limit(1);
    return registro?.valor ?? null;
  }
}
