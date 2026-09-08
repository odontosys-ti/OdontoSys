import type { ILembreteAutomaticoRepository, ITeletransporte } from '../domain/lembrete';
import {
  type IConfiguracaoAutomacaoLembretes,
  selecionarContextosAutomaticos,
  type ConfiguracaoAutomacaoLembretes,
} from '../domain/automatico';
import { ServicoLembretes } from './servico';

export type ResumoAutomacaoLembretes = {
  selecionados: number;
  enviados: number;
  falhas: number;
  duplicados: number;
};

export class ServicoLembretesAutomaticos {
  private readonly servico: ServicoLembretes;
  private readonly fonteConfiguracao: IConfiguracaoAutomacaoLembretes;

  constructor(
    private readonly repo: ILembreteAutomaticoRepository,
    transporte: ITeletransporte,
    configuracao: ConfiguracaoAutomacaoLembretes | IConfiguracaoAutomacaoLembretes
  ) {
    this.servico = new ServicoLembretes(repo, transporte);
    this.fonteConfiguracao =
      typeof (configuracao as IConfiguracaoAutomacaoLembretes).obterParaClinica === 'function'
        ? (configuracao as IConfiguracaoAutomacaoLembretes)
        : { obterParaClinica: async () => configuracao as ConfiguracaoAutomacaoLembretes };
  }

  async executar(agora: Date): Promise<ResumoAutomacaoLembretes> {
    const toleranciaMs = 60 * 60_000;
    const contextos = await this.repo.listarContextosAutomaticos(
      new Date(agora.getTime() + 24 * 60 * 60_000 - toleranciaMs),
      new Date(agora.getTime() + 48 * 60 * 60_000 + toleranciaMs)
    );
    const porClinica = new Map<string, typeof contextos>();
    for (const contexto of contextos) {
      const agrupamento = porClinica.get(contexto.clinicaId) ?? [];
      agrupamento.push(contexto);
      porClinica.set(contexto.clinicaId, agrupamento);
    }
    let falhasDeConfiguracao = 0;
    const selecionados = (
      await Promise.all(
        [...porClinica.entries()].map(async ([clinicaId, itens]) => {
          try {
            return selecionarContextosAutomaticos(
              itens,
              agora,
              await this.fonteConfiguracao.obterParaClinica(clinicaId)
            );
          } catch {
            falhasDeConfiguracao += 1;
            return [];
          }
        })
      )
    ).flat();
    const resumo: ResumoAutomacaoLembretes = {
      selecionados: selecionados.length,
      enviados: 0,
      falhas: falhasDeConfiguracao,
      duplicados: 0,
    };

    for (const selecionado of selecionados) {
      try {
        const resultado = await this.servico.enviarAutomatico(
          selecionado.contexto,
          selecionado.janela
        );
        if (resultado.tipo === 'DUPLICADO') {
          resumo.duplicados += 1;
        } else if (resultado.tipo === 'FALHOU') {
          resumo.falhas += 1;
        } else {
          resumo.enviados += 1;
        }
      } catch {
        resumo.falhas += 1;
      }
    }
    return resumo;
  }
}
