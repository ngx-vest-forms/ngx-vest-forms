/**
 * Public API for ngx-vest-forms/core package
 * Framework-agnostic validation core built on Vest.js
 */

// Main factory function
export { createVestForm } from './lib/create-vest-form';

// Directives
export { NgxVestAutoAriaDirective } from './lib/directives/ngx-vest-auto-aria.directive';
export { NgxVestAutoTouchDirective } from './lib/directives/ngx-vest-auto-touch.directive';

// Components
export { NgxFormErrorComponent } from './lib/components/ngx-form-error.component';

// Import classes for use in NgxVestForms constant
import { NgxFormErrorComponent } from './lib/components/ngx-form-error.component';
import { NgxVestAutoAriaDirective } from './lib/directives/ngx-vest-auto-aria.directive';
import { NgxVestAutoTouchDirective } from './lib/directives/ngx-vest-auto-touch.directive';

/**
 * Convenience constant for importing all ngx-vest-forms directives and components.
 *
 * This constant provides a type-safe tuple of all public directives and components
 * that work together to provide automatic form accessibility and validation UX.
 *
 * ## What's Included
 *
 * - **NgxVestAutoAriaDirective**: Automatically adds `aria-invalid` and `aria-describedby`
 * - **NgxVestAutoTouchDirective**: Automatically marks fields as touched on blur/change
 * - **NgxFormErrorComponent**: Displays validation errors with proper ARIA attributes
 *
 * ## Usage
 *
 * Import all components at once for maximum automation:
 *
 * ```typescript
 * import { NgxVestForms } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   imports: [NgxVestForms],
 *   template: `
 *     <form>
 *       <input id="email" type="email" [value]="form.email()" (input)="form.setEmail($event)" />
 *       <ngx-form-error field="email" />
 *     </form>
 *   `
 * })
 * ```
 *
 * Or import selectively:
 *
 * ```typescript
 * import { NgxVestAutoAriaDirective, NgxFormErrorComponent } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   imports: [NgxVestAutoAriaDirective, NgxFormErrorComponent],
 *   /// ...
 * })
 * ```
 *
 * ## Benefits
 *
 * - **WCAG 2.2 Compliance**: Automatic ARIA attributes for accessibility
 * - **Less Boilerplate**: Reduces template code from ~15 lines to ~3 per field
 * - **Opt-Out**: Use `ngxVestAriaDisabled` or `ngxVestTouchDisabled` to disable per field
 * - **Type-Safe**: Readonly tuple prevents accidental modifications
 *
 * @see {@link NgxVestAutoAriaDirective} - Auto ARIA attributes
 * @see {@link NgxVestAutoTouchDirective} - Auto touch detection
 * @see {@link NgxFormErrorComponent} - Error display
 */
export const NgxVestForms = [
  NgxVestAutoAriaDirective,
  NgxVestAutoTouchDirective,
  NgxFormErrorComponent,
] as const;

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
  computeShowErrors,
  createCustomErrorStrategy,
  debounceErrorStrategy,
  ERROR_STRATEGIES,
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
