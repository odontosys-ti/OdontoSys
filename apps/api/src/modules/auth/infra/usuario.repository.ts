import { argon2id, hash, verify } from 'argon2';
import { eq } from 'drizzle-orm';

import { db } from '../../../platform/db';
import { usuario } from '../../../platform/db/schema';
import type { IHashService, IUsuarioRepository, Usuario } from '../domain/usuario';

function mapear(linha: typeof usuario.$inferSelect): Usuario {
  return {
    id: linha.id,
    clinicaId: linha.clinicaId,
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senhaHash,
    papel: linha.papel,
    ativo: linha.ativo,
  };
}

export class UsuarioRepository implements IUsuarioRepository {
  async obterPorEmail(email: string): Promise<Usuario | null> {
    const linhas = await db().select().from(usuario).where(eq(usuario.email, email)).limit(1);
    const linha = linhas[0];
    return linha ? mapear(linha) : null;
  }

  async obterPorId(id: string): Promise<Usuario | null> {
    const linhas = await db().select().from(usuario).where(eq(usuario.id, id)).limit(1);
    const linha = linhas[0];
    return linha ? mapear(linha) : null;
  }
}

export class HashServiceArgon2 implements IHashService {
  async hash(senha: string): Promise<string> {
    return hash(senha, {
      type: argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verificar(senha: string, hashArmazenado: string): Promise<boolean> {
    try {
      return await verify(hashArmazenado, senha);
    } catch {
      return false;
    }
  }
}
