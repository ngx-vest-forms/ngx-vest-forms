/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';

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
    },
    // Sequence hooks to match Jest behavior
    sequence: {
      hooks: 'list',
    },
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
