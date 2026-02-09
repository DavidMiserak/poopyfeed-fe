import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '.angular/**',
        '**/*.spec.ts',
        '**/*.config.ts',
        '**/environment*.ts',
        'src/main.ts',
        'src/main.server.ts',
        'src/server.ts',
        'src/test-setup.ts',
      ],
    },
  },
});
