import type { Config } from 'jest';
import baseConfig from './jest.config';

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
