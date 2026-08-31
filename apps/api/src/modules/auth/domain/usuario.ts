export interface Usuario {
  id: string;
  clinicaId: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: 'RECEPCAO' | 'DENTISTA' | 'ADMIN';
  ativo: boolean;
}

export interface IUsuarioRepository {
  obterPorEmail(email: string): Promise<Usuario | null>;
  obterPorId(id: string): Promise<Usuario | null>;
}

export interface IHashService {
  hash(senha: string): Promise<string>;
  verificar(senha: string, hashArmazenado: string): Promise<boolean>;
}
