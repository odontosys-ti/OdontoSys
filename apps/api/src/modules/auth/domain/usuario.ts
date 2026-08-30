/**
 * Entidade Usuario — domínio de autenticação
 * Sem dependência de Fastify ou banco
 */
export interface Usuario {
  id: string;
  clinicaId: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: 'RECEPCAO' | 'DENTISTA' | 'ADMIN';
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Porta para repositório de usuários
 */
export interface IUsuarioRepository {
  obterPorEmail(clinicaId: string, email: string): Promise<Usuario | null>;
  obterPorId(id: string): Promise<Usuario | null>;
}

/**
 * Porta para serviço de hash de senha
 */
export interface IHashService {
  hash(senha: string): Promise<string>;
  verificar(senha: string, hash: string): Promise<boolean>;
}
