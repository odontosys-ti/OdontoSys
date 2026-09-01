import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export function Spinner({ texto = 'Carregando…' }: { texto?: string }): ReactNode {
  return (
    <div
      role="status"
      className="grid min-h-52 place-items-center text-center text-sm font-medium text-ink-600"
    >
      <div className="grid justify-items-center gap-3">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500" />
        {texto}
      </div>
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
    <div className="grid min-h-56 place-items-center rounded-[1.35rem] border border-dashed border-black/10 bg-white/65 p-8 text-center">
      <div className="max-w-sm">
        <span
          aria-hidden="true"
          className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-xl text-brand-700"
        >
          ＋
        </span>
        <p className="font-semibold text-ink-900">{mensagem}</p>
        {subtitulo ? <p className="mt-1.5 text-sm text-ink-600">{subtitulo}</p> : null}
        {acao ? <div className="mt-4">{acao}</div> : null}
      </div>
    </div>
  );
}

export function ErrorState({
  mensagem,
  detalhe,
  onRetry,
}: {
  mensagem: string;
  detalhe?: string;
  onRetry?: () => void;
}): ReactNode {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 rounded-2xl border border-red-200/80 bg-red-50/80 p-4 text-sm text-red-900"
    >
      <div>
        <p className="font-semibold">{mensagem}</p>
        {detalhe ? <p className="mt-1 text-xs text-red-700">{detalhe}</p> : null}
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="font-semibold underline underline-offset-2"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function Toast({ mensagem }: { mensagem: string }): ReactNode {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[70] rounded-full bg-ink-900/95 px-4 py-2.5 text-sm font-medium text-white shadow-modal"
    >
      {mensagem}
    </div>
  );
}

type ToastContexto = { mostrar: (mensagem: string) => void };
const ToastContext = createContext<ToastContexto | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [mensagem, setMensagem] = useState('');
  const temporizador = useRef<number | undefined>(undefined);
  const mostrar = useCallback((novoTexto: string) => {
    if (temporizador.current !== undefined) window.clearTimeout(temporizador.current);
    setMensagem(novoTexto);
    temporizador.current = window.setTimeout(() => setMensagem(''), 3_000);
  }, []);
  useEffect(
    () => () => {
      if (temporizador.current !== undefined) window.clearTimeout(temporizador.current);
    },
    []
  );
  const valor = useMemo(() => ({ mostrar }), [mostrar]);
  return (
    <ToastContext.Provider value={valor}>
      {children}
      {mensagem ? <Toast mensagem={mensagem} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContexto {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast precisa estar dentro de ToastProvider');
  return contexto;
}
