import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { fastDeepEqual } from '../utils/equality';
import { NGX_EQUALITY_FN } from './equality.token';

describe('NGX_EQUALITY_FN', () => {
  it('should default to fastDeepEqual', () => {
    @Component({ template: '' })
    class TestComponent {
      equal = inject(NGX_EQUALITY_FN);
    }

    TestBed.configureTestingModule({});

    const { equal } = TestBed.createComponent(TestComponent).componentInstance;

    expect(equal).toBe(fastDeepEqual);
    expect(equal({ a: 1 }, { a: 1 })).toBe(true);
    expect(equal({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('should allow application-level override', () => {
    const stub = (a: unknown, b: unknown): boolean => a === b;

    @Component({ template: '' })
    class TestComponent {
      equal = inject(NGX_EQUALITY_FN);
    }

    TestBed.configureTestingModule({
      providers: [{ provide: NGX_EQUALITY_FN, useValue: stub }],
    });

    const { equal } = TestBed.createComponent(TestComponent).componentInstance;

    expect(equal).toBe(stub);
    // Stub uses reference equality, so two structurally-equal objects are NOT equal.
    expect(equal({ a: 1 }, { a: 1 })).toBe(false);
  });

  it('should allow component-level override to take precedence', () => {
    const componentEqual = (a: unknown, b: unknown): boolean => a === b;
    const appEqual = fastDeepEqual;

    @Component({
      template: '',
      providers: [{ provide: NGX_EQUALITY_FN, useValue: componentEqual }],
    })
    class TestComponent {
      equal = inject(NGX_EQUALITY_FN);
    }

    TestBed.configureTestingModule({
      providers: [{ provide: NGX_EQUALITY_FN, useValue: appEqual }],
    });

    const { equal } = TestBed.createComponent(TestComponent).componentInstance;

    expect(equal).toBe(componentEqual);
  });
});
