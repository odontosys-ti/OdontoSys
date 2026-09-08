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
  emProcessamento: boolean;
  claimToken: string | null;
  claimExpiraEm: Date | null;
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
  idempotenciaKey: string;
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
  claimToken: string;
  lembreteId: string;
};

export type EntradaReivindicacaoLembrete = {
  clinicaId: string;
  agendamentoId: string;
  pacienteId: string;
  canal: CanalMensagem;
  janela: JanelaLembrete;
  transporte: string;
  solicitadoPor: string;
  idempotenciaKey: string;
  leaseMs?: number;
};

export type ReivindicacaoLembrete =
  | { tipo: 'DISPARAR'; lembrete: Lembrete; claimToken: string; idempotenciaKey: string }
  | { tipo: 'IDEMPOTENTE'; lembrete: Lembrete }
  | { tipo: 'EM_PROCESSAMENTO'; lembrete: Lembrete };

export interface ILembreteRepository {
  obterContextoEnvio(
    clinicaId: string,
    agendamentoId: string
  ): Promise<ContextoEnvioLembrete | null>;
  reivindicar(entrada: EntradaReivindicacaoLembrete): Promise<ReivindicacaoLembrete>;
  finalizar(entrada: ResultadoPersistenciaLembrete): Promise<Lembrete>;
  listarPendencias(clinicaId: string, pagina: number, tamanho: number): Promise<ListaLembretes>;
}

const MENSAGENS_FALHA_SEGURAS = {
  SIMULADOR_FALHA: 'Falha simulada no transporte.',
  TRANSPORTE_ERRO: 'Não foi possível concluir o envio pelo transporte configurado.',
  TRANSPORTE_NAO_CONFIGURADO: 'O transporte de mensagens não está configurado.',
  TRANSPORTE_INDISPONIVEL: 'O transporte de mensagens está indisponível.',
  EM_PROCESSAMENTO: 'Envio em processamento.',
  FALHA_DESCONHECIDA: 'Não foi possível concluir o envio do lembrete.',
} as const;

export type CodigoFalhaLembrete = keyof typeof MENSAGENS_FALHA_SEGURAS;

export function sanitizarResultadoTransporte(resultado: ResultadoTransporte): ResultadoTransporte {
  if (resultado.status === 'FALHOU') {
    const codigo =
      typeof resultado.codigoFalha === 'string' && resultado.codigoFalha in MENSAGENS_FALHA_SEGURAS
        ? (resultado.codigoFalha as CodigoFalhaLembrete)
        : 'FALHA_DESCONHECIDA';
    return {
      status: 'FALHOU',
      providerId: null,
      codigoFalha: codigo,
      mensagemFalha: MENSAGENS_FALHA_SEGURAS[codigo],
    };
  }

  if (resultado.status === 'ENVIADO' || resultado.status === 'ENTREGUE') {
    const providerId =
      typeof resultado.providerId === 'string' &&
      /^[A-Za-z0-9._:-]{1,200}$/.test(resultado.providerId)
        ? resultado.providerId
        : null;
    return { status: resultado.status, providerId, codigoFalha: null, mensagemFalha: null };
  }

  return {
    status: 'FALHOU',
    providerId: null,
    codigoFalha: 'FALHA_DESCONHECIDA',
    mensagemFalha: MENSAGENS_FALHA_SEGURAS.FALHA_DESCONHECIDA,
  };
}

export function sanitizarLembrete(item: Lembrete): Lembrete {
  return { ...item, ...sanitizarResultadoTransporte(item) };
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
