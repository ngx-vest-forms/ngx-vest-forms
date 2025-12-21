import { InjectionToken } from '@angular/core';

/**
 * Injection token for configurable validation config debounce timing.
 *
 * This token allows you to configure the debounce time for validation config
 * dependencies at the application, route, or component level.
 *
 * @example
 * ```typescript
 * /// Global configuration
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
 *       useValue: 200
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
 *       useValue: 50
 *     }
 *   ]
 * }
 *
 * /// Per-component override
 * @Component({
 *   providers: [
 *     {
 *       provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
 *       useValue: 0 // for testing
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
    factory: () => 100,
  }
);
