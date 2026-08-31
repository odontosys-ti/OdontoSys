import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { criarRouter } from './app/router';
import './globals.css';

const queryClient = new QueryClient();

const raiz = document.getElementById('root');
if (!raiz) {
  throw new Error('Elemento #root não encontrado');
}

createRoot(raiz).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={criarRouter()} />
    </QueryClientProvider>
  </StrictMode>
);
