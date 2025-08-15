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
    // Optimize for CI performance
    maxConcurrency: process.env['CI'] ? 1 : 5,
    minThreads: process.env['CI'] ? 1 : undefined,
    maxThreads: process.env['CI'] ? 2 : undefined,
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
