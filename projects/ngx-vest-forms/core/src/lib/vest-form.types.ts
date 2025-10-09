/**
 * Core type definitions for ngx-vest-forms V2
 * Framework-agnostic validation types built on Vest.js
 */

import type {
  EnvironmentProviders,
  Signal,
  WritableSignal,
} from '@angular/core';
import type { PathValue, Paths as TsEssentialsPath } from 'ts-essentials';
import type { SuiteResult } from 'vest';
import type { EnhancedVestFormArray } from './form-arrays';
import type {
  DerivedFieldMethodAccessors,
  DerivedFieldSignalAccessors,
} from './utils/derived-field.types';

// Re-export path type utilities from ts-essentials for better type safety
export type { Paths as Path, PathValue } from 'ts-essentials';

type Path<TModel extends Record<string, unknown>> = TsEssentialsPath<TModel>;

/**
 * Represents a Vest suite (either create or staticSuite) with generic model typing
 */
export type VestSuite<
  TModel extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Run validation with data and optional field */
  (data?: TModel, field?: Path<TModel>): SuiteResult<string, string>;

  /** Subscribe to validation changes (only for create suites) */
  subscribe?: (
    callback: (result: SuiteResult<string, string>) => void,
  ) => () => void;

  /** Get current result (only for create suites) */
  get?: () => SuiteResult<string, string>;

  /** Reset the suite state (only for create suites) */
  reset?: () => void;

  /** Reset a specific field (only for create suites) */
  resetField?: (fieldName: Path<TModel>) => void;
};

/**
 * Error display strategies determining when validation errors are shown to users
/**
 * Error display strategies determining when validation errors are shown to users
 *
 * - `immediate`: Show errors as soon as they exist (no delay)
 * - `on-touch`: Show errors after field has been touched/blurred (WCAG recommended)
 * - `on-submit`: Show errors only after form submission attempt
 * - `manual`: No automatic error display (use `showErrors()` signal manually)
 *
 * @example
 * ```typescript
 * /// Accessible UX (recommended)
 * const form = createVestForm(model, { suite: userValidations, errorStrategy: 'on-touch' });
 *
 * /// Immediate feedback
 * const form = createVestForm(model, { suite: userValidations, errorStrategy: 'immediate' });
 * ```
 */
export type ErrorDisplayStrategy =
  | 'immediate'
  | 'on-touch'
  | 'on-submit'
  | 'manual';

/**
 * Configuration options for creating a VestForm instance
 */
export type VestFormOptions<
  TModel extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Vest validation suite (required) */
  suite: VestSuite<TModel>;

  /** Strategy for when to display validation errors (can be static or reactive signal) */
  errorStrategy?: ErrorDisplayStrategy | Signal<ErrorDisplayStrategy>;

  /** Whether to enable Enhanced Field Signals API (default: true) */
  enhancedFieldSignals?: boolean;

  /** Fields to include in Enhanced Field Signals API (default: all) */
  includeFields?: string[];

  /** Fields to exclude from Enhanced Field Signals API */
  excludeFields?: string[];

  /**
   * Optional Standard Schema for type/structure validation (runs before Vest suite)
   * Supports any Standard Schema v1 compatible library (Zod, Valibot, ArkType, etc.)
   * @see https://standardschema.dev/
   */
  schema?: StandardSchema<TModel>;

  /** Custom debounce time for validation in milliseconds */
  debounceMs?: number;
};

/**
 * Standard Schema v1 compatible type
 * Represents any validation schema that implements the StandardSchemaV1 interface
 */
export type StandardSchema<T = unknown> = {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
    ) =>
      | { readonly value: T; readonly issues?: undefined }
      | { readonly issues: readonly SchemaIssue[] }
      | Promise<
          | { readonly value: T; readonly issues?: undefined }
          | { readonly issues: readonly SchemaIssue[] }
        >;
    readonly types?: { readonly input: T; readonly output: T } | undefined;
  };
};

/**
 * Standard Schema issue format
 */
export type SchemaIssue = {
  readonly message: string;
  readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[];
};

/**
 * Structured validation error with machine-readable kind property
 *
 * @remarks
 * Provides a structured format for errors that enables:
 * - Better error handling and debugging
 * - Internationalization (i18n) support
 * - Type-safe error checking
 *
 * Aligns with Angular Signal Forms ValidationError format.
 */
export type StructuredValidationError = {
  /** Error type/kind (e.g., 'required', 'email', 'minLength', 'custom') */
  readonly kind: string;

  /** Human-readable error message */
  readonly message: string;

  /** Optional parameters associated with the validation (e.g., { min: 18 } for minLength) */
  readonly params?: Record<string, unknown>;
};

