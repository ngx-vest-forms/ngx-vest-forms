import { defineConfig } from 'oxlint';

// NOTE: `options.typeAware` enables the tsgolint-powered rules (see
// https://oxc.rs/docs/guide/usage/linter/type-aware). Type checking
// itself stays tsc's responsibility; `typeCheck` is intentionally NOT
// enabled so oxlint does not become a second, noisy type checker.
//
// The type-aware `no-unsafe-*` family and the assertion rules are set
// to `warn` here: this workspace allows `any` in utility and test code
// (`no-explicit-any` was already a warning under the previous eslint
// config), so they surface findings without blocking. Ratchet them to
// error once the findings are worked off.
export default defineConfig({
  plugins: [
    'typescript',
    'unicorn',
    'oxc',
    'import',
    'promise',
    'node',
    'vitest',
  ],
  categories: {
    correctness: 'error',
    suspicious: 'error',
    pedantic: 'warn',
    perf: 'warn',
    // `style` intentionally off — prettier owns formatting concerns.
    // `restriction` intentionally off — opt into individual restriction
    // rules below instead of enabling the category wholesale.
  },
  options: {
    typeAware: true,
  },
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  globals: {
    ngDevMode: 'readonly',
  },
  ignorePatterns: [
    '.angular',
    '.nx',
    '.worktrees',
    '.agents',
    '.claude',
    '.github',
    '**/dist',
    '**/tmp',
    '**/node_modules',
    '**/coverage',
    'playwright-report',
    'test-results',
  ],
  rules: {
    // Opt-ins from the `restriction` category (kept off as a whole).
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Never enforced under the previous eslint config; high churn for
    // no behavioral gain in this codebase.
    'require-unicode-regexp': 'off',
    'no-underscore-dangle': 'off', // flags Zod's public `_def` field
    'import/no-unassigned-import': 'off', // side-effect imports (styles, zone.js)
    'typescript/no-generated-empty-object-type': 'warn',
    'no-inline-comments': 'off',
    'max-lines-per-function': 'off',
    'typescript/prefer-readonly-parameter-types': 'off',
    'typescript/strict-boolean-expressions': 'off',
    'typescript/strict-void-return': 'off',
    'no-await-in-loop': 'off', // e2e steps are sequential by design
    'vitest/no-conditional-in-test': 'off', // branched table-driven specs
    'vitest/require-mock-type-parameters': 'off',
    'unicorn/consistent-function-scoping': 'warn',
    'unicorn/no-array-sort': 'warn',

    // Type-aware families: warn in production code (see header note).
    'typescript/no-unsafe-call': 'warn',
    'typescript/no-unsafe-member-access': 'warn',
    'typescript/no-unsafe-assignment': 'warn',
    'typescript/no-unsafe-return': 'warn',
    'typescript/no-unsafe-argument': 'warn',
    'typescript/no-unsafe-type-assertion': 'warn',
    'typescript/no-unnecessary-type-assertion': 'warn',
    'typescript/no-unnecessary-type-conversion': 'warn',
    'typescript/no-unnecessary-type-parameters': 'warn',
    'typescript/no-unnecessary-type-arguments': 'warn',
    'typescript/restrict-template-expressions': 'warn',
    'typescript/no-base-to-string': 'warn',
    'typescript/no-redundant-type-constituents': 'warn',
    'typescript/no-deprecated': 'warn',
  },
  overrides: [
    {
      // Test files — match the leniency of the previous eslint config.
      files: [
        '**/*.spec.ts',
        '**/*.stories.ts',
        '**/testing/**/*.ts',
        'apps/examples-e2e/**',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-member-access': 'off',
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/no-unsafe-argument': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
        'typescript/no-unnecessary-type-assertion': 'off',
        'typescript/unbound-method': 'off',
        'typescript/await-thenable': 'warn',
        'no-shadow': 'warn',
        'unicorn/no-thenable': 'off',
        'unicorn/no-useless-spread': 'warn',
        'import/no-unassigned-import': 'off',
        'vitest/no-conditional-expect': 'off',
        'vitest/warn-todo': 'off',
        'typescript/no-extraneous-class': 'off', // fixture classes with statics
        'typescript/no-floating-promises': 'warn',
        'promise/no-callback-in-promise': 'warn',
      },
    },
    {
      // Contract specs pass a failure message as expect()'s second
      // argument; that message is what tells an upgrader what broke.
      files: ['**/*.contract.spec.ts'],
      rules: {
        'vitest/valid-expect': ['error', { maxArgs: 2 }],
      },
    },
  ],
});
