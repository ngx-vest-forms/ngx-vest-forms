import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { NgxDeepRequired } from '../utils/deep-required';
import {
  NGX_FORM_CONTRACT,
  type NgxFormContract,
  provideFormContract,
  provideFormContractFactory,
  readFormContract,
} from './form-contract.token';

type Model = {
  username: string;
  email: string;
};

const shape: NgxDeepRequired<Model> = {
  username: '',
  email: '',
};

describe('form-contract.token', () => {
  describe('readFormContract', () => {
    it('returns null for undefined input', () => {
      expect(readFormContract(undefined)).toBeNull();
    });

    it('returns null for null input', () => {
      expect(readFormContract(null)).toBeNull();
    });

    it('returns a plain shape unchanged', () => {
      expect(readFormContract<Model>(shape)).toBe(shape);
    });

    it('returns a Standard Schema contract unchanged', () => {
      const schema: NgxFormContract<Model> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value: value as Model }),
        },
      };

      expect(readFormContract<Model>(schema)).toBe(schema);
    });

    it('unwraps a signal source by invoking it', () => {
      const source = signal<NgxFormContract<Model> | null>(shape);

      expect(readFormContract<Model>(source)).toBe(shape);
    });

    it('returns the current signal value (re-read on every call)', () => {
      const source = signal<NgxFormContract<Model> | null>(shape);

      expect(readFormContract<Model>(source)).toBe(shape);

      const next: NgxDeepRequired<Model> = { username: 'x', email: 'y' };
      source.set(next);

      expect(readFormContract<Model>(source)).toBe(next);
    });

    it('returns null when a signal source emits null', () => {
      const source = signal<NgxFormContract<Model> | null>(null);

      expect(readFormContract<Model>(source)).toBeNull();
    });
  });

  describe('provideFormContract', () => {
    it('registers a static contract under NGX_FORM_CONTRACT', () => {
      @Component({ template: '' })
      class HostComponent {
        readonly contract = inject(NGX_FORM_CONTRACT);
      }

      TestBed.configureTestingModule({
        providers: [provideFormContract(shape)],
      });
      const fixture = TestBed.createComponent(HostComponent);

      expect(fixture.componentInstance.contract).toBe(shape);
    });

    it('supports registering a signal source', () => {
      const source = signal<NgxFormContract<Model> | null>(shape);

      @Component({ template: '' })
      class HostComponent {
        readonly stored = inject(NGX_FORM_CONTRACT);
      }

      TestBed.configureTestingModule({
        providers: [provideFormContract(source)],
      });
      const fixture = TestBed.createComponent(HostComponent);

      expect(fixture.componentInstance.stored).toBe(source);
      expect(readFormContract(source)).toBe(shape);
    });

    it('returns null when null is provided explicitly', () => {
      @Component({ template: '' })
      class HostComponent {
        readonly contract = inject(NGX_FORM_CONTRACT, { optional: true });
      }

      TestBed.configureTestingModule({
        providers: [provideFormContract(null)],
      });
      const fixture = TestBed.createComponent(HostComponent);

      expect(fixture.componentInstance.contract).toBeNull();
    });
  });

  describe('provideFormContractFactory', () => {
    it('defers construction until injection occurs', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return shape;
      };

      TestBed.configureTestingModule({
        providers: [provideFormContractFactory(factory)],
      });
      expect(callCount).toBe(0);

      @Component({ template: '' })
      class HostComponent {
        readonly contract = inject(NGX_FORM_CONTRACT);
      }

      const fixture = TestBed.createComponent(HostComponent);

      expect(callCount).toBe(1);
      expect(fixture.componentInstance.contract).toBe(shape);
    });

    it('supports composing the contract from injected dependencies', () => {
      @Component({ template: '' })
      class HostComponent {
        readonly contract = inject(NGX_FORM_CONTRACT);
      }

      const remoteShape: NgxDeepRequired<Model> = { username: '', email: '' };

      TestBed.configureTestingModule({
        providers: [provideFormContractFactory(() => remoteShape)],
      });
      const fixture = TestBed.createComponent(HostComponent);

      expect(fixture.componentInstance.contract).toBe(remoteShape);
    });
  });

  describe('NGX_FORM_CONTRACT default', () => {
    it('is undefined when no provider supplies it', () => {
      @Component({ template: '' })
      class HostComponent {
        readonly contract = inject(NGX_FORM_CONTRACT, { optional: true });
      }

      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(HostComponent);

      expect(fixture.componentInstance.contract).toBeNull();
    });
  });
});
