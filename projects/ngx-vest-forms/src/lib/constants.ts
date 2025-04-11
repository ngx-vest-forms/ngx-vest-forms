import { InjectionToken } from '@angular/core';

/**
 * Injection token for the root form identifier used in form error handling.
 *
 * This token can be overridden to customize the key used for root form errors:
 * ```typescript
 * // In your module or component providers:
 * providers: [
 *   { provide: ROOT_FORM, useValue: 'myCustomFormName' }
 * ]
 * ```
 *
 * @default 'rootForm'
 */
export const ROOT_FORM = new InjectionToken<string>('ROOT_FORM', {
  providedIn: 'root',
  factory: () => 'rootForm',
});
