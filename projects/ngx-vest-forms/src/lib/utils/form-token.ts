import { inject, Injector, runInInjectionContext } from '@angular/core';

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

/**
 * Options for `injectRootFormKey`.
 */
export type InjectRootFormKeyOptions = {
  /**
   * Optional injector instance to use. If provided, `runInInjectionContext` will be used.
   * If not provided, the function will attempt to use the current injection context.
   */
  injector?: Injector;
};

/**
 * Injects the current value of the ROOT_FORM token.
 * Useful for accessing the key used for root-level validation errors
 * within components or services, respecting any custom value provided
 * via dependency injection.
 *
 * It can optionally run within a specific `Injector` context if provided,
 * or fall back gracefully when called outside of any injection context.
 *
 * Use this function in any component or service that needs to access the current
 * root form key value, ensuring it respects any overrides provided through DI.
 *
 * @example
 * ```typescript
 * /// In a component (uses current injection context)
 * const formKey = injectRootFormKey();
 *
 * /// With explicit fallback (uses current injection context)
 * const formKey = injectRootFormKey('customFallback');
 *
 * /// With a specific injector
 * const injector = inject(Injector);
 * const formKey = injectRootFormKey('customFallback', { injector });
 * ```
 *
 * @param fallback - Optional fallback value to use if the token is not available or
 *                   when called outside of injection context.
 * @param options - Optional configuration, including an `injector` instance.
 * @returns The current ROOT_FORM token value or the fallback.
 *
 */
export function injectRootFormKey(
  fallback = 'rootForm',
  options?: InjectRootFormKeyOptions,
): string {
  const userFallback = fallback;
  const injector = options?.injector;

  if (injector) {
    // Run within the provided injector context
    return runInInjectionContext(injector, () => {
      const rootFormKey = inject(ROOT_FORM, { optional: true });
      if (!rootFormKey) {
        console.warn(
          'ROOT_FORM token not found using provided injector. Using fallback value:',
          userFallback,
        );
      }
      return rootFormKey ?? userFallback;
    });
  } else {
    // Attempt to run in the current injection context
    try {
      const rootFormKey = inject(ROOT_FORM, { optional: true });
      if (!rootFormKey) {
        console.warn(
          'ROOT_FORM token not found in current DI context. Using fallback value:',
          userFallback,
        );
      }
      return rootFormKey ?? userFallback;
    } catch {
      console.warn(
        'injectRootFormKey called outside of injection context and no injector provided. Using fallback value:',
        userFallback,
      );
      return userFallback;
    }
  }
}
