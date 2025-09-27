import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { injectNgxRootFormKey, NGX_ROOT_FORM } from './form-token';

describe('injectNgxRootFormKey', () => {
  const fallbackValue = 'rootForm';

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the NGX_ROOT_FORM token value when available', () => {
    const rootFormValue = 'testForm';
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: NGX_ROOT_FORM, useValue: rootFormValue },
      ],
    });

    const result = TestBed.runInInjectionContext(() => injectNgxRootFormKey());
    expect(result).toBe(rootFormValue);
  });

  it('should return the fallback value when NGX_ROOT_FORM token is null', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: NGX_ROOT_FORM, useValue: null },
      ],
    });

    const result = TestBed.runInInjectionContext(() => injectNgxRootFormKey());
    expect(result).toBe(fallbackValue);
  });

  it('should return the fallback value when called outside of DI context', () => {
    const result = injectNgxRootFormKey();
    expect(result).toBe(fallbackValue);
  });

  it('should log a warning when NGX_ROOT_FORM token is not found', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      // Intentionally left empty as no operation is needed here
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: NGX_ROOT_FORM, useValue: null },
      ],
    });

    TestBed.runInInjectionContext(() => injectNgxRootFormKey());

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'NGX_ROOT_FORM token not found in current DI context. Using fallback value:',
      fallbackValue,
    );
  });

  it('should log a warning when called outside of DI context', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      // No operation needed here
    });

    injectNgxRootFormKey();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'injectNgxRootFormKey called outside of injection context and no injector provided. Using fallback value:',
      fallbackValue,
    );
  });

  it('should allow a custom fallback value', () => {
    const customFallback = 'customFallback';
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    // Call directly outside of DI context with custom fallback
    const result = injectNgxRootFormKey(customFallback);

    expect(result).toBe(customFallback);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'injectNgxRootFormKey called outside of injection context and no injector provided. Using fallback value:',
      customFallback,
    );
  });
});
