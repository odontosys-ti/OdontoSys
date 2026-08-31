export type Procedimento = {
  id: string;
  clinicaId: string;
  nome: string;
  duracaoMinutos: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};
