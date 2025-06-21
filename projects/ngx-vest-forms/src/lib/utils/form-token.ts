import { inject, Injector, runInInjectionContext } from '@angular/core';

import { InjectionToken } from '@angular/core';

/**
 * Injection token for the root form identifier used in form error handling.
 *
 * This token can be overridden to customize the key used for root form errors:
 * ```typescript
 * // In your module or component providers:
 * providers: [
 *   { provide: NGX_ROOT_FORM, useValue: 'myCustomFormName' }
 * ]
 * ```
 *
 * @default 'rootForm'
 */
export const NGX_ROOT_FORM = new InjectionToken<string>('NGX_ROOT_FORM', {
  providedIn: 'root',
  factory: () => 'rootForm',
});

/**
 * Options for `injectNgxRootFormKey`.
 */
export type NgxInjectRootFormKeyOptions = {
  /**
   * Optional injector instance to use. If provided, `runInInjectionContext` will be used.
   * If not provided, the function will attempt to use the current injection context.
   */
  injector?: Injector;
};

/**
 * Injects the current value of the NGX_ROOT_FORM token.
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
 * const formKey = injectNgxRootFormKey();
 *
 * /// With explicit fallback (uses current injection context)
 * const formKey = injectNgxRootFormKey('customFallback');
 *
 * /// With a specific injector
 * const injector = inject(Injector);
 * const formKey = injectNgxRootFormKey('customFallback', { injector });
 * ```
 *
 * @param fallback - Optional fallback value to use if the token is not available or
 *                   when called outside of injection context.
 * @param options - Optional configuration, including an `injector` instance.
 * @returns The current NGX_ROOT_FORM token value or the fallback.
 *
 */
export function injectNgxRootFormKey(
  fallback = 'rootForm',
  options?: NgxInjectRootFormKeyOptions,
): string {
  const userFallback = fallback;
  const injector = options?.injector;

  if (injector) {
    // Run within the provided injector context
    return runInInjectionContext(injector, () => {
      const rootFormKey = inject(NGX_ROOT_FORM, { optional: true });
      if (!rootFormKey) {
        console.warn(
          'NGX_ROOT_FORM token not found using provided injector. Using fallback value:',
          userFallback,
        );
      }
      return rootFormKey ?? userFallback;
    });
  } else {
    // Attempt to run in the current injection context
    try {
      const rootFormKey = inject(NGX_ROOT_FORM, { optional: true });
      if (!rootFormKey) {
        console.warn(
          'NGX_ROOT_FORM token not found in current DI context. Using fallback value:',
          userFallback,
        );
      }
      return rootFormKey ?? userFallback;
    } catch {
      console.warn(
        'injectNgxRootFormKey called outside of injection context and no injector provided. Using fallback value:',
        userFallback,
      );
      return userFallback;
    }
  }
}
