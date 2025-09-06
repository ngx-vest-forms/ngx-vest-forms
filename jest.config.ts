import type { Config } from 'jest';
import { createCjsPreset } from 'jest-preset-angular/presets/index.js';

export default {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/projects/ngx-vest-forms/src/setup-jest.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/projects/examples/',
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
} satisfies Config;
