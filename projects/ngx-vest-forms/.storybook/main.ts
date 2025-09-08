import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@chromatic-com/storybook',
    '@storybook/addon-coverage',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  env: (config) => ({
    ...config,
    NODE_ENV: 'test',
  }),
  typescript: {
    check: false,
  },
};
export default config;
