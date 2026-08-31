import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

export function Card({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div
      className={`rounded-2xl border border-black/5 bg-white p-5 shadow-card sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div className={`mb-4 flex flex-col gap-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>): ReactNode {
  return (
    <h3 className={`text-lg font-semibold tracking-tight text-ink-900 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>): ReactNode {
  return (
    <p className={`text-sm text-ink-600 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}): ReactNode {
  const variantes: Record<ButtonVariant, string> = {
    primary:
      'bg-brand-500 text-white shadow-xs hover:bg-brand-600 active:scale-[0.98] focus-visible:ring-brand-500/20',
    secondary:
      'bg-ink-100 text-ink-900 hover:bg-ink-200 active:scale-[0.98] focus-visible:ring-black/10',
    danger:
      'bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 active:scale-[0.98] focus-visible:ring-red-500/20',
    ghost:
      'bg-transparent text-ink-600 hover:bg-black/5 hover:text-ink-900 active:scale-[0.98] focus-visible:ring-black/10',
    outline:
      'bg-white text-ink-900 border border-black/10 shadow-xs hover:bg-black/[0.02] active:scale-[0.98] focus-visible:ring-black/10',
  };

  const tamanhos: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-9.5 px-4 text-sm rounded-xl',
    lg: 'h-11 px-5 text-base rounded-xl',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-40 cursor-pointer ${variantes[variant]} ${tamanhos[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return (
    <input
      className={`h-9.5 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:bg-ink-50 disabled:text-ink-400 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>): ReactNode {
  return (
    <select
      className={`h-9.5 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-ink-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:bg-ink-50 disabled:text-ink-400 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export type BadgeVariant = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'purple';

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}): ReactNode {
  const variantes: Record<BadgeVariant, string> = {
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    danger: 'bg-red-50 text-red-700 border-red-200/60',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/60',
    info: 'bg-blue-50 text-blue-700 border-blue-200/60',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight ${variantes[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }): ReactNode {
  if (status === 'AGENDADO') {
    return (
      <Badge variant="success">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Agendado
      </Badge>
    );
  }
  if (status === 'CANCELADO') {
    return (
      <Badge variant="neutral">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
        Cancelado
      </Badge>
    );
  }
  if (status === 'ADMIN') {
    return <Badge variant="purple">Administrador</Badge>;
  }
  if (status === 'DENTISTA') {
    return <Badge variant="info">Dentista</Badge>;
  }
  if (status === 'RECEPCAO') {
    return <Badge variant="warning">Recepção</Badge>;
  }
  return <Badge variant="neutral">{status}</Badge>;
}

export function Spinner(): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <svg
        className="h-6 w-6 animate-spin text-brand-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p className="text-xs font-medium text-ink-600 tracking-tight">Carregando…</p>
    </div>
  );
}

export function EmptyState({
  mensagem,
  subtitulo,
  acao,
}: {
  mensagem: string;
  subtitulo?: string;
  acao?: ReactNode;
}): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white/60 p-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-ink-900">{mensagem}</p>
      {subtitulo ? <p className="mt-1 text-xs text-ink-600 max-w-xs">{subtitulo}</p> : null}
      {acao ? <div className="mt-4">{acao}</div> : null}
    </div>
  );
}

export function ErrorState({
  mensagem,
  detalhe,
}: {
  mensagem: string;
  detalhe?: string;
}): ReactNode {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/70 p-4 text-sm text-red-900"
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 mt-0.5">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-red-900">{mensagem}</p>
        {detalhe ? <p className="mt-0.5 text-xs text-red-700">{detalhe}</p> : null}
      </div>
    </div>
  );
}

export function Toast({ mensagem }: { mensagem: string }): ReactNode {
  return (
    <div className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-ink-900/90 px-4 py-2 text-xs font-medium text-white shadow-modal backdrop-blur-md">
      <span className="h-2 w-2 rounded-full bg-brand-500" />
      {mensagem}
    </div>
  );
}

export function Table({
  cabecalhos,
  children,
}: {
  cabecalhos: string[];
  children: ReactNode;
}): ReactNode {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-black/[0.015]">
            <tr>
              {cabecalhos.map((item) => (
                <th
                  key={item}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-600"
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Modal({
  titulo,
  descricao,
  aberto,
  onClose,
  children,
}: {
  titulo: string;
  descricao?: string;
  aberto: boolean;
  onClose: () => void;
  children: ReactNode;
}): ReactNode {
  if (!aberto) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-black/5 bg-white p-6 shadow-modal transition-all">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink-900">{titulo}</h2>
            {descricao ? <p className="mt-0.5 text-xs text-ink-600">{descricao}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 hover:bg-black/5 hover:text-ink-700 transition-colors cursor-pointer"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
}): ReactNode {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{titulo}</h1>
        {subtitulo ? <p className="mt-1 text-sm text-ink-600">{subtitulo}</p> : null}
      </div>
      {acao ? <div className="flex items-center gap-2">{acao}</div> : null}
    </div>
  );
}
