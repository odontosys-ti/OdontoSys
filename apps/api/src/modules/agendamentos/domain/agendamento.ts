import { AppError } from '../../../platform/erros';

export type StatusAgendamento = 'AGENDADO' | 'CONFIRMADO' | 'FALTOU' | 'ATENDIDO' | 'CANCELADO';

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
  justificativaLiberacao?: string;
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
  contarFaltas(clinicaId: string, pacienteId: string): Promise<number>;
  criar(dados: AgendamentoNovo): Promise<Agendamento>;
  reagendar(
    clinicaId: string,
    usuarioId: string,
    id: string,
    novoInicio: Date,
    novoFim: Date
  ): Promise<Agendamento | null>;
  cancelar(clinicaId: string, usuarioId: string, id: string): Promise<Agendamento | null>;
  atualizarStatus(
    clinicaId: string,
    usuarioId: string,
    id: string,
    status: StatusAgendamento
  ): Promise<Agendamento | null>;
}

const transicoes: Record<StatusAgendamento, readonly StatusAgendamento[]> = {
  AGENDADO: ['CONFIRMADO', 'FALTOU', 'CANCELADO'],
  CONFIRMADO: ['ATENDIDO'],
  FALTOU: [],
  ATENDIDO: [],
  CANCELADO: [],
};

export function validarTransicaoStatus(atual: StatusAgendamento, proximo: StatusAgendamento): void {
  if (!transicoes[atual].includes(proximo)) {
    throw new AppError('REGRA_NEGOCIO', [
      { campo: 'status', mensagem: 'Transição de status não permitida.' },
    ]);
  }
}

export function validarBloqueioPorFaltas(faltas: number, justificativa?: string): void {
  if (faltas >= 2 && !justificativa?.trim()) {
    throw new AppError('PACIENTE_BLOQUEADO');
  }
}

export function limitesDoDia(data: string): { de: Date; ate: Date } {
  const de = new Date(`${data}T00:00:00.000-03:00`);
  if (Number.isNaN(de.getTime()) || de.toISOString().slice(0, 10) !== data) {
    throw new AppError('VALIDACAO_INVALIDA', [{ campo: 'data', mensagem: 'Data inválida' }]);
  }
  return { de, ate: new Date(de.getTime() + 24 * 60 * 60 * 1_000) };
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
