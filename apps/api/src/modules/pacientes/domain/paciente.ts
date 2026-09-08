import type { CanalMensagem } from '@odontosys/contracts';

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
