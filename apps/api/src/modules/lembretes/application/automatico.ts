import type { ILembreteAutomaticoRepository, ITeletransporte } from '../domain/lembrete';
import {
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

  constructor(
    private readonly repo: ILembreteAutomaticoRepository,
    transporte: ITeletransporte,
    private readonly configuracao: ConfiguracaoAutomacaoLembretes
  ) {
    this.servico = new ServicoLembretes(repo, transporte);
  }

  async executar(agora: Date): Promise<ResumoAutomacaoLembretes> {
    const toleranciaMs = this.configuracao.toleranciaMinutos * 60_000;
    const contextos = await this.repo.listarContextosAutomaticos(
      new Date(agora.getTime() + 24 * 60 * 60_000 - toleranciaMs),
      new Date(agora.getTime() + 48 * 60 * 60_000 + toleranciaMs)
    );
    const selecionados = selecionarContextosAutomaticos(contextos, agora, this.configuracao);
    const resumo: ResumoAutomacaoLembretes = {
      selecionados: selecionados.length,
      enviados: 0,
      falhas: 0,
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
