export const CatalogoErros = {
  VALIDACAO_INVALIDA: { status: 400, mensagem: 'Dados inválidos' },
  NAO_AUTENTICADO: { status: 401, mensagem: 'Não autenticado' },
  SEM_PERMISSAO: { status: 403, mensagem: 'Sem permissão para executar esta ação' },
  NAO_ENCONTRADO: { status: 404, mensagem: 'Recurso não encontrado' },
  CONFLITO_HORARIO: {
    status: 409,
    mensagem: 'O profissional já possui atendimento nesse horário.',
  },
  PACIENTE_BLOQUEADO: {
    status: 422,
    mensagem: 'Paciente bloqueado por faltas recorrentes; informe uma justificativa para liberar.',
  },
  REGRA_NEGOCIO: { status: 422, mensagem: 'Violação de regra de negócio' },
  ERRO_INTERNO: { status: 500, mensagem: 'Erro interno do servidor' },
} as const;

export type CodigoErro = keyof typeof CatalogoErros;

export type DetalheErro = { campo?: string; mensagem: string };

export class AppError extends Error {
  public readonly codigo: CodigoErro;
  public readonly status: number;
  public readonly detalhes: DetalheErro[];

  constructor(codigo: CodigoErro, detalhes: DetalheErro[] = []) {
    const config = CatalogoErros[codigo];
    super(config.mensagem);
    this.codigo = codigo;
    this.status = config.status;
    this.detalhes = detalhes;
  }
}
