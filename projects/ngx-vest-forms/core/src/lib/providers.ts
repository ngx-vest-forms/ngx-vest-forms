/**
 * Provider functions for ngx-vest-forms configuration
 * @module providers
 */

import {
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import { NGX_VEST_FORMS_CONFIG, type NgxVestFormsConfig } from './tokens';

/**
 * Provide global ngx-vest-forms configuration.
 *
 * Use this function in `app.config.ts` to configure ngx-vest-forms behavior
 * across your entire application, or in component providers to override
 * configuration for a specific component tree.
 *
 * @param config - Partial configuration object (all properties optional)
 * @returns Environment providers for the configuration
 *
 * @example App-wide configuration
 * ```typescript
 * // app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideNgxVestFormsConfig } from 'ngx-vest-forms/core';
 *
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
 *
 * @example Component-level override
 * ```typescript
 * import { Component } from '@angular/core';
 * import { provideNgxVestFormsConfig } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   selector: 'app-special-form',
 *   providers: [
 *     provideNgxVestFormsConfig({
 *       autoTouch: false, // Disable auto-touch for this component tree
 *       debug: true
 *     })
 *   ],
 *   template: `...`
 * })
 * export class SpecialFormComponent {
 *   // This component and its children will use the overridden config
 * }
 * ```
 *
 * @example Custom field name resolver
 * ```typescript
 * provideNgxVestFormsConfig({
 *   fieldNameResolver: (element) => {
 *     // Custom logic: extract from formControlName attribute
 *     const formControlName = element.getAttribute('formControlName');
 *     if (formControlName) {
 *       return formControlName;
 *     }
 *
 *     // Custom logic: extract from data-field attribute
 *     const dataField = element.getAttribute('data-field');
 *     if (dataField) {
 *       return dataField;
 *     }
 *
 *     // Return null to continue with default extraction (id, name)
 *     return null;
 *   }
 * })
 * ```
 */
export function provideNgxVestFormsConfig(
  config: Partial<NgxVestFormsConfig>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NGX_VEST_FORMS_CONFIG, useValue: config },
  ]);
}
