export type Paciente = {
  id: string;
  clinicaId: string;
  nome: string;
  documento: string;
  nascimento: Date;
  observacoes: string;
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
};

export type PacienteAtualizacao = Partial<Omit<PacienteNovo, 'clinicaId'>>;

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
  criar(dados: PacienteNovo): Promise<Paciente>;
  atualizar(clinicaId: string, id: string, dados: PacienteAtualizacao): Promise<Paciente | null>;
}
