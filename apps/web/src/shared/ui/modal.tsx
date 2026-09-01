import { useEffect, useId, useRef, type ReactNode } from 'react';

const seletorFoco =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

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
  const tituloId = useId();
  const descricaoId = useId();
  const dialogoRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!aberto) return;
    const focoAnterior =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialogo = dialogoRef.current;
    const primeiro =
      dialogo?.querySelector<HTMLElement>('[data-autofocus]') ??
      dialogo?.querySelector<HTMLElement>(seletorFoco);
    primeiro?.focus();
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onCloseRef.current();
        return;
      }
      if (evento.key !== 'Tab' || !dialogo) return;
      const focaveis = Array.from(dialogo.querySelectorAll<HTMLElement>(seletorFoco));
      const primeiroFoco = focaveis[0];
      const ultimoFoco = focaveis.at(-1);
      if (evento.shiftKey && document.activeElement === primeiroFoco) {
        evento.preventDefault();
        ultimoFoco?.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimoFoco) {
        evento.preventDefault();
        primeiroFoco?.focus();
      }
    };
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('keydown', tecla);
      focoAnterior?.focus();
    };
  }, [aberto]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="fixed inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricao ? descricaoId : undefined}
        className="relative z-10 w-full max-w-lg rounded-[1.5rem] border border-white/50 bg-white p-5 shadow-modal sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={tituloId} className="text-xl font-semibold tracking-tight text-ink-900">
              {titulo}
            </h2>
            {descricao ? (
              <p id={descricaoId} className="mt-1 text-sm text-ink-600">
                {descricao}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-ink-400 hover:bg-black/5 hover:text-ink-700"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
