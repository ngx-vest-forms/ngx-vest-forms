/**
 * Core type definitions for ngx-vest-forms V2
 * Framework-agnostic validation types built on Vest.js
 */

import type { Signal, WritableSignal } from '@angular/core';
import type { PathValue, Paths as TsEssentialsPath } from 'ts-essentials';
import type { SuiteResult } from 'vest';
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
 */
export type ErrorDisplayStrategy =
  | 'immediate'
  | 'on-touch'
  | 'on-submit'
  | 'manual';

/**
 * Configuration options for creating a VestForm instance
 */
export type VestFormOptions = {
  /** Strategy for when to display validation errors */
  errorStrategy?: ErrorDisplayStrategy;

  /** Whether to enable Enhanced Field Signals API (default: true) */
  enhancedFieldSignals?: boolean;

  /** Fields to include in Enhanced Field Signals API (default: all) */
  includeFields?: string[];

  /** Fields to exclude from Enhanced Field Signals API */
  excludeFields?: string[];

  /** Optional schema adapter for runtime validation */
  schema?: SchemaAdapter<unknown>;

  /** Custom debounce time for validation in milliseconds */
  debounceMs?: number;
};

/**
 * Schema adapter interface for integrating runtime schema validation
 */
export type SchemaAdapter<T> = {
  /** Validate data against the schema */
  validate(data: unknown): SchemaValidationResult<T>;

  /** Get TypeScript type information */
  getSchema(): unknown;
};

/**
 * Result of schema validation
 */
export type SchemaValidationResult<T> = {
  /** Whether validation passed */
  success: boolean;

  /** Validated data if successful */
  data?: T;

  /** Validation errors if failed */
  errors?: {
    path: string;
    message: string;
  }[];
};

/**
 * Individual field interface providing all field-level operations and state
 */
export type VestField<T = unknown> = {
  /** Current field value as a signal */
  value: Signal<T>;

  /** Whether the field is valid */
  valid: Signal<boolean>;

  /** Current validation errors */
  errors: Signal<string[]>;

  /** Whether async validation is pending */
  pending: Signal<boolean>;

  /** Whether the field has been tested (touched) */
  touched: Signal<boolean>;

  /** Whether errors should be displayed (based on strategy) */
  showErrors: Signal<boolean>;

  /** Set field value and trigger validation */
  set(value: T | Event): void;

  /** Mark field as touched without changing value */
  touch(): void;

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

  /** Whether any async validation is pending */
  pending: Signal<boolean>;

  /** All form errors grouped by field */
  errors: Signal<Record<string, string[]>>;

  /** Form submission state */
  submitting: Signal<boolean>;

  /** Whether the form has been submitted */
  hasSubmitted: Signal<boolean>;

  /** Get field access for a specific path with proper typing */
  field<P extends Path<TModel>>(path: P): VestField<PathValue<TModel, P>>;

  /** Get array access for a specific path */
  array<P extends Path<TModel>>(path: P): VestFormArray;

  /** Validate specific field or entire form */
  validate<P extends Path<TModel>>(fieldPath?: P): void;

  /** Submit form (runs full validation first) */
  submit(): Promise<TModel>;

  /** Reset form to initial state */
  reset(): void;

  /** Reset specific field */
  resetField<P extends Path<TModel>>(path: P): void;

  /** Dispose of the form (cleanup subscriptions) */
  dispose(): void;
};

/**
 * Enhanced Field Signals API - automatically generated via Proxy
 * Provides convenient access to field operations without explicit field() calls
 */
export type EnhancedVestForm<TModel extends Record<string, unknown>> =
  VestForm<TModel> &
    DerivedFieldSignalAccessors<TModel> &
    DerivedFieldMethodAccessors<TModel>;
