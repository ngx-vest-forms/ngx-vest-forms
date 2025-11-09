import type { Config } from 'jest';

const config: Config = {
  preset: './jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/projects/ngx-vest-forms/src/test-setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  // Prevent Jest haste module naming collision between dist and source
  haste: {
    enableSymlinks: false,
  },
  // More aggressive dist folder exclusion
  watchPathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverageFrom: [
    'projects/ngx-vest-forms/src/lib/**/*.ts',
    'projects/examples/src/app/**/*.ts',
    '!projects/ngx-vest-forms/src/lib/**/*.spec.ts',
    '!projects/ngx-vest-forms/src/lib/testing/**',
    '!projects/examples/src/app/**/*.spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageReporters: ['html', 'lcov', 'text-summary'],
  moduleNameMapper: {
    '^ngx-vest-forms': '<rootDir>/projects/ngx-vest-forms/src/public-api.ts',
  },
  // Handle ES modules from node_modules and add fallback for SWC issues
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|vest|n4s|vestjs-runtime|vest-utils|context|@testing-library)/.*)',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  // Add explicit roots to avoid scanning dist
  roots: [
    '<rootDir>/projects/ngx-vest-forms/src',
    '<rootDir>/projects/examples/src',
  ],
};

export default config;
