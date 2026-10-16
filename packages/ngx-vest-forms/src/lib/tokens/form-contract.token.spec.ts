import { Component, inject, Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  NGX_FORM_CONTRACT,
  type NgxFormContract,
  provideFormContract,
  provideFormContractFactory,
  readFormContract,
} from './form-contract.token';

type Model = { name: string };
const contract: NgxFormContract<Model> = { name: '' };

@Component({ template: '' })
class ContractConsumer {
  readonly contract = inject(NGX_FORM_CONTRACT, { optional: true });
}

function injectContract(providers: unknown[]): unknown {
  TestBed.configureTestingModule({
    providers: providers as never[],
  });
  return TestBed.createComponent(ContractConsumer).componentInstance.contract;
}

describe('NGX_FORM_CONTRACT', () => {
  it('has no default provider', () => {
    expect(injectContract([])).toBeNull();
  });
});

describe('provideFormContract', () => {
  it('provides a static contract by value', () => {
    expect(injectContract([provideFormContract(contract)])).toBe(contract);
  });

  it('provides a signal as-is (not unwrapped)', () => {
    const source = signal<NgxFormContract<Model> | null>(contract);
    expect(injectContract([provideFormContract(source)])).toBe(source);
  });

  it('provides null to opt out of shape checking', () => {
    // optional inject returns null both when missing and when provided as null,
    // so assert the provider shape directly.
    expect(provideFormContract(null)).toEqual({
      provide: NGX_FORM_CONTRACT,
      useValue: null,
    });
  });
});

describe('provideFormContractFactory', () => {
  it('builds the contract from injected dependencies', () => {
    @Injectable({ providedIn: 'root' })
    class SchemaService {
      readonly schema = contract;
    }

    expect(
      injectContract([
        provideFormContractFactory(() => inject(SchemaService).schema),
      ])
    ).toBe(contract);
  });

  it('runs the factory lazily, only when the token is injected', () => {
    let calls = 0;
    TestBed.configureTestingModule({
      providers: [
        provideFormContractFactory(() => {
          calls++;
          return contract;
        }),
      ],
    });

    expect(calls).toBe(0);
    TestBed.inject(NGX_FORM_CONTRACT);
    TestBed.inject(NGX_FORM_CONTRACT);
    expect(calls).toBe(1);
  });
});

describe('readFormContract', () => {
  it('returns null for undefined and null', () => {
    expect(readFormContract(undefined)).toBeNull();
    expect(readFormContract(null)).toBeNull();
  });

  it('returns a static contract unchanged', () => {
    expect(readFormContract(contract)).toBe(contract);
  });

  it('unwraps a signal to its current value', () => {
    const other: NgxFormContract<Model> = { name: 'other' };
    const source = signal<NgxFormContract<Model> | null>(contract);

    expect(readFormContract(source)).toBe(contract);
    source.set(other);
    expect(readFormContract(source)).toBe(other);
    source.set(null);
    expect(readFormContract(source)).toBeNull();
  });

  it('does not call a Standard Schema object as if it were a signal', () => {
    const schema = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: (value: unknown) => ({ value: value as Model }),
      },
    } as const;

    expect(readFormContract<Model>(schema)).toBe(schema);
  });
});
