/**
 * Catálogo de erros da aplicação
 * Mapeia códigos de erro para status HTTP e mensagens
 */

export const ErrorCatalog = {
  VALIDACAO_INVALIDA: {
    status: 400,
    message: 'Dados inválidos',
  },
  NAO_AUTENTICADO: {
    status: 401,
    message: 'Não autenticado',
  },
  SEM_PERMISSAO: {
    status: 403,
    message: 'Sem permissão para executar esta ação',
  },
  NAO_ENCONTRADO: {
    status: 404,
    message: 'Recurso não encontrado',
  },
  CONFLITO_HORARIO: {
    status: 409,
    message: 'O profissional já possui atendimento nesse horário',
  },
  REGRA_NEGOCIO: {
    status: 422,
    message: 'Violação de regra de negócio',
  },
  ERRO_INTERNO: {
    status: 500,
    message: 'Erro interno do servidor',
  },
} as const;

export type ErrorCode = keyof typeof ErrorCatalog;

/**
 * AppError — erro padrão da aplicação
 */
export class AppError extends Error {
  public readonly codigo: ErrorCode;
  public readonly status: number;
  public readonly detalhes: unknown;

  constructor(codigo: ErrorCode, detalhes?: unknown) {
    const config = ErrorCatalog[codigo];
    super(config.message);
    this.codigo = codigo;
    this.status = config.status;
    this.detalhes = detalhes;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Erros de domínio específicos
 */
export class ErroAgendamentoConflito extends AppError {
  constructor() {
    super('CONFLITO_HORARIO');
  }
}

export class ErroUsuarioNaoEncontrado extends AppError {
  constructor() {
    super('NAO_ENCONTRADO', { entidade: 'usuario' });
  }
}

export class ErroPacienteNaoEncontrado extends AppError {
  constructor() {
    super('NAO_ENCONTRADO', { entidade: 'paciente' });
  }
}

export class ErroProfissionalNaoEncontrado extends AppError {
  constructor() {
    super('NAO_ENCONTRADO', { entidade: 'profissional' });
  }
}

export class ErroProcedimentoNaoEncontrado extends AppError {
  constructor() {
    super('NAO_ENCONTRADO', { entidade: 'procedimento' });
  }
}
