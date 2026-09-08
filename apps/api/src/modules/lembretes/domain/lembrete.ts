import type {
  CanalMensagem,
  JanelaLembrete,
  StatusAgendamento,
  StatusLembrete,
} from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';

export type Lembrete = {
  id: string;
  clinicaId: string;
  agendamentoId: string;
  pacienteId: string;
  canal: CanalMensagem;
  janela: JanelaLembrete;
  status: StatusLembrete;
  transporte: string;
  providerId: string | null;
  codigoFalha: string | null;
  mensagemFalha: string | null;
  solicitadoPor: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type ContextoEnvioLembrete = {
  agendamentoId: string;
  clinicaId: string;
  pacienteId: string;
  inicio: Date;
  statusAgendamento: StatusAgendamento;
  fusoHorario: string;
  nomePaciente: string;
  telefone: string | null;
  canalPreferido: CanalMensagem | null;
  consentimentoAtivo: boolean;
};

export type ResultadoTransporte = {
  status: StatusLembrete;
  providerId: string | null;
  codigoFalha: string | null;
  mensagemFalha: string | null;
};

export type EntradaTransporte = {
  chaveLogica: string;
  telefone: string;
  mensagem: string;
  canal: CanalMensagem;
};

export interface ITeletransporte {
  readonly nome: string;
  enviar(entrada: EntradaTransporte): Promise<ResultadoTransporte>;
}

export type ListaLembretes = { itens: Lembrete[]; total: number };

export type ResultadoPersistenciaLembrete = {
  clinicaId: string;
  agendamentoId: string;
  pacienteId: string;
  canal: CanalMensagem;
  janela: JanelaLembrete;
  transporte: string;
  resultado: ResultadoTransporte;
  solicitadoPor: string;
};

export interface ILembreteRepository {
  obterContextoEnvio(
    clinicaId: string,
    agendamentoId: string
  ): Promise<ContextoEnvioLembrete | null>;
  obterPorChave(
    clinicaId: string,
    agendamentoId: string,
    janela: JanelaLembrete,
    canal: CanalMensagem
  ): Promise<Lembrete | null>;
  persistir(entrada: ResultadoPersistenciaLembrete): Promise<Lembrete>;
  listarPendencias(clinicaId: string, pagina: number, tamanho: number): Promise<ListaLembretes>;
}

export function montarMensagemLembrete(entrada: {
  nomePaciente: string;
  inicio: Date;
  fusoHorario: string;
}): string {
  const data = new Intl.DateTimeFormat('pt-BR', {
    timeZone: entrada.fusoHorario,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(entrada.inicio);
  const horario = new Intl.DateTimeFormat('pt-BR', {
    timeZone: entrada.fusoHorario,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(entrada.inicio);
  return `Olá, ${entrada.nomePaciente}. Lembrete da sua consulta em ${data} às ${horario}.`;
}

export function chaveLogicaLembrete(
  agendamentoId: string,
  janela: JanelaLembrete,
  canal: CanalMensagem
): string {
  return `${agendamentoId}:${janela}:${canal}`;
}

export function validarElegibilidadeLembrete(entrada: {
  statusAgendamento: StatusAgendamento;
  consentimentoAtivo: boolean;
  telefone: string | null;
  canalPreferido: CanalMensagem | null;
}): void {
  if (entrada.statusAgendamento === 'CANCELADO') {
    throw new AppError('REGRA_NEGOCIO', [
      { campo: 'status', mensagem: 'Agendamento cancelado não pode receber lembrete.' },
    ]);
  }
  if (!entrada.consentimentoAtivo) {
    throw new AppError('REGRA_NEGOCIO', [
      { campo: 'consentimentoAtivo', mensagem: 'Paciente não possui consentimento ativo.' },
    ]);
  }
  if (!entrada.telefone || !entrada.canalPreferido) {
    throw new AppError('REGRA_NEGOCIO', [
      { campo: 'contato', mensagem: 'Paciente não possui contato válido para lembrete.' },
    ]);
  }
}
