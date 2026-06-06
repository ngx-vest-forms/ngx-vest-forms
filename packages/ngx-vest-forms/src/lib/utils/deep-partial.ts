// Helper types adapted from ts-essentials (MIT, https://github.com/ts-essentials/ts-essentials).
// Inlined to avoid a runtime dependency. See https://www.npmjs.com/package/ts-essentials.
/* eslint-disable @typescript-eslint/no-unsafe-function-type, @typescript-eslint/no-empty-object-type */
type _IsAny<T> = 0 extends 1 & T ? true : false;
type _IsUnknown<T> = _IsAny<T> extends true ? false : unknown extends T ? true : false;
type _Primitive = string | number | boolean | bigint | symbol | undefined | null;
type _Builtin = _Primitive | Function | Date | Error | RegExp;

/**
 * Makes every property optional recursively, including nested objects.
 * Template-driven forms are deep partial because they are built incrementally by the DOM.
 *
 * Array element types remain concrete (not widened with `| undefined`) so that
 * arrays of model objects stay strongly typed as they build up incrementally.
 * Handles Map, Set, WeakMap, WeakSet, and Promise correctly.
 *
 * Adapted from ts-essentials `DeepPartial` (MIT License).
 * @see https://github.com/ts-essentials/ts-essentials
 *
 * Fully supported and the canonical form-model type for ngx-vest-forms
 * (see the library's instruction sheet and migration guide). It is rebuilt on
 * the same patterns as `ts-essentials`' `DeepPartial`, so if you already depend
 * on `ts-essentials` you may prefer its `DeepPartial` to avoid a near-duplicate
 * type — but doing so is optional, not required.
 *
 * @template T The type to make deeply partial
 */
export type NgxDeepPartial<T> = T extends Exclude<_Builtin, Error>
  ? T
  : T extends Map<infer K, infer V>
  ? Map<NgxDeepPartial<K>, NgxDeepPartial<V>>
  : T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<NgxDeepPartial<K>, NgxDeepPartial<V>>
  : T extends WeakMap<infer K, infer V>
  ? WeakMap<NgxDeepPartial<K>, NgxDeepPartial<V>>
  : T extends Set<infer U>
  ? Set<NgxDeepPartial<U>>
  : T extends ReadonlySet<infer U>
  ? ReadonlySet<NgxDeepPartial<U>>
  : T extends WeakSet<infer U>
  ? WeakSet<NgxDeepPartial<U>>
  : T extends Promise<infer U>
  ? Promise<NgxDeepPartial<U>>
  // Explicit array handling keeps element types concrete (no `| undefined` on elements).
  // ts-essentials' `extends {}` fallback would produce `(T | undefined)[]` instead.
  : T extends Array<infer U>
  ? Array<NgxDeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<NgxDeepPartial<U>>
  // Index-signature types (e.g. Record<string, V>) are returned as-is.
  // Applying `?:` to an index signature widens values to `V | undefined`, which
  // breaks consumers that expect `Record<string, V>` (e.g. dynamic phone-number maps).
  : string extends keyof T
  ? T
  : number extends keyof T
  ? T
  : T extends {}
  ? { [K in keyof T]?: NgxDeepPartial<T[K]> }
  : _IsUnknown<T> extends true
  ? unknown
  : Partial<T>;
