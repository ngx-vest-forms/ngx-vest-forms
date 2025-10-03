/**
 * Public API for ngx-vest-forms/core package
 * Framework-agnostic validation core built on Vest.js
 */

// Main factory function
export { createVestForm } from './lib/create-vest-form';

// Directives
export { NgxVestAutoTouchDirective } from './lib/directives/ngx-vest-auto-touch.directive';

// Components
export { NgxFormErrorComponent } from './lib/components/ngx-form-error.component';

// Types and interfaces
export type {
  EnhancedVestForm,
  ErrorDisplayStrategy,
  Path,
  PathValue,
  SchemaAdapter,
  SchemaValidationResult,
  ValidationMessages,
  VestField,
  VestForm,
  VestFormArray,
  VestFormOptions,
} from './lib/vest-form.types';

// Error display strategies
export {
  ERROR_STRATEGIES,
  computeShowErrors,
  createCustomErrorStrategy,
  debounceErrorStrategy,
  getStrategyInfo,
} from './lib/error-strategies';

// Enhanced proxy functionality
export { createEnhancedProxy } from './lib/enhanced-proxy';

// Form arrays functionality
export {
  arrayValidationHelpers,
  createEnhancedVestFormArray,
  createVestFormArray,
} from './lib/form-arrays';

export type { EnhancedVestFormArray } from './lib/form-arrays';

// Form composition
export {
  composeVestForms,
  compositionUtilities,
  createWizardForm,
} from './lib/compose-vest-forms';

// Utility functions
export {
  deleteValueByPath,
  getAllPaths,
  getValueByPath,
  hasPath,
  isValidPath,
  normalizePath,
  setValueByPath,
} from './lib/utils/path-utils';

export {
  createFieldSetter,
  deepClone,
  extractValueFromEvent,
  extractValueFromEventOrValue,
  isEmpty,
  normalizeFieldValue,
} from './lib/utils/value-extraction';

// Safe suite wrappers (prevent only(undefined) bug)
export { createSafeSuite, staticSafeSuite } from './lib/utils/safe-suite';

export type { SafeSuite, SafeSuiteFunction } from './lib/utils/safe-suite';

// Type helpers for signal unwrapping
export { isSignal, unwrapSignal } from './lib/utils/type-helpers';

export type { Unwrap } from './lib/utils/type-helpers';

// DI tokens and configuration
export { NGX_VEST_FORM, NGX_VEST_FORMS_CONFIG } from './lib/tokens';

export type { NgxVestFormsConfig } from './lib/tokens';

// Environment providers
export { provideNgxVestFormsConfig } from './lib/providers';

// Version information
export const VERSION = '2.0.0-beta.1';

// Package metadata
export const PACKAGE_NAME = 'ngx-vest-forms/core';
export const PACKAGE_DESCRIPTION =
  'Framework-agnostic validation core for ngx-vest-forms V2';
