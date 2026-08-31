import type { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router';

import { useSessao } from '../shared/api/hooks';
import { Spinner } from '../shared/ui';
import type { Papel } from '@odontosys/contracts';

export function GuardaAutenticado(): ReactElement {
  const sessao = useSessao();
  if (sessao.isLoading) {
    return <Spinner />;
  }
  if (!sessao.data) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function GuardaPapel({ papeis }: { papeis: Papel[] }): ReactElement {
  const sessao = useSessao();
  if (sessao.isLoading) {
    return <Spinner />;
  }
  if (!sessao.data || !papeis.includes(sessao.data.papel)) {
    return <Navigate to="/pacientes" replace />;
  }
  return <Outlet />;
}
