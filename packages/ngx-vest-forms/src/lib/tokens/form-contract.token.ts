import {
  InjectionToken,
  isSignal,
  type Provider,
  type Signal,
} from '@angular/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { NgxDeepRequired } from '../utils/deep-required';

/**
 * The shape contract that governs form validation and shape-mismatch warnings.
 * Accepts either a Standard Schema (`StandardSchemaV1`) or a plain
 * `NgxDeepRequired<T>` object literal that mirrors the form model structure.
 */
export type NgxFormContract<T> = StandardSchemaV1<T> | NgxDeepRequired<T>;

/**
 * The value accepted by `[formContract]` and `provideFormContract`.
 * Can be a static contract, a signal that emits a contract (or `null` to
 * temporarily disable shape checking), or `null` to opt out entirely.
 */
export type NgxFormContractSource<T> =
  | NgxFormContract<T>
  | Signal<NgxFormContract<T> | null>
  | null;

/**
 * Injection token used to provide a {@link NgxFormContractSource} at any
 * level of the Angular injector hierarchy. Consumed by `FormDirective` as a
 * fallback when no `[formContract]` input is bound on the host element.
 *
 * Prefer the `provideFormContract` or `provideFormContractFactory` helpers
 * over constructing the provider manually.
 */
export const NGX_FORM_CONTRACT = new InjectionToken<
  NgxFormContractSource<unknown>
>('NGX_FORM_CONTRACT');

/**
 * Registers a static (or signal-based) form contract via the DI system so
 * that all `FormDirective` instances within the injector scope pick it up
 * automatically — without needing a `[formContract]` binding on each element.
 *
 * @example
 * ```ts
 * providers: [provideFormContract(mySchema)]
 * providers: [provideFormContract(myContractSignal)]
 * ```
 */
export function provideFormContract<T>(
  contract: NgxFormContractSource<T>
): Provider {
  return {
    provide: NGX_FORM_CONTRACT,
    useValue: contract as NgxFormContractSource<unknown>,
  };
}

/**
 * Registers a factory function that produces the form contract via the DI
 * system. Use this variant when the contract depends on other injected
 * services or needs to be constructed lazily.
 *
 * @example
 * ```ts
 * providers: [provideFormContractFactory(() => inject(MySchemaService).schema)]
 * ```
 */
export function provideFormContractFactory<T>(
  factory: () => NgxFormContractSource<T>
): Provider {
  return {
    provide: NGX_FORM_CONTRACT,
    useFactory: factory as () => NgxFormContractSource<unknown>,
  };
}

/**
 * Resolves a {@link NgxFormContractSource} to its current contract value,
 * unwrapping signals where necessary.
 *
 * @internal — Not intended for use outside of `ngx-vest-forms` internals.
 */
export function readFormContract<T>(
  contract: NgxFormContractSource<T> | undefined
): NgxFormContract<T> | null {
  if (contract && isSignal(contract)) {
    return contract() as NgxFormContract<T> | null;
  }

  return contract ?? null;
}
