/**
 * Core type definitions for ngx-vest-forms V2
 * Framework-agnostic validation types built on Vest.js
 */

import type { Signal, WritableSignal } from '@angular/core';
import type { SuiteResult } from 'vest';

// Re-export path type utilities from ts-essentials for better type safety
export type { Paths as Path, PathValue } from 'ts-essentials';

/**
 * Represents a Vest suite (either create or staticSuite)
 */
export type VestSuite = {
  /** Run validation with data and optional field */
  (data?: unknown, field?: string): SuiteResult<string, string>;

  /** Subscribe to validation changes (only for create suites) */
  subscribe?: (
    callback: (result: SuiteResult<string, string>) => void,
  ) => () => void;

  /** Get current result (only for create suites) */
  get?: () => SuiteResult<string, string>;

  /** Reset the suite state (only for create suites) */
  reset?: () => void;

  /** Reset a specific field (only for create suites) */
  resetField?: (fieldName: string) => void;
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

  /** Get field access for a specific path */
  field<K extends keyof TModel>(path: K): VestField<TModel[K]>;
  field(path: string): VestField<unknown>;

  /** Get array access for a specific path */
  array(path: string): VestFormArray;

  /** Validate specific field or entire form */
  validate(fieldPath?: string): void;

  /** Submit form (runs full validation first) */
  submit(): Promise<TModel>;

  /** Reset form to initial state */
  reset(): void;

  /** Reset specific field */
  resetField(path: string): void;

  /** Dispose of the form (cleanup subscriptions) */
  dispose(): void;
};

/**
 * Enhanced Field Signals API - automatically generated via Proxy
 * Provides convenient access to field operations without explicit field() calls
 */
export type EnhancedVestForm<TModel extends Record<string, unknown>> =
  VestForm<TModel> & {
    // For each field K in TModel, generate:
    // - K(): Signal<TModel[K]>                    // field value
    // - `${K}Valid`(): Signal<boolean>           // field validity
    // - `${K}Errors`(): Signal<string[]>        // field errors
    // - `${K}Pending`(): Signal<boolean>        // field pending state
    // - `${K}Touched`(): Signal<boolean>        // field touched state
    // - `${K}ShowErrors`(): Signal<boolean>     // should show errors
    // - `set${Capitalize<K>}`(value): void      // set field value
    // - `touch${Capitalize<K>}`(): void         // touch field
    // - `reset${Capitalize<K>}`(): void         // reset field
  } & {
    [K in keyof TModel as K extends string ? K : never]: Signal<TModel[K]>;
  } & {
    [K in keyof TModel as K extends string
      ? `${K}Valid`
      : never]: Signal<boolean>;
  } & {
    [K in keyof TModel as K extends string ? `${K}Errors` : never]: Signal<
      string[]
    >;
  } & {
    [K in keyof TModel as K extends string
      ? `${K}Pending`
      : never]: Signal<boolean>;
  } & {
    [K in keyof TModel as K extends string
      ? `${K}Touched`
      : never]: Signal<boolean>;
  } & {
    [K in keyof TModel as K extends string
      ? `${K}ShowErrors`
      : never]: Signal<boolean>;
  } & {
    [K in keyof TModel as K extends string
      ? `set${Capitalize<string & K>}`
      : never]: (value: TModel[K] | Event) => void;
  } & {
    [K in keyof TModel as K extends string
      ? `touch${Capitalize<string & K>}`
      : never]: () => void;
  } & {
    [K in keyof TModel as K extends string
      ? `reset${Capitalize<string & K>}`
      : never]: () => void;
  };

/**
 * Utility type to capitalize string literal types
 */
type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;
