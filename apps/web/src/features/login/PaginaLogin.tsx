import { useState, type ReactElement } from 'react';
import { Navigate, useNavigate } from 'react-router';

import { useLogin, useSessao } from '../../shared/api/hooks';
import { Button, Card, ErrorState, Field, Input } from '../../shared/ui';

export function PaginaLogin(): ReactElement {
  const sessao = useSessao();
  const login = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  if (sessao.data) return <Navigate to="/pacientes" replace />;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-surface-bg p-4">
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-brand-100/65 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-clinical-100/70 blur-3xl"
      />
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-modal backdrop-blur-xl md:grid-cols-[0.85fr_1.15fr]">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/20">
              ◡
            </span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
              OdontoSys
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
              Gestão clínica com clareza.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Uma base segura e direta para cadastros e agendamentos odontológicos.
            </p>
          </div>
          <p className="text-xs text-white/60">Ambiente interno da clínica</p>
        </aside>

        <Card className="rounded-none border-0 bg-transparent p-6 shadow-none sm:p-10">
          <div className="mb-7 md:hidden">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
              OdontoSys
            </p>
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-[-0.035em] text-ink-900">
              Entrar na plataforma
            </h2>
            <p className="mt-1.5 text-sm text-ink-600">
              Use as credenciais fornecidas pela administração da clínica.
            </p>
          </div>
          <form
            className="space-y-4"
            onSubmit={(evento) => {
              evento.preventDefault();
              login.mutate(
                { email, senha },
                { onSuccess: () => navigate('/pacientes', { replace: true }) }
              );
            }}
          >
            <Field label="E-mail profissional">
              <Input
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                type="email"
                autoComplete="username"
                placeholder="nome@clinica.com"
                required
                data-autofocus
              />
            </Field>
            <Field label="Senha">
              <Input
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                minLength={6}
                required
              />
            </Field>
            {login.isError ? (
              <ErrorState
                mensagem="Não foi possível entrar."
                detalhe="Confira o e-mail e a senha informados."
              />
            ) : null}
            <Button type="submit" size="lg" className="mt-2 w-full" disabled={login.isPending}>
              {login.isPending ? 'Autenticando…' : 'Entrar'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
