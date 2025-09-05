import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import angular from 'angular-eslint';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strict,
      tseslint.configs.stylistic,
      eslintPluginUnicorn.configs.recommended,
      angular.configs.tsRecommended,
    ],
    // Base configurations
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'ngx',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'ngx',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'no-public' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'unicorn/no-null': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-abbr': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          checkFilenames: false,
        },
      ],
    },
  },

  // HTML-specific rules
  {
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      // Add any specific rules for HTML templates if needed
    },
  },
  /// Vitest
  {
    files: ['projects/**/*.spect.ts'], // or any other pattern
    ...vitest.configs.recommended,
  },

  // General improvements
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '**/_backup/'],
  },
]);
