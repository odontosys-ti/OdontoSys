import {
  type ConfiguracaoAutomacaoLembretes,
  type IConfiguracaoAutomacaoLembretes,
} from '../domain/automatico';
import {
  CHAVE_CONFIGURACAO_LEMBRETES,
  type IConfiguracaoClinicaRepository,
  validarConfiguracaoAutomacao,
} from '../domain/configuracao';

export class ServicoConfiguracaoLembretes implements IConfiguracaoAutomacaoLembretes {
  constructor(
    private readonly repositorio: IConfiguracaoClinicaRepository,
    private readonly fallback: ConfiguracaoAutomacaoLembretes
  ) {
    validarConfiguracaoAutomacao(fallback);
  }

  async obterParaClinica(clinicaId: string): Promise<ConfiguracaoAutomacaoLembretes> {
    const valor = await this.repositorio.obter(clinicaId);
    if (valor === null) return this.fallback;
    return validarConfiguracaoAutomacao(valor);
  }
}

export { CHAVE_CONFIGURACAO_LEMBRETES };
