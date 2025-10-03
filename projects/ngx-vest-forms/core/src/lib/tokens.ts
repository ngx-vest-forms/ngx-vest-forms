/**
 * Injection tokens for ngx-vest-forms directives and configuration
 * @module tokens
 */

import { InjectionToken } from '@angular/core';
import type { ErrorDisplayStrategy, VestForm } from './vest-form.types';

/**
 * Global configuration for ngx-vest-forms directives and behaviors.
 *
 * This configuration can be provided at the application level or component level
 * to control how ngx-vest-forms directives behave throughout the application.
 *
 * @example
 * ```typescript
 * // App-wide configuration
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgxVestFormsConfig({
 *       autoTouch: true,
 *       debug: true,
 *       defaultErrorStrategy: 'on-touch'
 *     })
 *   ]
 * };
 * ```
 */
export type NgxVestFormsConfig = {
  /**
   * Enable or disable the auto-touch directive globally.
   *
   * When `true`, the NgxVestAutoTouchDirective will automatically apply to
   * all form controls with `[value]` bindings (unless opted out with
   * `ngxVestTouchDisabled` attribute).
   *
   * When `false`, the directive will be disabled even if imported.
   *
   * @default true
   */
  autoTouch?: boolean;

  /**
   * Custom field name resolver for complex scenarios.
   *
   * This function is called after checking for the `data-vest-field` attribute
   * but before falling back to the `id` or `name` attributes. Use this to
   * implement custom field name extraction logic for your application.
   *
   * Common use cases:
   * - Extracting from `formControlName` attribute (Reactive Forms migration)
   * - Custom attribute conventions (e.g., `data-field-path`)
   * - Computed field names based on element properties
   *
   * @param element - The HTML element to extract the field name from
   * @returns The field name/path, or null to continue with default extraction
   *
   * @example
   * ```typescript
   * provideNgxVestFormsConfig({
   *   fieldNameResolver: (element) => {
   *     // Custom logic: extract from formControlName
   *     return element.getAttribute('formControlName');
   *   }
   * })
   * ```
   */
  fieldNameResolver?: (element: HTMLElement) => string | null;

  /**
   * Default error display strategy for all forms.
   *
   * This strategy will be used as the default for all forms created with
   * `createVestForm()` unless overridden by the form-specific options.
   *
   * @default 'on-touch'
   */
  defaultErrorStrategy?: ErrorDisplayStrategy;

  /**
   * Enable debug logging for directive behavior.
   *
   * When `true`, directives will log warnings and diagnostic information
   * to the console. Useful for troubleshooting field name extraction issues
   * or understanding directive behavior.
   *
   * @default false
   *
   * @example
   * ```typescript
   * // Enable debug mode in development
   * provideNgxVestFormsConfig({
   *   debug: !environment.production
   * })
   * ```
   */
  debug?: boolean;
};

/**
 * Injection token for global ngx-vest-forms configuration.
 *
 * Provides hierarchical configuration that can be set at the application level
 * or overridden at the component level. The configuration controls global
 * behavior of ngx-vest-forms directives.
 *
 * @example
 * ```typescript
 * // Inject in a directive
 * readonly #globalConfig = inject(NGX_VEST_FORMS_CONFIG, { optional: true });
 * ```
 */
export const NGX_VEST_FORMS_CONFIG = new InjectionToken<NgxVestFormsConfig>(
  'NGX_VEST_FORMS_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({
      autoTouch: true,
      debug: false,
    }),
  },
);

/**
 * Injection token for form instance provided by createVestForm.
 *
 * This token enables child directives (like NgxVestAutoTouchDirective) to
 * access the parent form instance without explicit passing through inputs.
 * The form instance is provided via DI when `createVestForm()` is called.
 *
 * @example
 * ```typescript
 * // Inject in a directive
 * readonly #form = inject<VestForm<Record<string, unknown>>>(NGX_VEST_FORM, { optional: true });
 * ```
 */
export const NGX_VEST_FORM = new InjectionToken<
  VestForm<Record<string, unknown>>
>('NGX_VEST_FORM');
