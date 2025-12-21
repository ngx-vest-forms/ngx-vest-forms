/**
 * Represents the state of a form managed by scVestForm directive.
 * This is the structure returned by NgxVestFormDirective.formState() or similar.
 */
export type NgxFormState<TModel = unknown> = {
  /** Whether the form is valid */
  valid: boolean;
  /** Map of field errors by field path */
  errors: Record<string, string[]>;
  /** Current form value (includes disabled fields) */
  value: TModel | null;
};

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
 * /// In a parent component that displays child form state
 * protected readonly formState = computed(() =>
 *   this.childForm()?.formState() ?? createEmptyFormState()
 * );
 * ```
 *
 * @example
 * ```typescript
 * /// With specific typing
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
    valid: true,
  };
}
