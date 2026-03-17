import { computed, type Signal } from '@angular/core';

/**
 * Packaged snapshot of the current form state exposed by the form directive.
 *
 * This shape is intentionally presentation-friendly: it combines the latest
 * validity flag, field-level errors, and the merged form value in one object so
 * container and presenter components can consume a single signal.
 *
 * The `value` property includes disabled fields, matching the packaged form
 * state emitted by the directive.
 *
 * @template TModel Form model represented by the packaged state.
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
 * Minimal signal-based contract required to derive reusable form feedback signals.
 *
 * Consumers typically satisfy this contract with `FormDirective`, but any custom
 * adapter can implement the same shape when exposing form feedback from another
 * abstraction.
 *
 * @template TModel Form model represented by the source signals.
 */
export type NgxFormFeedbackSource<TModel = unknown> = {
  /** Reactive packaged form state */
  formState: Signal<NgxFormState<TModel>>;
  /** Non-blocking warnings keyed by field path */
  fieldWarnings: Signal<ReadonlyMap<string, readonly string[]>>;
  /** Field paths that have been validated (touched or submitted) */
  touchedFieldPaths: Signal<readonly string[]>;
  /** Whether async validation is currently pending */
  pending: Signal<boolean>;
};

/**
 * Reusable bundle of derived signals commonly exposed by form-body and presenter
 * components.
 *
 * This keeps templates simple when a UI needs packaged form state, warnings,
 * validated field paths, and pending status side by side.
 *
 * @template TModel Form model represented by the derived signals.
 */
export type NgxFormFeedbackSignals<TModel = unknown> = {
  formState: Signal<NgxFormState<TModel>>;
  warnings: Signal<Record<string, string[]>>;
  validatedFields: Signal<readonly string[]>;
  pending: Signal<boolean>;
};

/**
 * Converts `fieldWarnings` entries from the form directive into a plain record.
 *
 * This is useful when warnings need to be passed to presentational components
 * or serialized for debugging views.
 *
 * @param warningEntries Warning messages keyed by field path.
 * @returns A plain object whose keys are field paths and whose values are cloned
 *          warning message arrays.
 *
 * @example
 * ```typescript
 * const warnings = fieldWarningsToRecord(this.vestForm().fieldWarnings());
 * // { username: ['Consider a longer username'] }
 * ```
 */
export function fieldWarningsToRecord(
  warningEntries: ReadonlyMap<string, readonly string[]>
): Record<string, string[]> {
  const warnings: Record<string, string[]> = {};

  for (const [field, messages] of warningEntries.entries()) {
    warnings[field] = [...messages];
  }

  return warnings;
}

/**
 * Creates a safe fallback {@link NgxFormState} with default values.
 *
 * This utility is helpful when you need to provide a fallback for components
 * that require a non-null packaged form state, such as when a child form,
 * view query, or lazily rendered presenter is not initialized yet.
 *
 * @template TModel The type of the form model/value
 * @returns A complete form state with `valid: true`, empty errors, and `null`
 *          value.
 *
 * @example
 * ```typescript
 * // In a parent component that reads a child form lazily
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
 * // { valid: true, errors: {}, value: null }
 * ```
 */
export function createEmptyFormState<TModel = unknown>(): NgxFormState<TModel> {
  return {
    value: null,
    errors: {},
    valid: true,
  };
}

/**
 * Creates the common derived signals that presenter components typically expose
 * from a `FormDirective` reference.
 *
 * This keeps form body components small and avoids repeating the same computed
 * wrappers for form state, warnings, validated fields, and pending status.
 *
 * When `sourceSignal()` is `undefined`, the returned signals stay safe by
 * falling back to `createEmptyFormState()`, an empty warnings record, an empty
 * validated-field list, and `false` for pending status.
 *
 * @param sourceSignal Signal that resolves to the active form feedback source.
 * @param options Optional override for `formState` when a consumer needs to
 *                augment or replace the packaged state.
 * @returns A stable bundle of computed signals for packaged form feedback.
 *
 * @example
 * ```typescript
 * protected readonly vestForm = viewChild(FormDirective<MyFormModel>);
 *
 * protected readonly feedback = createFormFeedbackSignals(this.vestForm);
 * protected readonly formState = this.feedback.formState;
 * protected readonly warnings = this.feedback.warnings;
 * protected readonly pending = this.feedback.pending;
 * ```
 *
 * @example
 * ```typescript
 * // Override packaged state when combining library form state with schema errors
 * protected readonly feedback = createFormFeedbackSignals(this.vestForm, {
 *   formState: computed(() => this.schemaFormState() ?? this.vestForm()?.formState()),
 * });
 * ```
 */
export function createFormFeedbackSignals<TModel = unknown>(
  sourceSignal: Signal<NgxFormFeedbackSource<TModel> | undefined>,
  options: {
    formState?: Signal<NgxFormState<TModel> | null | undefined>;
  } = {}
): NgxFormFeedbackSignals<TModel> {
  const formState = computed(() => {
    const overriddenState = options.formState?.();
    if (overriddenState) {
      return overriddenState;
    }

    return sourceSignal()?.formState() ?? createEmptyFormState<TModel>();
  });

  return {
    formState,
    warnings: computed(() =>
      fieldWarningsToRecord(sourceSignal()?.fieldWarnings() ?? new Map())
    ),
    validatedFields: computed(
      () => sourceSignal()?.touchedFieldPaths() ?? []
    ),
    pending: computed(() => sourceSignal()?.pending() ?? false),
  };
}
