import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { criarRouter } from './app/router';
import { Spinner, ToastProvider } from './shared/ui';
import './globals.css';

const queryClient = new QueryClient();

const raiz = document.getElementById('root');
if (!raiz) {
  throw new Error('Elemento #root não encontrado');
}

createRoot(raiz).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Suspense fallback={<Spinner />}>
          <RouterProvider router={criarRouter()} />
        </Suspense>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>
);
