/**
 * Strongly typed helpers for the Enhanced Field Signals API.
 *
 * @remarks
 * The runtime proxy created in {@link createDerivedRegistry} exposes a rich set of
 * camelCase accessors (e.g. `form.profileName()`, `form.setProfileName(...)`). These
 * utilities mirror that naming contract at the type level so consumers get full
 * IntelliSense and compile-time safety without manually maintaining string unions.
 *
 * By deriving the accessor names from {@link Paths} we automatically support nested
 * properties (`address.city` -> `addressCity`) and array indices (`phones.0.type` ->
 * `phones0Type`). This approach mirrors the pattern used in ngrx-toolkit where maps of
 * mutations/call states are converted into strongly typed helper APIs.
 *
 * The exported mapped types are consumed by {@link EnhancedVestForm} so library users
 * only see the combined surface. Application code can also reuse these helpers when
 * authoring custom wrappers or test doubles.
 */

import type { Signal } from '@angular/core';
import type { PathValue, Paths as TsEssentialsPath } from 'ts-essentials';
import type { ValidationMessages, VestField } from '../vest-form.types';

/**
 * Minimal alias around {@link TsEssentialsPath} to keep local generics concise.
 */
type Path<TModel extends Record<string, unknown>> = TsEssentialsPath<TModel>;

type SplitPath<PathString extends string> =
  PathString extends `${infer Head}.${infer Tail}`
    ? [Head, ...SplitPath<Tail>]
    : PathString extends ''
      ? []
      : [PathString];

type CapitalizeSegment<Segment extends string> =
  Segment extends `${infer First}${infer Rest}`
    ? `${Uppercase<First>}${Rest}`
    : Segment;

type JoinCamelRest<Segments extends readonly string[]> = Segments extends []
  ? ''
  : Segments extends [infer Head, ...infer Tail]
    ? Head extends string
      ? Tail extends readonly string[]
        ? `${CapitalizeSegment<Head>}${JoinCamelRest<Tail>}`
        : never
      : never
    : never;

type JoinCamel<Segments extends readonly string[]> = Segments extends []
  ? ''
  : Segments extends [infer Head, ...infer Tail]
    ? Head extends string
      ? Tail extends readonly string[]
        ? `${Head}${JoinCamelRest<Tail>}`
        : never
      : never
    : never;

/**
 * Converts a dot-notation path (e.g. `profile.name`) to the camelCase accessor used by
 * the enhanced signals API (e.g. `profileName`).
 */
export type CamelCasePath<PathString extends string> = JoinCamel<
  SplitPath<PathString>
>;

type AppendSuffix<
  Base extends string,
  Suffix extends string,
> = Suffix extends '' ? Base : `${Base}${Suffix}`;

type BooleanAccessorSuffix =
  | 'Valid'
  | 'Pending'
  | 'Touched'
  | 'ShowErrors'
  | 'ShowWarnings';

type SetterPrefix = 'set';
type TouchPrefix = 'touch';
type ResetPrefix = 'reset';

type CapitalizeFirst<Value extends string> =
  Value extends `${infer First}${infer Rest}`
    ? `${Uppercase<First>}${Rest}`
    : Value;

type SetterName<Base extends string> =
  `${SetterPrefix}${CapitalizeFirst<Base>}`;

type TouchName<Base extends string> = `${TouchPrefix}${CapitalizeFirst<Base>}`;

type ResetName<Base extends string> = `${ResetPrefix}${CapitalizeFirst<Base>}`;

/**
 * Signal accessors exposing the live value for each field path.
 */
export type DerivedFieldValueSignals<TModel extends Record<string, unknown>> = {
  [P in Path<TModel> as CamelCasePath<P>]: Signal<PathValue<TModel, P>>;
};

/**
 * Signal accessors exposing derived boolean state (`valid`, `pending`, `touched`,
 * `showErrors`) for each field path. Mirrors the behaviour of the runtime proxy which
 * capitalises every segment after the first.
 */
export type DerivedFieldBooleanSignals<TModel extends Record<string, unknown>> =
  {
    [P in Path<TModel> as AppendSuffix<
      CamelCasePath<P>,
      BooleanAccessorSuffix
    >]: Signal<boolean>;
  };

