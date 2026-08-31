import { AppError } from '../../../platform/erros';
import type { IHashService, IUsuarioRepository, Usuario } from '../domain/usuario';

export class CasoDeUsoAutenticar {
  constructor(
    private readonly repositorio: IUsuarioRepository,
    private readonly hashService: IHashService
  ) {}

  async executar(email: string, senha: string): Promise<Usuario> {
    const usuario = await this.repositorio.obterPorEmail(email);
    if (!usuario || !usuario.ativo) {
      throw new AppError('NAO_AUTENTICADO');
    }

    const senhaValida = await this.hashService.verificar(senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new AppError('NAO_AUTENTICADO');
    }

    return usuario;
  }
}

export class CasoDeUsoObterUsuarioAutenticado {
  constructor(private readonly repositorio: IUsuarioRepository) {}

  async executar(usuarioId: string): Promise<Usuario> {
    const usuario = await this.repositorio.obterPorId(usuarioId);
    if (!usuario || !usuario.ativo) {
      throw new AppError('NAO_ENCONTRADO');
    }
    return usuario;
  }
}
