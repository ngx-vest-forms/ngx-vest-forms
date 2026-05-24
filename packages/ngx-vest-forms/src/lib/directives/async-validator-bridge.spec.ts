import { FormControl, ValidationErrors } from '@angular/forms';
import { Observable, firstValueFrom, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAsyncValidationBridge } from './async-validator-bridge';
import type { FormDirective } from './form.directive';
import type { ValidationOptions } from './validation-options';

type AsyncValidator = (
  control: FormControl
) =>
  | Observable<ValidationErrors | null>
  | Promise<ValidationErrors | null>
  | ValidationErrors
  | null;

function makeContext(asyncValidator: AsyncValidator) {
  return {
    createAsyncValidator: vi
      .fn<(field: string, options: ValidationOptions) => AsyncValidator>()
      .mockReturnValue(asyncValidator),
  } as unknown as FormDirective<Record<string, unknown>>;
}

const noopOptions: ValidationOptions = { debounceTime: 0 };

describe('runAsyncValidationBridge', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns null when the control is missing', async () => {
    const result = await firstValueFrom(
      runAsyncValidationBridge(
        null as unknown as FormControl,
        makeContext(() => of(null)),
        () => 'firstName',
        noopOptions,
        'FormModelDirective'
      )
    );

    expect(result).toBeNull();
  });

  it('fails open and warns (in dev mode) when no FormDirective context is provided', async () => {
    const control = new FormControl('value');

    const result = await firstValueFrom(
      runAsyncValidationBridge(
        control,
        null,
        () => 'firstName',
        noopOptions,
        'FormModelDirective'
      )
    );

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('[NGX-103]');
    expect(message).toContain('FormModelDirective');
    expect(message).toContain('No FormDirective context found');
  });

  it('fails open silently when the resolver returns an empty path and the control has no parent', async () => {
    const control = new FormControl('value');
    const ctx = makeContext(() => of(null));

    const result = await firstValueFrom(
      runAsyncValidationBridge(
        control,
        ctx,
        () => '',
        noopOptions,
        'FormModelDirective'
      )
    );

    expect(result).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(ctx.createAsyncValidator).not.toHaveBeenCalled();
  });

  it('fails open and warns when the path cannot be resolved but the control is parented', async () => {
    const control = new FormControl('value');
    Object.defineProperty(control, 'parent', {
      value: new FormControl('parent'),
      configurable: true,
    });
    const ctx = makeContext(() => of({ required: true }));

    const result = await firstValueFrom(
      runAsyncValidationBridge(
        control,
        ctx,
        () => '',
        noopOptions,
        'FormModelGroupDirective'
      )
    );

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('[NGX-104]');
    expect(message).toContain('FormModelGroupDirective');
    expect(message).toContain('Could not resolve control path');
    expect(ctx.createAsyncValidator).not.toHaveBeenCalled();
  });

  it('passes through Observable validator results', async () => {
    const control = new FormControl('value');
    const errors: ValidationErrors = { required: true };
    const ctx = makeContext(() => of(errors));

    const result = await firstValueFrom(
      runAsyncValidationBridge(
        control,
        ctx,
        () => 'firstName',
        noopOptions,
        'FormModelDirective'
      )
    );

    expect(result).toEqual(errors);
    expect(ctx.createAsyncValidator).toHaveBeenCalledWith(
      'firstName',
      noopOptions
    );
  });

  it('wraps Promise validator results via from()', async () => {
    const control = new FormControl('value');
    const errors: ValidationErrors = { minlength: true };
    const ctx = makeContext(() => Promise.resolve(errors));

    const observable = runAsyncValidationBridge(
      control,
      ctx,
      () => 'firstName',
      noopOptions,
      'FormModelDirective'
    );

    expect(observable).toBeInstanceOf(Observable);
    await expect(firstValueFrom(observable)).resolves.toEqual(errors);
  });

  it('lifts plain ValidationErrors into an observable', async () => {
    const control = new FormControl('value');
    const errors: ValidationErrors = { custom: 'broken' };
    const ctx = makeContext(() => errors);

    const result = await firstValueFrom(
      runAsyncValidationBridge(
        control,
        ctx,
        () => 'firstName',
        noopOptions,
        'FormModelDirective'
      )
    );

    expect(result).toEqual(errors);
  });

  it('lifts a null plain result into an observable emitting null', async () => {
    const control = new FormControl('value');
    const ctx = makeContext(() => null);

    const result = await firstValueFrom(
      runAsyncValidationBridge(
        control,
        ctx,
        () => 'firstName',
        noopOptions,
        'FormModelDirective'
      )
    );

    expect(result).toBeNull();
  });

  it('forwards the resolved field name and the validation options to createAsyncValidator', async () => {
    const control = new FormControl('value');
    const options: ValidationOptions = { debounceTime: 250 };
    const ctx = makeContext(() => of(null));

    await firstValueFrom(
      runAsyncValidationBridge(
        control,
        ctx,
        () => 'profile.email',
        options,
        'FormModelDirective'
      )
    );

    expect(ctx.createAsyncValidator).toHaveBeenCalledWith(
      'profile.email',
      options
    );
  });
});
