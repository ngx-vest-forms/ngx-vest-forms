const { getJestConfig } = require('@storybook/test-runner');

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  // The default configuration comes from @storybook/test-runner
  ...getJestConfig(),
  
  // Override specific configurations to avoid conflicts
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/projects/examples/',
  ],
  
  // Avoid Jest haste module collision
  moduleNameMapper: {
    '^ngx-vest-forms$': '<rootDir>/projects/ngx-vest-forms/src/public-api.ts',
  },
  
  // Fix SWC issues in CI
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
        },
        target: 'es2020',
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
  
  // Ensure proper environment
  testEnvironment: 'jsdom',
};
