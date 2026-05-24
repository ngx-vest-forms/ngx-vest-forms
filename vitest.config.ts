/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [angular()],
  resolve: {
    alias: {
      'ngx-vest-forms': resolve(
        __dirname,
        'packages/ngx-vest-forms/src/public-api.ts'
      ),
    },
    dedupe: ['vest', 'n4s', 'vest-utils', 'vestjs-runtime', 'context'],
  },
  optimizeDeps: {
    include: [
      'vest',
      'vest/memo',
      'vest/email',
      'n4s',
      'vest-utils',
      'vestjs-runtime',
      'context',
      'rxjs',
      '@testing-library/jest-dom',
      '@testing-library/jest-dom/matchers',
      'css.escape',
      'picocolors',
      'aria-query',
      '@analogjs/vitest-angular/setup-testbed',
      '@analogjs/vitest-angular/setup-snapshots',
    ],
  },
  test: {
    globals: true,
    isolate: true,
    setupFiles: ['packages/ngx-vest-forms/src/test-setup.ts'],
    exclude: ['node_modules', 'dist', 'apps/examples-e2e'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'lcov', 'text-summary'],
      include: [
        'packages/ngx-vest-forms/src/lib/**/*.ts',
        'apps/examples/src/app/**/*.ts',
      ],
      exclude: [
        'packages/ngx-vest-forms/src/lib/**/*.spec.ts',
        'packages/ngx-vest-forms/src/lib/testing/**',
        'apps/examples/src/app/**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
      thresholds: {
        'packages/ngx-vest-forms/src/lib/**': {
          lines: 85,
          branches: 80,
          functions: 85,
          statements: 85,
        },
      },
    },
    // Sequence hooks to match Jest behavior
    sequence: {
      hooks: 'list',
    },
    projects: [
      {
        extends: true,
        test: {
          name: { label: 'node', color: 'green' },
          include: ['apps/examples/src/app/pages/**/*.validations.spec.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: { label: 'browser', color: 'blue' },
          // Browser mode configuration (no jsdom needed)
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            headless: true, // set to false for debugging
            fileParallelism: false, // Run test files sequentially to avoid NG0912 component ID collisions
          },
          include: [
            'packages/ngx-vest-forms/src/**/*.spec.ts',
            'apps/examples/src/**/*.spec.ts',
          ],
          exclude: [
            'node_modules',
            'dist',
            'apps/examples-e2e',
            'apps/examples/src/app/pages/**/*.validations.spec.ts',
          ],
        },
      },
    ],
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
