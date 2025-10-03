/// <reference types="vitest" />
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { defineProject } from 'vitest/config';

import angular from '@analogjs/vite-plugin-angular';

export default defineProject(({ mode }) => ({
  plugins: [angular(), viteTsConfigPaths()],
  server: {
    hmr: {
      overlay: false,
    },
  },
  test: {
    name: 'ngx-vest-forms',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    include: [
      './**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', // Include all test files in all secondary entrypoints
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      './src/**', // Explicitly exclude the old src directory
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
    ],
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
      // Hide Vite's error overlay element in Vitest Browser runner to avoid click interception
      scripts: [
        {
          id: 'disable-vite-error-overlay.js',
          content: `
            try {
              const style = document.createElement('style');
              style.textContent = 'vite-error-overlay { display: none !important; pointer-events: none !important; }';
              document.head.appendChild(style);
              const overlay = document.querySelector('vite-error-overlay');
              if (overlay && overlay.style) {
                overlay.style.display = 'none';
                overlay.style.pointerEvents = 'none';
              }
            } catch (e) {
              // ignore
            }
          `,
        },
      ],
    },
    /**
     * Test isolation configuration for Angular projects
     *
     * **Why isolation is disabled:**
     * Per Marmicode's guidance, Angular's TestBed provides sufficient isolation
     * for test files. TestBed.resetTestingModule() (called in global afterEach)
     * ensures proper cleanup between tests.
     *
     * Disabling Vitest's isolation improves performance significantly:
     * - Faster test execution (no VM/thread overhead per file)
     * - Lower memory usage
     * - Still maintains proper test independence via TestBed
     *
     * This is the same pattern used with Karma, which ran all tests in a
     * single browser window successfully.
     *
     * @see https://cookbook.marmicode.io/angular/testing/why-vitest#vitest-isolation-modes
     */
    isolate: false,
    poolOptions: {
      threads: {
        // Disable isolation for thread pool (browser mode doesn't use this, but good to be explicit)
        isolate: false,
      },
      forks: {
        // Disable isolation for fork pool (if ever used)
        isolate: false,
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
