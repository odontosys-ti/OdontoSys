import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

import { destinoHttps } from './https-redirect.ts';

const origemPublica = process.env.ODONTOSYS_PUBLIC_ORIGIN ?? 'https://odontosys.devstank.com.br';
const hostPublico = new URL(origemPublica).hostname;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'odontosys-https-publico',
      configurePreviewServer(server) {
        server.middlewares.use((request, response, next) => {
          const destino = destinoHttps(request.headers, request.url, hostPublico);
          if (!destino) {
            next();
            return;
          }
          response.statusCode = 308;
          response.setHeader('Location', destino);
          response.end();
        });
      },
    },
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    allowedHosts: [hostPublico],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3333',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@web': path.resolve(import.meta.dirname, './src'),
    },
  },
});
