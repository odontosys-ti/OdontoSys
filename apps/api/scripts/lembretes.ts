import { fecharDb } from '../src/platform/db';
import { aplicarDotEnv, env } from '../src/platform/config';
import { ServicoLembretesAutomaticos } from '../src/modules/lembretes/application/automatico';
import { ServicoConfiguracaoLembretes } from '../src/modules/lembretes/application/configuracao';
import { ConfiguracaoClinicaRepository } from '../src/modules/lembretes/infra/configuracao.repository';
import { LembreteRepository } from '../src/modules/lembretes/infra/lembrete.repository';
import { criarTransporteLembrete } from '../src/modules/lembretes/infra/transportes';

export async function executarPassadaLembretes(agora = new Date()) {
  aplicarDotEnv();
  const configuracao = env();
  const fallback = {
    toleranciaMinutos: configuracao.LEMBRETE_AUTOMATICO_TOLERANCIA_MINUTOS,
    inicioOperacional: configuracao.LEMBRETE_AUTOMATICO_INICIO,
    fimOperacional: configuracao.LEMBRETE_AUTOMATICO_FIM,
    limiteLote: configuracao.LEMBRETE_AUTOMATICO_LIMITE,
  };
  const servico = new ServicoLembretesAutomaticos(
    new LembreteRepository(),
    criarTransporteLembrete(),
    new ServicoConfiguracaoLembretes(new ConfiguracaoClinicaRepository(), fallback)
  );
  return servico.executar(agora);
}

async function main(): Promise<void> {
  try {
    const resumo = await executarPassadaLembretes(
      process.env.LEMBRETE_AGORA ? new Date(process.env.LEMBRETE_AGORA) : new Date()
    );
    console.log(JSON.stringify({ status: 'CONCLUIDO', ...resumo }));
  } catch {
    console.error(JSON.stringify({ status: 'ERRO', codigo: 'WORKER_INDISPONIVEL' }));
    process.exitCode = 1;
  } finally {
    await fecharDb();
  }
}

if (process.argv[1]?.endsWith('/scripts/lembretes.ts')) {
  void main();
}