/**
 * Validation messages grouped by severity
 *
 * @remarks
 * Separates blocking errors from non-blocking warnings to enable
 * proper ARIA live region semantics per WCAG ARIA19/ARIA22.
 */
export type ValidationMessages = {
  /** Blocking errors that prevent form submission */
  errors: string[];

  /** Non-blocking warnings for user guidance (from Vest warn() tests) */
  warnings: string[];

  /**
   * Structured errors with machine-readable kind property (optional)
   *
   * @remarks
   * Provides additional metadata for better error handling and i18n.
   * When available, corresponds 1:1 with the `errors` array.
   */
  structuredErrors?: readonly StructuredValidationError[];

  /**
   * Structured warnings with machine-readable kind property (optional)
   *
   * @remarks
   * Provides additional metadata for better warning handling and i18n.
   * When available, corresponds 1:1 with the `warnings` array.
   */
  structuredWarnings?: readonly StructuredValidationError[];
};

/**
 * Form submission status
 *
 * @remarks
 * Consolidates `submitting()` and `hasSubmitted()` into a single signal
 * compatible with Angular Signal Forms API.
 *
 * - `unsubmitted`: Form has never been submitted
 * - `submitting`: Form submission is in progress
 * - `submitted`: Form has been submitted (regardless of success/failure)
 */
export type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';

/**
 * Result of form submission.
 *
 * @remarks
 * Always returns a result object with valid flag instead of throwing.
 * This provides a clearer contract and better error handling patterns.
 *
 * @example
 * ```typescript
 * async save() {
 *   const result = await form.submit();
 *   if (result.valid) {
 *     await this.api.save(result.data);
 *   } else {
 *     console.log('Errors:', result.errors);
 *   }
 * }
 * ```
 */
export type SubmitResult<TModel> = {
  /** Whether the form is valid and submission can proceed */
  valid: boolean;

  /** Form data (always present, even if invalid) */
  data: TModel;

  /** All validation errors by field path */
  errors: Record<string, string[]>;
};

/**
 * Individual field interface providing all field-level operations and state
 */
export type VestField<T = unknown> = {
  /** Current field value as a signal */
  value: Signal<T>;

  /** Whether the field is valid (no blocking errors) */
  valid: Signal<boolean>;

  /**
   * Whether the field is invalid (has errors, regardless of pending state)
   *
   * @remarks
   * Note: `invalid()` is NOT the same as `!valid()`
   * - `invalid()` is `true` when there are errors, regardless of pending validators
   * - `valid()` is `true` only when there are no errors AND no pending validators
   *
   * Example: If a field has 2 validators with no errors and 1 pending async validator:
   * - `invalid()` = `false` (no errors yet)
   * - `valid()` = `false` (async validation pending)
   *
   * This aligns with Angular Signal Forms behavior.
   */
  invalid: Signal<boolean>;

  /**
   * Whether the field value has been changed by the user
   *
   * @remarks
   * A field becomes dirty when its value differs from the initial value.
   * This is different from `touched()` which only tracks focus/blur events.
   */
  dirty: Signal<boolean>;

  /** Validation messages with errors and warnings */
  validation: Signal<ValidationMessages>;

  /** Whether async validation is pending */
  pending: Signal<boolean>;

  /** Whether the field has been tested (touched) */
  touched: Signal<boolean>;

  /** Whether errors should be displayed based on error strategy */
  showErrors: Signal<boolean>;

  /** Whether warnings should be displayed (typically always true) */
  showWarnings: Signal<boolean>;

  /** Field path/name for identification and ARIA IDs */
  readonly fieldName: string;

  /** Set field value and trigger validation */
  set(value: T | Event): void;

  /**
   * Mark field as touched without changing value
   * Aligns with Angular Forms API (markAsTouched)
   */
  markAsTouched(): void;

  /**
   * Mark field as dirty programmatically
   * Useful for custom validation scenarios
   */
  markAsDirty(): void;

  /** Reset field to initial value and clear touched state */
  reset(): void;
};

/**
 * Form array interface for managing dynamic collections
 */
export type VestFormArray<T = unknown> = {
  /** Array items as signals */
  items: Signal<T[]>;

  /** Array length */
  length: Signal<number>;

  /** Whether the entire array is valid */
  valid: Signal<boolean>;

  /** Validation errors for the array */
  errors: Signal<string[]>;

  /** Add new item to the array */
  push(item: T): void;

  /** Remove item at index */
  remove(index: number): void;

  /** Move item from one index to another */
  move(fromIndex: number, toIndex: number): void;

  /** Insert item at specific index */
  insert(index: number, item: T): void;

  /** Get field access for specific array item */
  at(index: number): VestField<T>;

  /** Reset array to initial state */
  reset(): void;
};

