import { inject } from '@angular/core';
import { ROOT_FORM } from '../constants';

/**
 * Returns the current ROOT_FORM token value from Angular's dependency injection.
 *
 * This utility function uses Angular's `inject()` function to access the ROOT_FORM
 * token, with graceful fallback for when called outside of injection context.
 *
 * Use this function in any component or service that needs to access the current
 * root form key value, ensuring it respects any overrides provided through DI.
 *
 * @example
 * ```typescript
 * // In a component
 * const formKey = injectRootFormKey();
 *
 * // With explicit fallback
 * const formKey = injectRootFormKey('customFallback');
 * ```
 *
 * @param fallback - Optional fallback value to use if the token is not available or
 *                   when called outside of injection context
 * @returns The current ROOT_FORM token value or the fallback
 */
export function injectRootFormKey(fallback = 'rootForm'): string {
  try {
    return inject(ROOT_FORM, { optional: true }) ?? fallback;
  } catch {
    // Return fallback if called outside of injection context
    return fallback;
  }
}
