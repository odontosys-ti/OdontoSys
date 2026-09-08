import { ServicoLembretes } from '../application/servico';
import { LembreteRepository } from '../infra/lembrete.repository';
import { criarTransporteLembrete } from '../infra/transportes';

export function criarServicoLembretesHttp(): ServicoLembretes {
  return new ServicoLembretes(new LembreteRepository(), criarTransporteLembrete());
}
