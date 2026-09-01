import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cloneElement, isValidElement, useId } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div
      className={`rounded-[1.35rem] border border-black/[0.06] bg-white/95 p-5 shadow-card sm:p-6 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactNode {
  return <div className={`mb-4 flex flex-col gap-1 ${className}`} {...props} />;
}

export function CardTitle({
  className = '',
  ...props
}: HTMLAttributes<HTMLHeadingElement>): ReactNode {
  return (
    <h3 className={`text-lg font-semibold tracking-tight text-ink-900 ${className}`} {...props} />
  );
}

export function CardDescription({
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>): ReactNode {
  return <p className={`text-sm text-ink-600 ${className}`} {...props} />;
}

export function CardContent({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactNode {
  return <div className={className} {...props} />;
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}): ReactNode {
  const variantes: Record<ButtonVariant, string> = {
    primary: 'bg-brand-500 text-white shadow-xs hover:bg-brand-600 focus-visible:ring-brand-500/25',
    secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-200 focus-visible:ring-black/10',
    danger:
      'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500/20',
    ghost:
      'bg-transparent text-ink-600 hover:bg-black/5 hover:text-ink-900 focus-visible:ring-black/10',
    outline:
      'border border-black/10 bg-white text-ink-900 shadow-xs hover:bg-black/[0.025] focus-visible:ring-black/10',
  };
  const tamanhos: Record<ButtonSize, string> = {
    sm: 'min-h-9 rounded-xl px-3 text-xs',
    md: 'min-h-10 rounded-xl px-4 text-sm',
    lg: 'min-h-12 rounded-[0.9rem] px-5 text-base',
  };
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 font-semibold transition duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-45 ${variantes[variant]} ${tamanhos[size]} ${className}`}
      {...props}
    />
  );
}

const campoClasse =
  'min-h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-ink-900 shadow-inner-xs outline-none placeholder:text-ink-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 disabled:bg-ink-50 disabled:text-ink-400';

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return <input className={`${campoClasse} ${className}`} {...props} />;
}

export function Select({
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>): ReactNode {
  return <select className={`${campoClasse} ${className}`} {...props} />;
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>): ReactNode {
  return <textarea className={`${campoClasse} min-h-24 resize-y py-3 ${className}`} {...props} />;
}

export function Field({
  label,
  dica,
  children,
}: {
  label: string;
  dica?: string;
  children: ReactNode;
}): ReactNode {
  const idGerado = useId();
  const dicaId = `${idGerado}-dica`;
  const campo = isValidElement<{ id?: string; 'aria-describedby'?: string }>(children)
    ? children
    : null;
  const campoId = campo?.props.id ?? idGerado;
  const conteudo = campo
    ? cloneElement(campo, {
        id: campoId,
        'aria-describedby': dica
          ? [campo.props['aria-describedby'], dicaId].filter(Boolean).join(' ')
          : campo.props['aria-describedby'],
      })
    : children;
  return (
    <div className="grid gap-1.5 text-xs font-semibold text-ink-700">
      <label htmlFor={campoId}>{label}</label>
      {conteudo}
      {dica ? (
        <span id={dicaId} className="font-normal text-ink-400">
          {dica}
        </span>
      ) : null}
    </div>
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
    neutral: 'border-zinc-200/70 bg-zinc-100 text-zinc-700',
    success: 'border-emerald-200/70 bg-emerald-50 text-emerald-700',
    danger: 'border-red-200/70 bg-red-50 text-red-700',
    warning: 'border-amber-200/70 bg-amber-50 text-amber-800',
    info: 'border-blue-200/70 bg-blue-50 text-blue-700',
    purple: 'border-purple-200/70 bg-purple-50 text-purple-700',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${variantes[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }): ReactNode {
  const mapa: Record<string, { texto: string; variante: BadgeVariant; ponto?: string }> = {
    AGENDADO: { texto: 'Agendado', variante: 'success', ponto: 'bg-emerald-500' },
    CANCELADO: { texto: 'Cancelado', variante: 'neutral', ponto: 'bg-zinc-400' },
    ADMIN: { texto: 'Administrador', variante: 'purple' },
    DENTISTA: { texto: 'Dentista', variante: 'info' },
    RECEPCAO: { texto: 'Recepção', variante: 'warning' },
  };
  const item = mapa[status] ?? { texto: status, variante: 'neutral' as const };
  return (
    <Badge variant={item.variante}>
      {item.ponto ? <span className={`h-1.5 w-1.5 rounded-full ${item.ponto}`} /> : null}
      {item.texto}
    </Badge>
  );
}
