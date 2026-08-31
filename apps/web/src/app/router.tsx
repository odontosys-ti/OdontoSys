import { createBrowserRouter, Navigate } from 'react-router';

import { PaginaAgendamentos } from '../features/agendamentos/PaginaAgendamentos';
import { PaginaLogin } from '../features/login/PaginaLogin';
import { PaginaPacienteFormulario, PaginaPacientes } from '../features/pacientes/PaginasPacientes';
import { PaginaProcedimentos } from '../features/procedimentos/PaginaProcedimentos';
import { PaginaProfissionais } from '../features/profissionais/PaginaProfissionais';
import { GuardaAutenticado, GuardaPapel } from './guards';
import { Layout } from './layout';

export function criarRouter() {
  return createBrowserRouter([
    { path: '/login', element: <PaginaLogin /> },
    {
      element: <GuardaAutenticado />,
      children: [
        {
          element: <Layout />,
          children: [
            { path: '/', element: <Navigate to="/pacientes" replace /> },
            { path: '/pacientes', element: <PaginaPacientes /> },
            { path: '/pacientes/novo', element: <PaginaPacienteFormulario /> },
            { path: '/pacientes/:id', element: <PaginaPacienteFormulario /> },
            { path: '/agendamentos', element: <PaginaAgendamentos /> },
            {
              element: <GuardaPapel papeis={['ADMIN']} />,
              children: [
                { path: '/profissionais', element: <PaginaProfissionais /> },
                { path: '/procedimentos', element: <PaginaProcedimentos /> },
              ],
            },
          ],
        },
      ],
    },
  ]);
}
