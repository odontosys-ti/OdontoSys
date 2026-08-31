export type Profissional = {
  id: string;
  clinicaId: string;
  usuarioId: string;
  nome: string;
  cro: string;
  especialidade: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type ProfissionalNovo = {
  clinicaId: string;
  usuarioId: string;
  nome: string;
  cro: string;
  especialidade: string;
};

export type ProfissionalAtualizacao = Partial<Omit<ProfissionalNovo, 'clinicaId'>>;

export type ListaPaginada<T> = {
  itens: T[];
  total: number;
};

export interface IProfissionalRepository {
  listar(
    clinicaId: string,
    pagina: number,
    tamanho: number,
    busca?: string
  ): Promise<ListaPaginada<Profissional>>;
  obterPorId(clinicaId: string, id: string): Promise<Profissional | null>;
  criar(dados: ProfissionalNovo, usuarioIdAuditoria: string): Promise<Profissional>;
  atualizar(
    clinicaId: string,
    id: string,
    dados: ProfissionalAtualizacao,
    usuarioIdAuditoria: string
  ): Promise<Profissional | null>;
}
