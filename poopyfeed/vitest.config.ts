import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
      ],
    },
  },
});
