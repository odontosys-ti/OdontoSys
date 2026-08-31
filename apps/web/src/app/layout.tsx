import { useState, type ReactElement } from 'react';
import { NavLink, Outlet } from 'react-router';

import { useLogout, useSessao } from '../shared/api/hooks';
import { Button, StatusBadge } from '../shared/ui';

const links = [
  {
    to: '/pacientes',
    label: 'Pacientes',
    icone: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    to: '/agendamentos',
    label: 'Agendamentos',
    icone: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    to: '/profissionais',
    label: 'Profissionais',
    admin: true,
    icone: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    to: '/procedimentos',
    label: 'Procedimentos',
    admin: true,
    icone: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  },
];

export function Layout(): ReactElement {
  const sessao = useSessao();
  const logout = useLogout();
  const [menuAberto, setMenuAberto] = useState(false);
  const admin = sessao.data?.papel === 'ADMIN';
  const linksFiltrados = links.filter((link) => !link.admin || admin);

  const inicialNome = sessao.data?.nome ? sessao.data.nome.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7]">
      {/* Header Sticky Glassmorphism */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-ink-900">OdontoSys</span>
            </div>
          </div>

          {/* Desktop Navigation Segmented Pills */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-black/[0.04] p-1 border border-black/5">
            {linksFiltrados.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-ink-900 shadow-xs'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-white/50'
                  }`
                }
              >
                {link.icone}
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {sessao.data ? (
              <div className="hidden sm:flex items-center gap-2.5 rounded-full border border-black/5 bg-black/[0.02] pl-2 pr-3 py-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold">
                  {inicialNome}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-ink-900 leading-tight">
                    {sessao.data.nome}
                  </span>
                </div>
                <StatusBadge status={sessao.data.papel} />
              </div>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => logout.mutate()}
              className="hidden sm:inline-flex"
            >
              Sair
            </Button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl text-ink-600 hover:bg-black/5 cursor-pointer"
              aria-label="Abrir menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={menuAberto ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuAberto ? (
          <div className="md:hidden border-t border-black/5 bg-white px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {sessao.data ? (
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold">
                    {inicialNome}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-900">{sessao.data.nome}</p>
                    <p className="text-[10px] text-ink-600">{sessao.data.email}</p>
                  </div>
                </div>
                <StatusBadge status={sessao.data.papel} />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-1 pt-1">
              {linksFiltrados.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuAberto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium transition-all ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-black/5'
                    }`
                  }
                >
                  {link.icone}
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="pt-2">
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => logout.mutate()}
                className="w-full"
              >
                Sair da conta
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden sticky bottom-0 z-30 flex items-center justify-around border-t border-black/5 bg-white/90 backdrop-blur-xl px-2 py-2">
        {linksFiltrados.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-brand-500' : 'text-ink-400 hover:text-ink-700'
              }`
            }
          >
            {link.icone}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
