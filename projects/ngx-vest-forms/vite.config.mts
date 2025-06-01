/// <reference types="vitest" />
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(({ mode }) => ({
  plugins: [angular(), viteTsConfigPaths()],
  test: {
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
    ],
    reporters: process.env['CI'] ? ['dot'] : ['default'],
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      provider: 'v8',
      reporter: process.env['CI']
        ? ['text', 'lcov']
        : ['text', 'json', 'html', 'lcov'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/public-api.ts',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
    // Optimize for CI performance
    maxConcurrency: process.env['CI'] ? 1 : 5,
    minThreads: process.env['CI'] ? 1 : undefined,
    maxThreads: process.env['CI'] ? 2 : undefined,
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
