/// <reference types="vitest" />
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { defineProject } from 'vitest/config';

import angular from '@analogjs/vite-plugin-angular';

export default defineProject(({ mode }) => ({
  plugins: [angular(), viteTsConfigPaths()],
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
