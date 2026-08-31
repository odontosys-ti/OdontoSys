import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

export function Button({
  children,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
}): ReactNode {
  const estilos = {
    primary: 'bg-brand-500 text-white hover:bg-brand-700',
    ghost: 'bg-white text-ink-900 border border-line hover:bg-brand-50',
    danger: 'bg-red-700 text-white hover:bg-red-800',
  };
  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 ${estilos[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return (
    <input className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm" {...props} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>): ReactNode {
  return (
    <select
      className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
      {...props}
    />
  );
}

export function Spinner(): ReactNode {
  return <p className="text-sm text-ink-600">Carregando…</p>;
}

export function EmptyState({ mensagem }: { mensagem: string }): ReactNode {
  return (
    <p className="rounded-md border border-dashed border-line p-6 text-sm text-ink-600">
      {mensagem}
    </p>
  );
}

export function ErrorState({ mensagem }: { mensagem: string }): ReactNode {
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {mensagem}
    </p>
  );
}

export function Toast({ mensagem }: { mensagem: string }): ReactNode {
  return (
    <div className="fixed bottom-4 right-4 rounded-md bg-ink-900 px-4 py-2 text-sm text-white">
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
    <div className="overflow-x-auto rounded-md border border-line bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-50">
          <tr>
            {cabecalhos.map((item) => (
              <th key={item} className="px-3 py-2 font-medium">
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Modal({
  titulo,
  aberto,
  onClose,
  children,
}: {
  titulo: string;
  aberto: boolean;
  onClose: () => void;
  children: ReactNode;
}): ReactNode {
  if (!aberto) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-md bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <Button variant="ghost" type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
