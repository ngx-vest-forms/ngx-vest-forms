import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  // Setup hook runs once before all tests
  async setup() {
    // Handle potential Jest/SWC issues and clean environment
    if (typeof vi !== 'undefined') {
      vi.clearAllMocks();
    }
  },
};

export default config;
