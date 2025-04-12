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
    const rootFormKey = inject(ROOT_FORM, { optional: true });
    if (!rootFormKey) {
      console.warn(
        'ROOT_FORM token not found in DI context. Using fallback value:',
        fallback,
      );
    }
    return rootFormKey ?? fallback;
  } catch {
    console.warn(
      'injectRootFormKey called outside of injection context. Using fallback value:',
      fallback,
    );
    return fallback;
  }
}
