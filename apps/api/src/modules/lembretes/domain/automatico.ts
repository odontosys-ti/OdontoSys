import type { StatusAgendamento } from '@odontosys/contracts';

import type { ContextoAutomaticoLembrete } from './lembrete';

export type ConfiguracaoAutomacaoLembretes = {
  toleranciaMinutos: number;
  inicioOperacional: string;
  fimOperacional: string;
  limiteLote: number;
  /** Compatibilidade para seleção unitária; o worker real agrupa por clínica. */
  clinicaId?: string;
};

export interface IConfiguracaoAutomacaoLembretes {
  obterParaClinica(clinicaId: string): Promise<ConfiguracaoAutomacaoLembretes>;
}

export type JanelaAutomatica = 'VINTE_E_QUATRO_HORAS' | 'QUARENTA_E_OITO_HORAS';

export type ContextoSelecionadoAutomatico = {
  contexto: ContextoAutomaticoLembrete;
  janela: JanelaAutomatica;
};

const HORIZONTES: ReadonlyArray<{ janela: JanelaAutomatica; horas: number }> = [
  { janela: 'VINTE_E_QUATRO_HORAS', horas: 24 },
  { janela: 'QUARENTA_E_OITO_HORAS', horas: 48 },
];

function minutosDoHorario(valor: string): number {
  const partes = /^(\d{2}):(\d{2})$/.exec(valor);
  if (!partes) throw new Error('Horário operacional inválido');
  const hora = Number(partes[1]);
  const minuto = Number(partes[2]);
  if (hora > 23 || minuto > 59) throw new Error('Horário operacional inválido');
  return hora * 60 + minuto;
}

function minutosLocais(instante: Date, fusoHorario: string): number {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fusoHorario,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(instante);
  const hora = Number(partes.find((parte) => parte.type === 'hour')?.value);
  const minuto = Number(partes.find((parte) => parte.type === 'minute')?.value);
  if (!Number.isInteger(hora) || !Number.isInteger(minuto)) {
    throw new Error('Não foi possível calcular o horário local da clínica');
  }
  return hora * 60 + minuto;
}

function elegivel(contexto: ContextoAutomaticoLembrete): boolean {
  return (
    (contexto.statusAgendamento === ('AGENDADO' satisfies StatusAgendamento) ||
      contexto.statusAgendamento === ('CONFIRMADO' satisfies StatusAgendamento)) &&
    contexto.consentimentoAtivo &&
    contexto.telefone !== null &&
    contexto.canalPreferido !== null
  );
}

function estaNoHorarioOperacional(
  agora: Date,
  fusoHorario: string,
  configuracao: ConfiguracaoAutomacaoLembretes
): boolean {
  const inicio = minutosDoHorario(configuracao.inicioOperacional);
  const fim = minutosDoHorario(configuracao.fimOperacional);
  if (inicio >= fim) throw new Error('Horário operacional deve ter início antes do fim');
  const atual = minutosLocais(agora, fusoHorario);
  return atual >= inicio && atual < fim;
}

export function selecionarContextosAutomaticos(
  contextos: ContextoAutomaticoLembrete[],
  agora: Date,
  configuracao: ConfiguracaoAutomacaoLembretes
): ContextoSelecionadoAutomatico[] {
  const toleranciaMs = configuracao.toleranciaMinutos * 60_000;
  const selecionados = contextos
    .filter(
      (contexto) =>
        configuracao.clinicaId === undefined || contexto.clinicaId === configuracao.clinicaId
    )
    .filter((contexto) => elegivel(contexto))
    .filter((contexto) => estaNoHorarioOperacional(agora, contexto.fusoHorario, configuracao))
    .flatMap((contexto) => {
      const janela = HORIZONTES.map((horizonte) => ({
        janela: horizonte.janela,
        distancia: Math.abs(
          contexto.inicio.getTime() - (agora.getTime() + horizonte.horas * 60 * 60_000)
        ),
      }))
        .filter((item) => item.distancia <= toleranciaMs)
        .sort((a, b) => a.distancia - b.distancia)[0];
      return janela ? [{ contexto, janela: janela.janela }] : [];
    })
    .sort((a, b) => {
      const inicio = a.contexto.inicio.getTime() - b.contexto.inicio.getTime();
      return inicio || a.contexto.agendamentoId.localeCompare(b.contexto.agendamentoId);
    });

  return selecionados.slice(0, configuracao.limiteLote);
}
