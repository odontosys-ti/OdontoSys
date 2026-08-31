import { AppError } from '../erros';

export function paraIso(data: Date): string {
  return data.toISOString();
}

export function parseData(valor: string, campo: string): Date {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    throw new AppError('VALIDACAO_INVALIDA', [{ campo, mensagem: 'Data inválida' }]);
  }
  return data;
}
