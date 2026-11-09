import type { ValidationConfigMap } from '../utils/field-path-types';
import type { NgxSuiteFocusSpec } from '../utils/vest-runner';

/**
 * Type for the `validationConfig` input: a typed {@link ValidationConfigMap}
 * (or `null` to disable cross-field revalidation).
 *
 * Since 3.0.0 the untyped `Record<string, string[]>` escape hatch is gone, so
 * typo'd field paths in a `[validationConfig]` binding fail to compile instead
 * of silently never triggering. Array items are addressed by index
 * (`'addresses.0.street'`, or `` `addresses.${i}.street` `` inline or
 * `as const`). Only path strings `FieldPath<T>` cannot express, such as
 * paths read from a server, need an explicit cast to `NgxValidationConfig<T>`.
 */
export type NgxValidationConfig<T = unknown> = ValidationConfigMap<T> | null;

export type NgxValidationFocus = NgxSuiteFocusSpec;

/**
 * Payload emitted when a named control inside the form loses focus.
 *
 * This is intentionally low-level so app code can build workflows such as
 * draft auto-save, analytics, or blur-driven side effects without the form
 * library taking ownership of persistence behavior.
 *
 * It is not intended as a blur-time workaround for dependent field validation;
 * for that pattern, prefer `validationConfig` plus each target field's own
 * `errorDisplayMode`.
 *
 * The emitted `field` is the full dotted control path (e.g.
 * `passwords.confirm`, `businessHours.values.0.from`) regardless of whether
 * the surrounding groups use static `ngModelGroup="key"` or dynamic
 * `[ngModelGroup]="expr"` bindings, because the path is read from the live
 * `NgModel` directive registered with the form.
 *
 * @publicApi
 */
export type NgxFieldBlurEvent<T = unknown> = {
  field: string;
  value: unknown;
  formValue: T | null;
  dirty: boolean;
  touched: boolean;
  valid: boolean;
  pending: boolean;
};

/**
 * Payload of the `submitSettled` output: the outcome of one submit, read
 * after every validator (async Vest tests and submit-mode root validation
 * included) has finished.
 *
 * @publicApi
 */
export type NgxSubmitSettledEvent<T = unknown> = {
  /** `true` when the form was VALID once validation settled. */
  valid: boolean;
  /** The merged form value (disabled controls included) at that moment. */
  value: T | null;
  /** Blocking errors keyed by field path, as `errorsChange` reports them. */
  errors: Record<string, string[]>;
};
