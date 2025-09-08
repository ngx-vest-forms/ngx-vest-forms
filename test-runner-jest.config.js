const { getJestConfig } = require('@storybook/test-runner');

// The default Jest configuration comes from @storybook/test-runner
const testRunnerConfig = getJestConfig();

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  ...testRunnerConfig,

  // Prevent Jest haste module naming collision between dist and source
  watchPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],

  // More aggressive dist folder exclusion
  haste: {
    enableSymlinks: false,
  },

  // Explicitly set roots to avoid scanning problematic directories
  roots: ['<rootDir>'],

  // Add better handling for native modules like @swc/core
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|vest|n4s|vestjs-runtime|vest-utils|context|@storybook)/.*)',
  ],

  // Increase timeout to handle potential slower CI environments
  testTimeout: 30000,

  // Add better error handling
  bail: false,
  verbose: true,
};
