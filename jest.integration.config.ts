import type { Config } from 'jest';
// @ts-expect-error - Jest requires the .ts extension for imports in ESM mode, but TS complains
import baseConfig from './jest.config.ts';

const moduleNameMapper = { ...(baseConfig.moduleNameMapper ?? {}) };
moduleNameMapper['^ngx-vest-forms$'] = '<rootDir>/dist/ngx-vest-forms';

const config: Config = {
  ...baseConfig,
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
  moduleNameMapper,
  collectCoverage: false,
};

export default config;