/**
 * Main VestForm interface providing form-level operations and field access
 */
export type VestForm<
  TModel extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Form model as a writable signal */
  model: WritableSignal<TModel>;

  /** Current Vest suite result */
  result: Signal<SuiteResult<string, string>>;

  /** Whether the entire form is valid */
  valid: Signal<boolean>;

  /**
   * Whether the form is invalid (has any errors, regardless of pending state)
   *
   * @remarks
   * Note: `invalid()` is NOT the same as `!valid()`
   * - `invalid()` is `true` when ANY field has errors, regardless of pending validators
   * - `valid()` is `true` only when NO fields have errors AND no pending validators
   *
   * This aligns with Angular Signal Forms behavior.
   */
  invalid: Signal<boolean>;

  /**
   * Whether any field in the form has been modified by the user
   *
   * @remarks
   * The form becomes dirty when any field value differs from its initial value.
   */
  dirty: Signal<boolean>;

  /** Whether any async validation is pending */
  pending: Signal<boolean>;

  /** All form errors grouped by field (from Vest, regardless of display strategy) */
  errors: Signal<Record<string, string[]>>;

  /**
   * Errors that should be visible based on the error display strategy.
   * Only includes errors for fields where showErrors() returns true.
   * Useful for error summaries, debuggers, and form-level error displays.
   */
  visibleErrors: Signal<Record<string, string[]>>;

  /** Form submission state */
  submitting: Signal<boolean>;

  /**
   * Form submission status (Angular Signal Forms compatible)
   *
   * @remarks
   * Consolidates submission state into a single signal with 3 states.
   *
   * - Returns `'unsubmitted'` when form has never been submitted
   * - Returns `'submitting'` during async submit operation
   * - Returns `'submitted'` after form has been submitted (regardless of success/failure)
   */
  submittedStatus: Signal<SubmittedStatus>;

  /** Schema validation errors (Layer 1 - all errors, unfiltered) */
  schemaErrors: Signal<Record<string, string[]>>;

  /**
   * Schema errors that should be visible based on the error display strategy.
   * Only includes schema errors for fields that should show errors based on
   * touch state, submit state, and the current errorStrategy.
   *
   * Ensures schema validation errors (Layer 1) behave consistently with
   * Vest validation errors (Layer 2) in terms of display timing.
   */
  visibleSchemaErrors: Signal<Record<string, string[]>>;

  /**
   * Error display strategy (can be static or reactive signal).
   * Controls when validation errors are shown to users.
   * - 'immediate': Show errors as soon as they exist
   * - 'on-touch': Show errors after field is touched/blurred (default)
   * - 'on-submit': Show errors only after form submission
   * - 'manual': Full manual control via custom logic
   */
  errorStrategy: ErrorDisplayStrategy | Signal<ErrorDisplayStrategy>;

  /**
   * Resolve field path from camelCase accessor name.
   * Used internally by auto-touch directive to map HTML id attributes to field paths.
   *
   * @param camelCaseName - CamelCase field accessor (e.g., "personalInfoFirstName", "email")
   * @returns The original field path (e.g., "personalInfo.firstName", "email") or null if not found
   *
   * @example
   * ```typescript
   * form.resolveFieldPath("personalInfoFirstName") // → "personalInfo.firstName"
   * form.resolveFieldPath("email") // → "email"
   * form.resolveFieldPath("unknown") // → null
   * ```
   */
  resolveFieldPath?(camelCaseName: string): string | null;

  /** Get field access for a specific path with proper typing */
  field<P extends Path<TModel>>(path: P): VestField<PathValue<TModel, P>>;

  /** Get array access for a specific path */
  array<P extends Path<TModel>>(path: P): EnhancedVestFormArray;

  /** Validate specific field or entire form */
  validate<P extends Path<TModel>>(fieldPath?: P): void;

  /** Submit form (runs full validation first) and returns result */
  submit(): Promise<SubmitResult<TModel>>;

  /** Reset form to initial state */
  reset(): void;

  /** Reset specific field */
  resetField<P extends Path<TModel>>(path: P): void;

  /** Dispose of the form (cleanup subscriptions) */
  dispose(): void;

  /** Environment providers for making the form injectable in templates */
  providers: EnvironmentProviders;
};

/**
 * Enhanced Field Signals API - automatically generated via Proxy
 * Provides convenient access to field operations without explicit field() calls
 */
export type EnhancedVestForm<TModel extends Record<string, unknown>> =
  VestForm<TModel> &
    DerivedFieldSignalAccessors<TModel> &
    DerivedFieldMethodAccessors<TModel>;
