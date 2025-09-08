import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/projects/ngx-vest-forms/src/setup-jest.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/projects/examples/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
  ],
  collectCoverageFrom: [
    'projects/ngx-vest-forms/src/lib/**/*.ts',
    '!projects/ngx-vest-forms/src/lib/**/*.spec.ts',
    '!projects/ngx-vest-forms/src/lib/testing/**',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageReporters: ['html', 'lcov', 'text-summary'],
  displayName: 'ngx-vest-forms',
  // Handle ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|vest|n4s|vestjs-runtime|vest-utils|context)/.*)',
  ],
};

export default config;
