const { getJestConfig } = require('@storybook/test-runner');

// The default Jest configuration comes from @storybook/test-runner
const testRunnerConfig = getJestConfig();

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  ...testRunnerConfig,

  // Only the essential fixes we need
  // 1. Prevent Jest haste module naming collision
  modulePathIgnorePatterns: ['<rootDir>/dist/'],

  // 2. Don't scan dist folder for tests or modules
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],

  // 3. Increase timeout for CI environments
  testTimeout: 30000,
};
