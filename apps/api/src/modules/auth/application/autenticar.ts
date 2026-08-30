import { Usuario, IUsuarioRepository, IHashService } from '../domain/usuario';

/**
 * Caso de uso: autenticar usuário
 * Entrada: email, senha, clinicaId (de contexto)
 * Saída: dados do usuário + token (gerado no HTTP)
 */
export class CasoDeUsoAutenticar {
  constructor(
    private repositorio: IUsuarioRepository,
    private hashService: IHashService,
  ) {}

  async executar(email: string, senha: string, clinicaId: string): Promise<Usuario> {
    // 1. Buscar usuário por email e clínica
    const usuario = await this.repositorio.obterPorEmail(clinicaId, email);
    if (!usuario) {
      throw new Error('Usuário ou senha inválidos');
    }

    // 2. Verificar se ativo
    if (!usuario.ativo) {
      throw new Error('Usuário inativo');
    }

    // 3. Verificar senha
    const senhaValida = await this.hashService.verificar(senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new Error('Usuário ou senha inválidos');
    }

    return usuario;
  }
}

/**
 * Caso de uso: obter usuário autenticado
 * Entrada: usuarioId
 * Saída: dados do usuário (sem senha)
 */
export class CasoDeUsoObterUsuarioAutenticado {
  constructor(private repositorio: IUsuarioRepository) {}

  async executar(usuarioId: string): Promise<Usuario> {
    const usuario = await this.repositorio.obterPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }
    return usuario;
  }
}
