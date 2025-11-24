/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { playwright } from '@vitest/browser-playwright';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [angular()],
  resolve: {
    alias: {
      'ngx-vest-forms': resolve(__dirname, 'projects/ngx-vest-forms/src/public-api.ts'),
    },
  },
  optimizeDeps: {
    include: [
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
    setupFiles: ['projects/ngx-vest-forms/src/test-setup.ts'],
    // Browser mode configuration (no jsdom needed)
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      headless: true, // set to false for debugging
      fileParallelism: false, // Run test files sequentially to avoid NG0912 component ID collisions
      isolate: true, // Each test file runs in its own isolated context
    },
    include: [
      'projects/ngx-vest-forms/src/**/*.spec.ts',
      'projects/examples/src/**/*.spec.ts',
    ],
    exclude: ['node_modules', 'dist', 'e2e'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'lcov', 'text-summary'],
      include: [
        'projects/ngx-vest-forms/src/lib/**/*.ts',
        'projects/examples/src/app/**/*.ts',
      ],
      exclude: [
        'projects/ngx-vest-forms/src/lib/**/*.spec.ts',
        'projects/ngx-vest-forms/src/lib/testing/**',
        'projects/examples/src/app/**/*.spec.ts',
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
