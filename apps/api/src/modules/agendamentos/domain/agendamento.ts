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

export type AgendamentoNovo = {
  clinicaId: string;
  pacienteId: string;
  profissionalId: string;
  procedimentoId: string;
  inicio: Date;
  fim: Date;
  criadoPor: string;
};

export type ListaPaginada<T> = {
  itens: T[];
  total: number;
};

export interface IAgendamentoRepository {
  listar(
    clinicaId: string,
    pagina: number,
    tamanho: number,
    de: Date,
    ate: Date,
    profissionalId?: string
  ): Promise<ListaPaginada<Agendamento>>;
  obterPorId(clinicaId: string, id: string): Promise<Agendamento | null>;
  buscarConflito(
    profissionalId: string,
    inicio: Date,
    fim: Date,
    ignorarId?: string
  ): Promise<boolean>;
  verificarRecursosAtivos(
    clinicaId: string,
    ids: { pacienteId: string; profissionalId: string; procedimentoId: string }
  ): Promise<{ duracaoMinutos: number }>;
  obterProcedimentoPorId(clinicaId: string, id: string): Promise<{ duracaoMinutos: number } | null>;
  criar(dados: AgendamentoNovo): Promise<Agendamento>;
  reagendar(
    clinicaId: string,
    usuarioId: string,
    id: string,
    novoInicio: Date,
    novoFim: Date
  ): Promise<Agendamento | null>;
  cancelar(clinicaId: string, usuarioId: string, id: string): Promise<Agendamento | null>;
}

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
