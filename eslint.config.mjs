import eslint from '@eslint/js';
import angular from 'angular-eslint';
import jest from 'eslint-plugin-jest';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strict,
      tseslint.configs.stylistic,
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
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for utility code
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
      '@typescript-eslint/no-unsafe-function-type': 'warn', // Warn for Function type
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ], // Allow unused vars starting with _
      'no-prototype-builtins': 'error',
      'prefer-const': 'error',
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
      '@angular-eslint/template/label-has-associated-control': 'warn',
    },
  },

  // Test files - more lenient rules
  {
    files: ['**/*.spec.ts', '**/*.stories.ts', '**/testing/**/*.ts'],
    plugins: { jest },
    languageOptions: {
      globals: jest.environments.globals.globals,
    },
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/expect-expect': 'warn',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/valid-expect': 'error',
      'jest/no-conditional-expect': 'off', // Allow conditional expects in tests
      '@angular-eslint/component-selector': 'off', // Allow test components without ngx prefix
      '@angular-eslint/directive-selector': 'off', // Allow test directives without ngx prefix
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused vars in test fixtures
      '@typescript-eslint/no-empty-function': 'off', // Allow empty functions in tests
      '@typescript-eslint/consistent-indexed-object-style': 'off', // Allow index signatures in tests
      '@typescript-eslint/array-type': 'off', // Allow any array type syntax in tests
      '@typescript-eslint/no-extraneous-class': 'off', // Allow empty test classes
      '@typescript-eslint/consistent-type-definitions': 'off', // Allow interfaces in tests
      '@typescript-eslint/no-inferrable-types': 'off', // Allow inferrable types in tests
      '@typescript-eslint/no-unsafe-function-type': 'off', // Allow Function type in tests
    },
  },

  // Example app - more lenient rules (disable selector enforcement)
  {
    files: ['projects/examples/**/*.ts'],
    extends: [angular.configs.tsRecommended], // Need to extend to override properly
    rules: {
      '@angular-eslint/component-selector': 'off', // Example components don't need ngx prefix
      '@angular-eslint/directive-selector': 'off', // Example directives don't need ngx prefix
      '@typescript-eslint/explicit-member-accessibility': 'off', // Allow public in examples
      '@typescript-eslint/consistent-indexed-object-style': 'off', // Allow index signatures
      '@typescript-eslint/no-explicit-any': 'warn', // Warn but don't error on any
      '@typescript-eslint/no-unused-vars': 'warn', // Warn on unused vars
      'prefer-const': 'warn', // Warn on const usage
    },
  },

  // HTML templates in examples
  {
    files: ['projects/examples/**/*.html'],
    rules: {
      '@angular-eslint/template/label-has-associated-control': 'warn', // Warn instead of error
    },
  },

  // General improvements
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '**/_backup/'],
  },
]);
