import type { CanalMensagem } from '@odontosys/contracts';

import { AppError } from '../../../platform/erros';

export type Paciente = {
  id: string;
  clinicaId: string;
  nome: string;
  documento: string;
  nascimento: Date;
  observacoes: string;
  telefone: string | null;
  canalPreferido: CanalMensagem | null;
  consentimentoAtivo: boolean;
  consentimentoConcedidoEm: Date | null;
  consentimentoRevogadoEm: Date | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type PacienteNovo = {
  clinicaId: string;
  nome: string;
  documento: string;
  nascimento: Date;
  observacoes: string;
  telefone?: string;
  canalPreferido?: CanalMensagem;
  consentimentoAtivo?: boolean;
};

export type PacienteAtualizacao = Partial<Omit<PacienteNovo, 'clinicaId'>>;

export function validarContatoEfetivo(
  existente: Pick<Paciente, 'telefone' | 'canalPreferido' | 'consentimentoAtivo'>,
  dados: PacienteAtualizacao
): void {
  const telefone = dados.telefone ?? existente.telefone;
  const canalPreferido = dados.canalPreferido ?? existente.canalPreferido;
  const consentimentoAtivo = dados.consentimentoAtivo ?? existente.consentimentoAtivo;

  if (!consentimentoAtivo) return;

  const detalhes: Array<{ campo: string; mensagem: string }> = [];

  if (!telefone) {
    detalhes.push({
      campo: 'telefone',
      mensagem: 'Telefone é obrigatório quando o consentimento está ativo',
    });
  }
  if (!canalPreferido) {
    detalhes.push({
      campo: 'canalPreferido',
      mensagem: 'Canal preferido é obrigatório quando o consentimento está ativo',
    });
  }

  if (detalhes.length > 0) {
    throw new AppError('VALIDACAO_INVALIDA', detalhes);
  }
}

export function atualizarDatasConsentimento(
  existente: Pick<Paciente, 'consentimentoAtivo' | 'consentimentoConcedidoEm'>,
  dados: PacienteAtualizacao,
  agora: Date
): { consentimentoConcedidoEm?: Date; consentimentoRevogadoEm?: Date | null } {
  if (dados.consentimentoAtivo === true && !existente.consentimentoAtivo) {
    return { consentimentoConcedidoEm: agora, consentimentoRevogadoEm: null };
  }
  if (dados.consentimentoAtivo === false && existente.consentimentoAtivo) {
    return { consentimentoRevogadoEm: agora };
  }
  return {};
}

export type ListaPaginada<T> = {
  itens: T[];
  total: number;
};

export interface IPacienteRepository {
  listar(
    clinicaId: string,
    pagina: number,
    tamanho: number,
    busca?: string
  ): Promise<ListaPaginada<Paciente>>;
  obterPorId(clinicaId: string, id: string): Promise<Paciente | null>;
  criar(dados: PacienteNovo, usuarioIdAuditoria: string): Promise<Paciente>;
  atualizar(
    clinicaId: string,
    id: string,
    dados: PacienteAtualizacao,
    usuarioIdAuditoria: string
  ): Promise<Paciente | null>;
}
