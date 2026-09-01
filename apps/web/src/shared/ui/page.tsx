import type { ReactNode } from 'react';

export function PageHeader({
  titulo,
  subtitulo,
  contexto,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  contexto?: string;
  acao?: ReactNode;
}): ReactNode {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-brand-100/80 bg-gradient-to-br from-white via-white to-brand-50/80 p-5 shadow-card sm:p-7">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-brand-500 to-clinical-500"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {contexto ? (
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-brand-700">
              {contexto}
            </p>
          ) : null}
          <h1 className="text-2xl font-bold tracking-[-0.035em] text-ink-900 sm:text-3xl">
            {titulo}
          </h1>
          {subtitulo ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">{subtitulo}</p>
          ) : null}
        </div>
        {acao ? <div className="flex shrink-0 flex-wrap gap-2">{acao}</div> : null}
      </div>
    </div>
  );
}
