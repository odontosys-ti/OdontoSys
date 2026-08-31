import { useState, type ReactElement } from 'react';
import { Navigate, useNavigate } from 'react-router';

import { useLogin, useSessao } from '../../shared/api/hooks';
import { Button, ErrorState, Input } from '../../shared/ui';

export function PaginaLogin(): ReactElement {
  const sessao = useSessao();
  const login = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('recepcao@odontosys.local');
  const [senha, setSenha] = useState('senha123');

  if (sessao.data) {
    return <Navigate to="/pacientes" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-md border border-line bg-white p-6"
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
        <h1 className="text-xl font-semibold">Entrar</h1>
        <label className="block text-sm">
          E-mail
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="block text-sm">
          Senha
          <Input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type="password"
            required
          />
        </label>
        {login.isError ? <ErrorState mensagem="Não foi possível autenticar." /> : null}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}
