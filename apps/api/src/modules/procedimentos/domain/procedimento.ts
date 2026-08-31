export type Procedimento = {
  id: string;
  clinicaId: string;
  nome: string;
  duracaoMinutos: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type ProcedimentoNovo = {
  clinicaId: string;
  nome: string;
  duracaoMinutos: number;
};

export type ProcedimentoAtualizacao = Partial<Omit<ProcedimentoNovo, 'clinicaId'>>;

export type ListaPaginada<T> = {
  itens: T[];
  total: number;
};

export interface IProcedimentoRepository {
  listar(
    clinicaId: string,
    pagina: number,
    tamanho: number,
    busca?: string
  ): Promise<ListaPaginada<Procedimento>>;
  obterPorId(clinicaId: string, id: string): Promise<Procedimento | null>;
  criar(dados: ProcedimentoNovo, usuarioIdAuditoria: string): Promise<Procedimento>;
  atualizar(
    clinicaId: string,
    id: string,
    dados: ProcedimentoAtualizacao,
    usuarioIdAuditoria: string
  ): Promise<Procedimento | null>;
}
