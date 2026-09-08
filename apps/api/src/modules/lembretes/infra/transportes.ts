import { env } from '../../../platform/config';
import type { EntradaTransporte, ITeletransporte, ResultadoTransporte } from '../domain/lembrete';

function resultadoFalha(codigoFalha: string, mensagemFalha: string): ResultadoTransporte {
  return {
    status: 'FALHOU',
    providerId: null,
    codigoFalha,
    mensagemFalha,
  };
}

function idSimulacao(idempotenciaKey: string): string {
  return `simulacao-${idempotenciaKey.replaceAll(':', '-')}`;
}

export class SimuladorTransporte implements ITeletransporte {
  readonly nome = 'simulacao';

  private readonly sucessos = new Map<string, ResultadoTransporte>();

  constructor(private readonly falhar = false) {}

  async enviar(entrada: EntradaTransporte): Promise<ResultadoTransporte> {
    if (this.falhar) {
      return resultadoFalha('SIMULADOR_FALHA', 'Falha simulada no transporte.');
    }
    const anterior = this.sucessos.get(entrada.idempotenciaKey);
    if (anterior) return anterior;
    const resultado = {
      status: 'ENVIADO',
      providerId: idSimulacao(entrada.idempotenciaKey),
      codigoFalha: null,
      mensagemFalha: null,
    } satisfies ResultadoTransporte;
    this.sucessos.set(entrada.idempotenciaKey, resultado);
    return resultado;
  }
}

class TransporteRealPlaceholder implements ITeletransporte {
  constructor(
    readonly nome: 'whatsapp' | 'sms',
    private readonly configurado: boolean
  ) {}

  async enviar(_entrada: EntradaTransporte): Promise<ResultadoTransporte> {
    if (!this.configurado) {
      return resultadoFalha(
        'TRANSPORTE_NAO_CONFIGURADO',
        'Transporte real sem credenciais configuradas.'
      );
    }
    return resultadoFalha(
      'TRANSPORTE_INDISPONIVEL',
      'Adaptador real ainda não está disponível neste ambiente.'
    );
  }
}

export function criarTransporteLembrete(): ITeletransporte {
  const configuracao = env();
  const transporte =
    configuracao.LEMBRETE_TRANSPORTE ??
    (configuracao.NODE_ENV === 'production' ? 'whatsapp' : 'simulacao');

  if (transporte === 'simulacao') return new SimuladorTransporte();
  if (transporte === 'whatsapp') {
    return new TransporteRealPlaceholder(
      'whatsapp',
      configuracao.WHATSAPP_API_URL !== undefined && configuracao.WHATSAPP_API_TOKEN !== undefined
    );
  }
  return new TransporteRealPlaceholder(
    'sms',
    configuracao.SMS_API_URL !== undefined && configuracao.SMS_API_TOKEN !== undefined
  );
}
