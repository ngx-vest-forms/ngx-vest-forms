/**
 * Type-safe utilities for working with Angular signals
 * @module type-helpers
 */

import type { Signal } from '@angular/core';
import { isSignal } from '@angular/core';

/**
 * Type guard to check if a value is a signal.
 *
 * Re-exports Angular's built-in `isSignal()` utility for convenience.
 * This is the official, robust way to detect signals in Angular.
 *
 * @template T - The signal value type
 * @param value - Value to check
 * @returns True if value is a signal, false otherwise
 *
 * @example
 * ```typescript
 * import { signal } from '@angular/core';
 *
 * const str = 'hello';
 * const sig = signal('hello');
 *
 * isSignal(str); // false
 * isSignal(sig); // true
 *
 * if (isSignal(value)) {
 *   // TypeScript knows value is Signal<T>
 *   const current = value();
 * }
 * ```
 *
 * @see https://angular.dev/api/core/isSignal
 */
export { isSignal } from '@angular/core';

/**
 * Unwrap Signal<T> to T, or return T if already unwrapped.
 * Uses ts-essentials pattern for type safety.
 *
 * @template T - The type to unwrap
 *
 * @example
 * ```typescript
 * type StringSignal = Signal<string>;
 * type UnwrappedString = Unwrap<StringSignal>; // string
 *
 * type PlainString = string;
 * type StillString = Unwrap<PlainString>; // string
 * ```
 */
export type Unwrap<T> = T extends Signal<infer U> ? U : T;

/**
 * Unwrap a signal value or return the value if it's not a signal.
 * Type-safe alternative to: `typeof x === 'function' ? x() : x`
 *
 * This helper provides a clean, type-safe way to work with values that
 * may or may not be signals, particularly useful when dealing with
 * options that accept both static values and signals.
 *
 * @template T - The value type
 * @param value - A signal or plain value
 * @returns The unwrapped value
 *
 * @example
 * ```typescript
 * import { signal } from '@angular/core';
 *
 * const staticValue = 'on-touch';
 * const signalValue = signal('on-touch');
 *
 * unwrapSignal(staticValue);  // 'on-touch'
 * unwrapSignal(signalValue);  // 'on-touch'
 * ```
 */
export function unwrapSignal<T>(value: T | Signal<T>): Unwrap<T | Signal<T>> {
  return (isSignal(value) ? (value as Signal<T>)() : value) as Unwrap<
    T | Signal<T>
  >;
}
