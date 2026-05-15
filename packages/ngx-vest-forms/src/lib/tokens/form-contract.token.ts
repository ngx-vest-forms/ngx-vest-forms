import {
  InjectionToken,
  isSignal,
  type Provider,
  type Signal,
} from '@angular/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { NgxDeepRequired } from '../utils/deep-required';

export type NgxFormContract<T> = StandardSchemaV1<T> | NgxDeepRequired<T>;

export type NgxFormContractSource<T> =
  | NgxFormContract<T>
  | Signal<NgxFormContract<T> | null>
  | null;

export const NGX_FORM_CONTRACT = new InjectionToken<
  NgxFormContractSource<unknown>
>('NGX_FORM_CONTRACT');

export function provideFormContract<T>(
  contract: NgxFormContractSource<T>
): Provider {
  return {
    provide: NGX_FORM_CONTRACT,
    useValue: contract as NgxFormContractSource<unknown>,
  };
}

export function provideFormContractFactory<T>(
  factory: () => NgxFormContractSource<T>
): Provider {
  return {
    provide: NGX_FORM_CONTRACT,
    useFactory: factory as () => NgxFormContractSource<unknown>,
  };
}

export function readFormContract<T>(
  contract: NgxFormContractSource<T> | undefined
): NgxFormContract<T> | null {
  if (contract && isSignal(contract)) {
    return contract() as NgxFormContract<T> | null;
  }

  return contract ?? null;
}
