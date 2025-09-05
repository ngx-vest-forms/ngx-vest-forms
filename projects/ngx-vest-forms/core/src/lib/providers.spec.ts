import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NGX_ERROR_DISPLAY_MODE_DEFAULT } from './config/error-display.config';
import {
  provideNgxVestFormsCore,
  withErrorDisplayMode,
  withRootFormKey,
} from './providers';
import { injectNgxRootFormKey, NGX_ROOT_FORM } from './utils/form-token';

describe('provideNgxVestFormsCore', () => {
  it('should configure NGX_ROOT_FORM when rootFormKey is provided', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ...provideNgxVestFormsCore({ rootFormKey: 'form' }),
      ],
    });

    const value = TestBed.runInInjectionContext(() => injectNgxRootFormKey());
    expect(value).toBe('form');
  });

  it('should configure NGX_ERROR_DISPLAY_MODE_DEFAULT when errorDisplayMode is provided', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ...provideNgxVestFormsCore({ errorDisplayMode: 'on-submit' }),
      ],
    });

    const mode = TestBed.runInInjectionContext(() =>
      TestBed.inject(NGX_ERROR_DISPLAY_MODE_DEFAULT),
    );
    expect(mode).toBe('on-submit');
  });
});

describe('granular helpers', () => {
  it('withRootFormKey should set NGX_ROOT_FORM', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), withRootFormKey('rooty')],
    });

    const value = TestBed.runInInjectionContext(() =>
      TestBed.inject(NGX_ROOT_FORM),
    );
    expect(value).toBe('rooty');
  });

  it('withErrorDisplayMode should set NGX_ERROR_DISPLAY_MODE_DEFAULT', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        withErrorDisplayMode('on-blur'),
      ],
    });

    const mode = TestBed.runInInjectionContext(() =>
      TestBed.inject(NGX_ERROR_DISPLAY_MODE_DEFAULT),
    );
    expect(mode).toBe('on-blur');
  });
});
