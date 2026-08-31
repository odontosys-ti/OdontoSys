import { AppError } from '../../../platform/erros';

export type StatusAgendamento = 'AGENDADO' | 'CANCELADO';

export type Agendamento = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  profissionalId: string;
  procedimentoId: string;
  inicio: Date;
  fim: Date;
  status: StatusAgendamento;
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm: Date;
};

export function calcularFim(inicio: Date, duracaoMinutos: number): Date {
  return new Date(inicio.getTime() + duracaoMinutos * 60_000);
}

export function intervalosSobrepostos(
  a: { inicio: Date; fim: Date },
  b: { inicio: Date; fim: Date }
): boolean {
  return a.inicio < b.fim && b.inicio < a.fim;
}

export function validarInicioFuturo(inicio: Date, agora: Date = new Date()): void {
  if (inicio.getTime() <= agora.getTime()) {
    throw new AppError('REGRA_NEGOCIO', [
      { campo: 'inicio', mensagem: 'O agendamento deve começar no futuro.' },
    ]);
  }
}

export function validarDuracao(duracaoMinutos: number): void {
  if (!Number.isInteger(duracaoMinutos) || duracaoMinutos <= 0) {
    throw new AppError('REGRA_NEGOCIO', [
      { campo: 'duracaoMinutos', mensagem: 'Duração do procedimento inválida.' },
    ]);
  }
}
