import { InjectionToken } from '@angular/core';
import { NGX_VALIDATION_DEBOUNCE_PRESETS } from './validation-debounce-presets';

/**
 * Default debounce for validation-config triggered dependent-field revalidation.
 */
export const NGX_VALIDATION_CONFIG_DEBOUNCE_DEFAULT =
  NGX_VALIDATION_DEBOUNCE_PRESETS.default;

/**
 * Injection token for configurable validation config debounce timing.
 *
 * This token allows you to configure the debounce time for validation config
 * dependencies at the application, route, or component level.
 *
 * This token affects only `validationConfig`-triggered dependent field
 * revalidation inside `FormDirective`. It does not change the debounce used for
 * direct field, group, or root-form validation. Use `validationOptions` for
 * those scenarios.
 *
 * @example
 * ```typescript
 * import {
 *   NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
 *   NGX_VALIDATION_DEBOUNCE_PRESETS,
 * } from 'ngx-vest-forms';
 *
 * /// Global configuration
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
 *       useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.relaxed
 *     }
 *   ]
 * };
 *
 * /// Per-route configuration
 * {
 *   path: 'checkout',
 *   component: CheckoutComponent,
 *   providers: [
 *     {
 *       provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
 *       useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.fast
 *     }
 *   ]
 * }
 *
 * /// Per-component override
 * @Component({
 *   providers: [
 *     {
 *       provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
 *       useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.immediate // for testing
 *     }
 *   ]
 * })
 * export class TestFormComponent {}
 * ```
 *
 * @default 100ms - Maintains backward compatibility with existing behavior
 */
export const NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN = new InjectionToken<number>(
  'NgxValidationConfigDebounceTime',
  {
    providedIn: 'root',
    factory: () => NGX_VALIDATION_CONFIG_DEBOUNCE_DEFAULT,
  }
);
