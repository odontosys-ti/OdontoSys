import type { ReactNode } from 'react';

export function Table({
  cabecalhos,
  children,
  mobile,
}: {
  cabecalhos: string[];
  children: ReactNode;
  mobile?: ReactNode;
}): ReactNode {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-black/[0.06] bg-white shadow-card">
      {mobile ? <div className="divide-y divide-black/[0.06] md:hidden">{mobile}</div> : null}
      <div className={mobile ? 'hidden overflow-x-auto md:block' : 'overflow-x-auto'}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/[0.06] bg-ink-50/70">
            <tr>
              {cabecalhos.map((item) => (
                <th
                  key={item}
                  scope="col"
                  className="px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-600"
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function MobileCard({
  titulo,
  meta,
  children,
}: {
  titulo: string;
  meta?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <article className="grid gap-3 p-4">
      <div>
        <h3 className="font-semibold text-ink-900">{titulo}</h3>
        {meta ? <p className="mt-0.5 text-xs text-ink-500">{meta}</p> : null}
      </div>
      {children}
    </article>
  );
}
