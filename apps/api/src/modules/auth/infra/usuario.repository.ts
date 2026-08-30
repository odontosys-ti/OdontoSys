import { hash, verify } from 'argon2';
import { eq, and } from 'drizzle-orm';
import { usuario } from '../../../platform/db/schema';
import { IUsuarioRepository, IHashService, Usuario } from '../domain/usuario';
import { db } from '../../../platform/db';

/**
 * Implementação de repositório de usuários
 */
export class UsuarioRepository implements IUsuarioRepository {
  async obterPorEmail(clinicaId: string, email: string): Promise<Usuario | null> {
    const resultado = await db
      .select()
      .from(usuario)
      .where(and(eq(usuario.clinicaId, clinicaId), eq(usuario.email, email)))
      .limit(1);

    return resultado[0] || null;
  }

  async obterPorId(id: string): Promise<Usuario | null> {
    const resultado = await db
      .select()
      .from(usuario)
      .where(eq(usuario.id, id))
      .limit(1);

    return resultado[0] || null;
  }
}

/**
 * Implementação de serviço de hash argon2
 */
export class HashServiceArgon2 implements IHashService {
  async hash(senha: string): Promise<string> {
    return hash(senha, {
      type: 2,
      memoryCost: 19,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verificar(senha: string, hashArmazenado: string): Promise<boolean> {
    return verify(hashArmazenado, senha);
  }
}
