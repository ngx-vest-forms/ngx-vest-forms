import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { NgxDeepPartial } from './deep-partial';
import type { NgxDeepRequired } from './deep-required';
import { validateShape } from './shape-validation';

/**
 * Wraps a legacy "shape" object (a `NgxDeepRequired<T>` example with default
 * values for every property) behind the {@link StandardSchemaV1} interface so
 * the directive can treat all `formContract` inputs through one unified
 * validation path.
 *
 * The resulting schema:
 * - Always returns the input as a successful value (never blocks form validity)
 * - In dev mode, walks the value with `validateShape` to surface typo and
 *   structural warnings via the existing error catalog logger
 *
 * Useful for incrementally migrating from the deprecated `[formShape]` input
 * to the new `[formContract]` input without rewriting existing shape objects.
 *
 * @example
 * ```ts
 * import { toFormContract } from 'ngx-vest-forms';
 *
 * protected readonly contract = toFormContract<MyFormModel>(myFormShape);
 * ```
 */
export function toFormContract<T>(
  shape: NgxDeepRequired<T>
): StandardSchemaV1<NgxDeepPartial<T>> {
  return {
    '~standard': {
      version: 1,
      vendor: 'ngx-vest-forms',
      validate: (input: unknown) => {
        if (input && typeof input === 'object' && !Array.isArray(input)) {
          validateShape(
            input as Record<string, unknown>,
            shape as unknown as Record<string, unknown>
          );
        }
        return { value: input as NgxDeepPartial<T> };
      },
    },
  };
}
