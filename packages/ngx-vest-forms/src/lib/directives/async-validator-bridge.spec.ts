import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';
import { firstValueFrom, Observable, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAsyncValidationBridge } from './async-validator-bridge';
import type { FormDirective } from './form.directive';
import type { ValidationOptions } from './validation-options';

type Context = FormDirective<Record<string, unknown>>;

const options: ValidationOptions = { debounceTime: 0 };

function contextReturning(
  result: ReturnType<AsyncValidatorFn> | ValidationErrors | null
): { context: Context; createAsyncValidator: ReturnType<typeof vi.fn> } {
  const validator = vi.fn(() => result);
  const createAsyncValidator = vi.fn(() => validator);
  return {
    context: { createAsyncValidator } as unknown as Context,
    createAsyncValidator,
  };
}

function controlInGroup(): FormControl {
  const control = new FormControl('');
  const group = new FormGroup({ email: control });
  expect(control.parent).toBe(group);
  return control;
}

/** Runs `fn` with Angular's dev mode switched off (what enableProdMode does). */
function inProdMode<T>(fn: () => T): T {
  const global = globalThis as { ngDevMode?: unknown };
  const previous = global.ngDevMode;
  global.ngDevMode = false;
  try {
    return fn();
  } finally {
    global.ngDevMode = previous;
  }
}

describe('runAsyncValidationBridge', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('fails open without warning when there is no control', async () => {
    const { context, createAsyncValidator } = contextReturning({ x: true });

    const result = runAsyncValidationBridge(
      null as unknown as AbstractControl,
      context,
      () => 'email',
      options,
      'FormModelDirective'
    );

    expect(await firstValueFrom(result)).toBeNull();
    expect(createAsyncValidator).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  describe('without a FormDirective context', () => {
    it('fails open and logs NGX-103 with the source in dev mode', async () => {
      const resolveField = vi.fn(() => 'email');

      const result = runAsyncValidationBridge(
        controlInGroup(),
        null,
        resolveField,
        options,
        'FormModelGroupDirective'
      );

      expect(await firstValueFrom(result)).toBeNull();
      expect(resolveField).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[NGX-103] [ngx-vest-forms] FormModelGroupDirective: No FormDirective context found. Validation skipped (fail-open).'
      );
    });

    it('fails open silently in production mode', async () => {
      const result = inProdMode(() =>
        runAsyncValidationBridge(
          controlInGroup(),
          null,
          () => 'email',
          options,
          'FormModelDirective'
        )
      );

      expect(await firstValueFrom(result)).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('when the field path cannot be resolved', () => {
    it('fails open silently for a standalone control without a parent', async () => {
      const { context, createAsyncValidator } = contextReturning({ x: true });

      const result = runAsyncValidationBridge(
        new FormControl(''),
        context,
        () => '',
        options,
        'FormModelDirective'
      );

      expect(await firstValueFrom(result)).toBeNull();
      expect(createAsyncValidator).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('fails open and logs NGX-104 for a control inside a form tree', async () => {
      const { context, createAsyncValidator } = contextReturning({ x: true });

      const result = runAsyncValidationBridge(
        controlInGroup(),
        context,
        () => '',
        options,
        'FormModelDirective'
      );

      expect(await firstValueFrom(result)).toBeNull();
      expect(createAsyncValidator).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[NGX-104\] \[ngx-vest-forms\] FormModelDirective: Could not resolve control path\./
        )
      );
    });

    it('does not log NGX-104 in production mode', async () => {
      const { context } = contextReturning({ x: true });

      const result = inProdMode(() =>
        runAsyncValidationBridge(
          controlInGroup(),
          context,
          () => '',
          options,
          'FormModelDirective'
        )
      );

      expect(await firstValueFrom(result)).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('with a resolved field', () => {
    it('creates the validator for the resolved field and options and runs it on the control', async () => {
      const control = controlInGroup();
      const validator = vi.fn(() => of(null));
      const createAsyncValidator = vi.fn(() => validator);
      const resolveField = vi.fn(() => 'address.street');
      const context = { createAsyncValidator } as unknown as Context;

      await firstValueFrom(
        runAsyncValidationBridge(
          control,
          context,
          resolveField,
          options,
          'FormModelDirective'
        )
      );

      expect(resolveField).toHaveBeenCalledWith(control, context);
      expect(createAsyncValidator).toHaveBeenCalledWith(
        'address.street',
        options
      );
      expect(validator).toHaveBeenCalledWith(control);
    });

    it('returns an Observable result as the same instance', () => {
      const errors$ = of({ required: true });
      const { context } = contextReturning(errors$);

      const result = runAsyncValidationBridge(
        controlInGroup(),
        context,
        () => 'email',
        options,
        'FormModelDirective'
      );

      expect(result).toBe(errors$);
    });

    it('converts a Promise result to an Observable', async () => {
      const { context } = contextReturning(
        Promise.resolve({ taken: ['Email is taken'] })
      );

      const result = runAsyncValidationBridge(
        controlInGroup(),
        context,
        () => 'email',
        options,
        'FormModelDirective'
      );

      expect(result).toBeInstanceOf(Observable);
      expect(await firstValueFrom(result)).toEqual({
        taken: ['Email is taken'],
      });
    });

    it('wraps a plain ValidationErrors result in an Observable', async () => {
      const { context } = contextReturning({ minlength: true });

      const result = runAsyncValidationBridge(
        controlInGroup(),
        context,
        () => 'email',
        options,
        'FormModelDirective'
      );

      expect(await firstValueFrom(result)).toEqual({ minlength: true });
    });

    it('normalizes an undefined result to null', async () => {
      const { context } = contextReturning(
        undefined as unknown as ValidationErrors
      );

      const result = runAsyncValidationBridge(
        controlInGroup(),
        context,
        () => 'email',
        options,
        'FormModelDirective'
      );

      expect(await firstValueFrom(result)).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
