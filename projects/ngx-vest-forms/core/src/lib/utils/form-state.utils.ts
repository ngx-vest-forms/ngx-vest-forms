import type { NgxFormState } from '../directives/form.directive';

/**
 * Creates an empty NgxFormState with default values.
 *
 * This utility is helpful when you need to provide a fallback for components
 * that require a non-null NgxFormState, such as when child components
 * might not be initialized yet.
 *
 * @template TModel The type of the form model/value
 * @returns A complete NgxFormState object with empty/default values
 *
 * @example
 * ```typescript
 * // In a parent component that displays child form state
 * protected readonly formState = computed(() =>
 *   this.childForm()?.formState() ?? createEmptyFormState()
 * );
 * ```
 *
 * @example
 * ```typescript
 * // With specific typing
 * interface MyFormModel {
 *   name: string;
 *   email: string;
 * }
 *
 * const emptyState = createEmptyFormState<MyFormModel>();
 * ```
 */
export function createEmptyFormState<TModel = unknown>(): NgxFormState<TModel> {
  return {
    value: null,
    errors: {},
    warnings: {},
    root: null,
    status: 'VALID',
    dirty: false,
    valid: true,
    invalid: false,
    pending: false,
    disabled: false,
    idle: true,
    submitted: false,
    errorCount: 0,
    warningCount: 0,
    firstInvalidField: null,
    schema: undefined,
  };
}
