/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Disable Vite's error overlay so it doesn't block interactions in browser tests
  server: {
    hmr: {
      overlay: false,
    },
  },
  test: {
    // Define projects explicitly to avoid non-project files
    projects: ['projects/ngx-vest-forms', 'projects/examples'],
    // Global options only - these affect all projects
    reporters: process.env['CI'] ? ['dot'] : ['default'],
    coverage: {
      provider: 'v8',
      experimentalAstAwareRemapping: true,
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
  },
});
