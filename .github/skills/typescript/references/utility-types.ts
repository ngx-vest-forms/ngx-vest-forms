/**
 * TypeScript Utility Types Library
 *
 * Copy-paste collection of commonly needed utility types.
 * Requires TypeScript 5.0+.
 */

// =============================================================================
// BRANDED TYPES — Nominal types from structural ones
// =============================================================================

/** Create a branded (nominal) type to prevent primitive mixing. */
export type Brand<K, T> = K & { readonly __brand: T };

// Common branded type aliases
export type UserId = Brand<string, 'UserId'>;
export type Email = Brand<string, 'Email'>;
export type UUID = Brand<string, 'UUID'>;
export type Timestamp = Brand<number, 'Timestamp'>;
export type PositiveNumber = Brand<number, 'PositiveNumber'>;

// =============================================================================
// RESULT TYPE — Type-safe error handling without exceptions
// =============================================================================

export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// =============================================================================
// OPTION TYPE — Explicit nullability
// =============================================================================

export type Option<T> = Some<T> | None;
export type Some<T> = { readonly type: 'some'; readonly value: T };
export type None = { readonly type: 'none' };

export const some = <T>(value: T): Some<T> => ({ type: 'some', value });
export const none: None = { type: 'none' };

// =============================================================================
// DEEP UTILITIES — Recursive modifiers
// =============================================================================

/** Deeply readonly — preserves functions as-is. */
export type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

/** Deeply optional. */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/** Deeply required. */
export type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

/** Deeply mutable (remove readonly). */
export type DeepMutable<T> = T extends object
  ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
  : T;

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/** Keys of T whose values extend V. */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/** Pick properties whose value extends V. */
export type PickByType<T, V> = Pick<T, KeysOfType<T, V>>;

/** Omit properties whose value extends V. */
export type OmitByType<T, V> = Omit<T, KeysOfType<T, V>>;

/** Make specific keys optional. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific keys required. */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Make specific keys readonly. */
export type ReadonlyBy<T, K extends keyof T> = Omit<T, K> & Readonly<Pick<T, K>>;

/** Merge two types (U overrides T). */
export type Merge<T, U> = Omit<T, keyof U> & U;

/** Distributive Omit — works correctly with union types. */
export type DistributiveOmit<T, K extends PropertyKey> =
  T extends any ? Omit<T, K> : never;

/** Distributive Pick — works correctly with union types. */
export type DistributivePick<T, K extends PropertyKey> =
  T extends any ? Pick<T, Extract<K, keyof T>> : never;

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/** Element type of an array or tuple. */
export type ElementOf<T> = T extends ReadonlyArray<infer E> ? E : never;

/** Non-empty array — guaranteed at least one element. */
export type NonEmptyArray<T> = [T, ...T[]];

/** Tuple of exactly N elements of type T. */
export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> =
  R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;

// =============================================================================
// FUNCTION UTILITIES
// =============================================================================

/** Get function argument types as tuple. */
export type Arguments<T> = T extends (...args: infer A) => any ? A : never;

/** Get the first argument type. */
export type FirstArgument<T> = T extends (first: infer F, ...args: any[]) => any
  ? F
  : never;

/** Wrap a function's return type in Promise. */
export type Promisify<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<Awaited<R>>
  : never;

// =============================================================================
// STRING UTILITIES — Template literal type helpers
// =============================================================================

/** Split string S by delimiter D into tuple. */
export type Split<S extends string, D extends string> =
  S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

/** Join string tuple with delimiter. */
export type Join<T extends readonly string[], D extends string> =
  T extends readonly []
    ? ''
    : T extends readonly [infer F extends string]
      ? F
      : T extends readonly [infer F extends string, ...infer R extends string[]]
        ? `${F}${D}${Join<R, D>}`
        : never;

/** Dot-notation paths of an object type. */
export type PathOf<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object
    ? K | `${K}.${PathOf<T[K]>}`
    : K
  : never;

// =============================================================================
// UNION UTILITIES
// =============================================================================

/** Convert union to intersection: A | B → A & B. */
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/** All values of an object type as a union. */
export type ValueOf<T> = T[keyof T];

/** Last element of a union. */
export type UnionLast<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends () => infer R
  ? R
  : never;

/** Convert union to tuple (order not guaranteed). */
export type UnionToTuple<T, L = UnionLast<T>> = [T] extends [never]
  ? []
  : [...UnionToTuple<Exclude<T, L>>, L];

// =============================================================================
// TYPE TESTING — Compile-time assertions
// =============================================================================

/** Assert two types are equal. */
export type AssertEqual<T, U> =
  (<V>() => V extends T ? 1 : 2) extends (<V>() => V extends U ? 1 : 2)
    ? true
    : false;

/** Check if T is never. */
export type IsNever<T> = [T] extends [never] ? true : false;

/** Check if T is any. */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/** Check if T is unknown. */
export type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T
    ? true
    : false;

// =============================================================================
// JSON UTILITIES — Serialization-safe types
// =============================================================================

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/** Transform a type to its JSON-serializable equivalent. */
export type Jsonify<T> = T extends JsonPrimitive
  ? T
  : T extends undefined | ((...args: any[]) => any) | symbol
    ? never
    : T extends { toJSON(): infer R }
      ? R
      : T extends object
        ? { [K in keyof T]: Jsonify<T[K]> }
        : never;

// =============================================================================
// EXHAUSTIVE CHECK — Ensure all union cases are handled
// =============================================================================

/** Throws at runtime if called — use in default/else to catch unhandled cases. */
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unhandled value: ${JSON.stringify(value)}`);
}

/** Non-throwing exhaustive check. */
export function exhaustiveCheck(_value: never): void {
  // Intentionally empty — compile-time only guard
}
