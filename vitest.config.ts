import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.*',
        '**/types/**',
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
});
