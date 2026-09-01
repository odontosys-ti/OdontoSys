import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

const origemPublica = process.env.ODONTOSYS_PUBLIC_ORIGIN ?? 'https://odontosys.devstank.com.br';
const hostPublico = new URL(origemPublica).hostname;

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
