import { InjectionToken } from '@angular/core';
import { fastDeepEqual } from '../utils/equality';

/**
 * Signature of a deep-equality comparator. Must return `true` iff `a` and `b`
 * are considered equal for the purpose of change detection.
 */
export type NgxEqualityFn = (a: unknown, b: unknown) => boolean;

/**
 * Injection token for the deep-equality function used internally by
 * {@link FormDirective} for change detection — `formValueChange`
 * `distinctUntilChanged`, the form↔model two-way sync effect, and the
 * `formState` signal's structural comparator.
 *
 * The default factory returns {@link fastDeepEqual}. Override this token to
 * plug in a smaller or differently-tuned comparator (e.g. `dequal/lite`,
 * `lodash.isEqual`) without forking the directive.
 *
 * @example Bring-your-own equality at the application level
 * ```ts
 * import { dequal } from 'dequal/lite';
 * import { NGX_EQUALITY_FN } from 'ngx-vest-forms';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: NGX_EQUALITY_FN, useValue: dequal },
 *   ],
 * };
 * ```
 *
 * @example Per-component override (e.g. for tests)
 * ```ts
 * @Component({
 *   providers: [
 *     { provide: NGX_EQUALITY_FN, useValue: (a, b) => a === b },
 *   ],
 * })
 * export class TestFormComponent {}
 * ```
 *
 * @default {@link fastDeepEqual}
 */
export const NGX_EQUALITY_FN = new InjectionToken<NgxEqualityFn>(
  'NgxEqualityFn',
  {
    providedIn: 'root',
    factory: () => fastDeepEqual,
  }
);
