export const ROOT_FORM = 'rootForm';

/**
 * Debounce time in milliseconds for validation config dependency triggering.
 * This prevents excessive validation calls when trigger fields change rapidly.
 *
 * @deprecated Use NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN injection token instead.
 * This constant will be removed in a future major version.
 *
 * Migration:
 * ```typescript
 * // Old (hardcoded)
 * import { VALIDATION_CONFIG_DEBOUNCE_TIME } from 'ngx-vest-forms';
 *
 * // New (configurable via DI)
 * import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
 *
 * // Global config
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 200 }
 *   ]
 * };
 *
 * // Per-component config
 * @Component({
 *   providers: [
 *     { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 0 }
 *   ]
 * })
 * ```
 */
export const VALIDATION_CONFIG_DEBOUNCE_TIME = 100;