/**
 * Signal accessors exposing the validation error messages for each field path.
 * @deprecated Use DerivedFieldValidationSignals for the modern nested approach
 */
export type DerivedFieldErrorSignals<TModel extends Record<string, unknown>> = {
  [P in Path<TModel> as AppendSuffix<CamelCasePath<P>, 'Errors'>]: Signal<
    string[]
  >;
};

/**
 * Signal accessor exposing nested validation messages (errors + warnings)
 * Example: form.emailValidation() → Signal<{ errors: string[], warnings: string[] }>
 */
export type DerivedFieldValidationSignals<
  TModel extends Record<string, unknown>,
> = {
  [P in Path<TModel> as AppendSuffix<
    CamelCasePath<P>,
    'Validation'
  >]: Signal<ValidationMessages>;
};

/**
 * Warning signal accessors
 * Example: form.emailWarnings() → Signal<string[]>
 */
export type DerivedFieldWarningSignals<TModel extends Record<string, unknown>> =
  {
    [P in Path<TModel> as AppendSuffix<CamelCasePath<P>, 'Warnings'>]: Signal<
      string[]
    >;
  };

/**
 * ShowWarnings boolean signal accessors
 * Example: form.emailShowWarnings() → Signal<boolean>
 */
export type DerivedFieldShowWarningSignals<
  TModel extends Record<string, unknown>,
> = {
  [P in Path<TModel> as AppendSuffix<
    CamelCasePath<P>,
    'ShowWarnings'
  >]: Signal<boolean>;
};

/**
 * VestField object accessors for zero-config component usage
 * Example: form.emailField() → VestField<string>
 *
 * This is the PRIMARY accessor for ngx-form-error component.
 */
export type DerivedFieldObjectAccessors<
  TModel extends Record<string, unknown>,
> = {
  [P in Path<TModel> as AppendSuffix<
    CamelCasePath<P>,
    'Field'
  >]: () => VestField<PathValue<TModel, P>>;
};

/**
 * Setter methods (e.g. `setProfileName`) that accept either the new value or an input
 * event. These signatures match {@link VestField.set} so they can be forwarded directly
 * to the underlying field implementation.
 */
export type DerivedFieldSetterMethods<TModel extends Record<string, unknown>> =
  {
    [P in Path<TModel> as SetterName<CamelCasePath<P>>]: (
      value: PathValue<TModel, P> | Event,
    ) => void;
  };

/**
 * Touch methods (e.g. `touchProfileName`) for marking a field as interacted with.
 */
export type DerivedFieldTouchMethods<TModel extends Record<string, unknown>> = {
  [P in Path<TModel> as TouchName<CamelCasePath<P>>]: () => void;
};

/**
 * Reset methods (e.g. `resetProfileName`) restoring the initial model value.
 */
export type DerivedFieldResetMethods<TModel extends Record<string, unknown>> = {
  [P in Path<TModel> as ResetName<CamelCasePath<P>>]: () => void;
};

/**
 * Convenience union of all derived signal accessors (values, booleans, errors, validation).
 */
export type DerivedFieldSignalAccessors<
  TModel extends Record<string, unknown>,
> = DerivedFieldValueSignals<TModel> &
  DerivedFieldBooleanSignals<TModel> &
  DerivedFieldValidationSignals<TModel> &
  DerivedFieldObjectAccessors<TModel> &
  DerivedFieldErrorSignals<TModel> &
  DerivedFieldWarningSignals<TModel> &
  DerivedFieldShowWarningSignals<TModel>;

/**
 * Convenience union of all derived field methods (set, touch, reset).
 */
export type DerivedFieldMethodAccessors<
  TModel extends Record<string, unknown>,
> = DerivedFieldSetterMethods<TModel> &
  DerivedFieldTouchMethods<TModel> &
  DerivedFieldResetMethods<TModel>;

/**
 * Combined shape representing the full enhanced API surface generated for every field
 * path. Consumers that want the entire set can reach for this single type.
 */
export type DerivedFieldEnhancements<TModel extends Record<string, unknown>> =
  DerivedFieldSignalAccessors<TModel> & DerivedFieldMethodAccessors<TModel>;
