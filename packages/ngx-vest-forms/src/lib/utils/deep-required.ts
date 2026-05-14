// Helper types adapted from ts-essentials (MIT, https://github.com/ts-essentials/ts-essentials).
// Inlined to avoid a runtime dependency. See https://www.npmjs.com/package/ts-essentials.
/* eslint-disable @typescript-eslint/no-unsafe-function-type, @typescript-eslint/no-empty-object-type, @typescript-eslint/array-type */
type _Primitive = string | number | boolean | bigint | symbol | undefined | null;
type _Builtin = _Primitive | Function | Date | Error | RegExp;
type _IsNever<T> = [T] extends [never] ? true : false;
// Returns T when T is a tuple type, never for plain arrays.
type _IsTuple<T> = T extends ReadonlyArray<infer U>
  ? Array<U> extends T
    ? _IsNever<keyof T & `${number}`> extends true
      ? never
      : T
    : T
  : never;

/**
 * Makes every property required recursively, including nested objects and arrays.
 * Treats Date, Function, RegExp, Error, and primitives as opaque leaf types (no recursion).
 * Handles Map, Set, WeakMap, WeakSet, Promise, and tuples correctly.
 *
 * Adapted from ts-essentials `DeepRequired` (MIT License).
 * @see https://github.com/ts-essentials/ts-essentials
 *
 * @deprecated Use `DeepRequired` from `ts-essentials` instead.
 * `npm install ts-essentials` then `import { DeepRequired } from 'ts-essentials'`.
 * This export will be removed in a future major version.
 *
 * @template T The type to make deeply required
 */
export type NgxDeepRequired<T> = T extends Error
  ? Required<T>
  : T extends _Builtin
  ? T
  : T extends Map<infer K, infer V>
  ? Map<NgxDeepRequired<K>, NgxDeepRequired<V>>
  : T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<NgxDeepRequired<K>, NgxDeepRequired<V>>
  : T extends WeakMap<infer K, infer V>
  ? WeakMap<NgxDeepRequired<K>, NgxDeepRequired<V>>
  : T extends Set<infer U>
  ? Set<NgxDeepRequired<U>>
  : T extends ReadonlySet<infer U>
  ? ReadonlySet<NgxDeepRequired<U>>
  : T extends WeakSet<infer U>
  ? WeakSet<NgxDeepRequired<U>>
  : T extends Promise<infer U>
  ? Promise<NgxDeepRequired<U>>
  : T extends ReadonlyArray<infer U>
  ? _IsNever<_IsTuple<T>> extends false
    ? { [K in keyof T]-?: NgxDeepRequired<T[K]> }
    : T extends Array<U>
    ? Array<Exclude<NgxDeepRequired<U>, undefined>>
    : ReadonlyArray<Exclude<NgxDeepRequired<U>, undefined>>
  : T extends {}
  ? { [K in keyof T]-?: NgxDeepRequired<T[K]> }
  : Required<T>;
