import { z } from 'zod';

import type { ConfiguracaoAutomacaoLembretes } from './automatico';

export const CHAVE_CONFIGURACAO_LEMBRETES = 'LEMBRETES_AUTOMATICOS';

const SchemaConfiguracaoAutomacaoLembretes = z
  .object({
    toleranciaMinutos: z.number().int().min(0).max(60),
    inicioOperacional: z.string().regex(/^\d{2}:\d{2}$/),
    fimOperacional: z.string().regex(/^\d{2}:\d{2}$/),
    limiteLote: z.number().int().positive().max(1000),
  })
  .strict();

function minutos(valor: string): number {
  const partes = valor.split(':').map(Number);
  return (partes[0] ?? 0) * 60 + (partes[1] ?? 0);
}

function horarioValido(valor: string): boolean {
  const [horaTexto, minutoTexto] = valor.split(':');
  const hora = Number(horaTexto);
  const minuto = Number(minutoTexto);
  return (
    Number.isInteger(hora) &&
    Number.isInteger(minuto) &&
    hora >= 0 &&
    hora <= 23 &&
    minuto >= 0 &&
    minuto <= 59
  );
}

export function validarConfiguracaoAutomacao(valor: unknown): ConfiguracaoAutomacaoLembretes {
  const resultado = SchemaConfiguracaoAutomacaoLembretes.safeParse(valor);
  if (!resultado.success) {
    throw new Error('Configuração operacional de lembretes inválida');
  }
  const inicio = minutos(resultado.data.inicioOperacional);
  const fim = minutos(resultado.data.fimOperacional);
  if (
    !horarioValido(resultado.data.inicioOperacional) ||
    !horarioValido(resultado.data.fimOperacional)
  ) {
    throw new Error('Configuração operacional de lembretes inválida');
  }
  if (inicio >= fim) {
    throw new Error('Configuração operacional de lembretes inválida');
  }
  return resultado.data;
}

export interface IConfiguracaoClinicaRepository {
  obter(clinicaId: string): Promise<unknown | null>;
}
