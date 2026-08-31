import type { ReactElement } from 'react';
import { NavLink, Outlet } from 'react-router';

import { useLogout, useSessao } from '../shared/api/hooks';
import { Button } from '../shared/ui';

const links = [
  { to: '/pacientes', label: 'Pacientes' },
  { to: '/agendamentos', label: 'Agendamentos' },
  { to: '/profissionais', label: 'Profissionais', admin: true },
  { to: '/procedimentos', label: 'Procedimentos', admin: true },
];

export function Layout(): ReactElement {
  const sessao = useSessao();
  const logout = useLogout();
  const admin = sessao.data?.papel === 'ADMIN';

  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <aside className="border-b border-line bg-white p-4 md:border-b-0 md:border-r">
        <p className="mb-4 text-lg font-semibold text-brand-700">OdontoSys</p>
        <nav className="flex flex-wrap gap-2 md:flex-col">
          {links
            .filter((link) => !link.admin || admin)
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
        </nav>
        <div className="mt-6 text-xs text-ink-600">
          <p>{sessao.data?.nome}</p>
          <p>{sessao.data?.papel}</p>
          <Button className="mt-2" variant="ghost" type="button" onClick={() => logout.mutate()}>
            Sair
          </Button>
        </div>
      </aside>
      <main className="p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
