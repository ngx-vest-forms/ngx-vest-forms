import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ROOT_FORM } from '../constants';
import { injectRootFormKey } from './form-token';

describe('injectRootFormKey', () => {
  const fallbackValue = 'rootForm';

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the ROOT_FORM token value when available', () => {
    const rootFormValue = 'testForm';
    TestBed.configureTestingModule({
      providers: [{ provide: ROOT_FORM, useValue: rootFormValue }],
    });

    const result = TestBed.runInInjectionContext(() => injectRootFormKey());
    expect(result).toBe(rootFormValue);
  });

  it('should return the fallback value when ROOT_FORM token is null', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ROOT_FORM, useValue: null }],
    });

    const result = TestBed.runInInjectionContext(() => injectRootFormKey());
    expect(result).toBe(fallbackValue);
  });

  it('should return the fallback value when called outside of DI context', () => {
    const result = injectRootFormKey();
    expect(result).toBe(fallbackValue);
  });

  it('should log a warning when ROOT_FORM token is not found', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [{ provide: ROOT_FORM, useValue: null }],
    });

    TestBed.runInInjectionContext(() => injectRootFormKey());

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'ROOT_FORM token not found in DI context. Using fallback value:',
      fallbackValue,
    );
  });

  it('should log a warning when called outside of DI context', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    injectRootFormKey();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'injectRootFormKey called outside of injection context. Using fallback value:',
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
    const result = injectRootFormKey(customFallback);

    expect(result).toBe(customFallback);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'injectRootFormKey called outside of injection context. Using fallback value:',
      customFallback,
    );
  });
});
