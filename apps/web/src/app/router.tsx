import { createBrowserRouter, Navigate } from 'react-router';

import { GuardaAutenticado, GuardaPapel } from './guards';
import { Layout } from './layout';

export function criarRouter() {
  return createBrowserRouter([
    {
      path: '/login',
      lazy: async () => {
        const modulo = await import('../features/login/PaginaLogin');
        return { Component: modulo.PaginaLogin };
      },
    },
    {
      element: <GuardaAutenticado />,
      children: [
        {
          element: <Layout />,
          children: [
            { path: '/', element: <Navigate to="/pacientes" replace /> },
            {
              path: '/pacientes',
              lazy: async () => {
                const modulo = await import('../features/pacientes/PaginasPacientes');
                return { Component: modulo.PaginaPacientes };
              },
            },
            {
              element: <GuardaPapel papeis={['RECEPCAO', 'ADMIN']} />,
              children: [
                {
                  path: '/pacientes/novo',
                  lazy: async () => {
                    const modulo = await import('../features/pacientes/PaginasPacientes');
                    return { Component: modulo.PaginaPacienteFormulario };
                  },
                },
                {
                  path: '/pacientes/:id',
                  lazy: async () => {
                    const modulo = await import('../features/pacientes/PaginasPacientes');
                    return { Component: modulo.PaginaPacienteFormulario };
                  },
                },
              ],
            },
            {
              path: '/agendamentos',
              lazy: async () => {
                const modulo = await import('../features/agendamentos/PaginaAgendamentos');
                return { Component: modulo.PaginaAgendamentos };
              },
            },
            {
              element: <GuardaPapel papeis={['ADMIN']} />,
              children: [
                {
                  path: '/profissionais',
                  lazy: async () => {
                    const modulo = await import('../features/profissionais/PaginaProfissionais');
                    return { Component: modulo.PaginaProfissionais };
                  },
                },
                {
                  path: '/procedimentos',
                  lazy: async () => {
                    const modulo = await import('../features/procedimentos/PaginaProcedimentos');
                    return { Component: modulo.PaginaProcedimentos };
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ]);
}
