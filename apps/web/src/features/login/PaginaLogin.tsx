import { useState, type ReactElement } from 'react';
import { Navigate, useNavigate } from 'react-router';

import { useLogin, useSessao } from '../../shared/api/hooks';
import { Button, Card, ErrorState, Input } from '../../shared/ui';

export function PaginaLogin(): ReactElement {
  const sessao = useSessao();
  const login = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('recepcao@odontosys.local');
  const [senha, setSenha] = useState('senha123');

  if (sessao.data) {
    return <Navigate to="/pacientes" replace />;
  }

  const perfisDemo = [
    { label: 'Recepção', email: 'recepcao@odontosys.local', senha: 'senha123' },
    { label: 'Dentista', email: 'dentista@odontosys.local', senha: 'senha123' },
    { label: 'Admin', email: 'admin@odontosys.local', senha: 'senha123' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#F5F5F7] via-[#ECECEF] to-[#E5E5EA]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-card">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">OdontoSys</h1>
          <p className="text-sm text-ink-600">Sistema Integrado de Gestão Odontológica</p>
        </div>

        {/* Login Form Card */}
        <Card className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink-900">Entrar na plataforma</h2>
            <p className="text-xs text-ink-600 mt-0.5">
              Insira suas credenciais para acessar sua clínica
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(evento) => {
              evento.preventDefault();
              login.mutate(
                { email, senha },
                {
                  onSuccess: () => navigate('/pacientes'),
                }
              );
            }}
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-700">
                E-mail profissional
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="seu.email@odontosys.local"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-700">Senha de acesso</label>
              <Input
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            {login.isError ? (
              <ErrorState mensagem="E-mail ou senha incorretos. Verifique suas credenciais." />
            ) : null}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={login.isPending}>
              {login.isPending ? 'Autenticando…' : 'Entrar'}
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-3 border-t border-black/5">
            <p className="text-[11px] font-medium text-ink-400 mb-2 uppercase tracking-wider text-center">
              Acesso rápido para testes
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {perfisDemo.map((perfil) => (
                <button
                  key={perfil.label}
                  type="button"
                  onClick={() => {
                    setEmail(perfil.email);
                    setSenha(perfil.senha);
                  }}
                  className="rounded-lg border border-black/5 bg-black/[0.02] py-1.5 px-2 text-xs font-medium text-ink-700 hover:bg-black/[0.05] hover:text-ink-900 transition-colors cursor-pointer"
                >
                  {perfil.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
