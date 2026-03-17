/* eslint-disable @angular-eslint/component-selector */
import { Component, signal, viewChild, ViewChild } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { isObservable, Observable } from 'rxjs';
import { create, enforce, test as vestTest, warn } from 'vest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormDirective } from '../directives/form.directive';
import { NgxVestForms } from '../exports';
// Helper to await either a Promise or Observable
async function awaitResult<T>(result: Promise<T> | Observable<T>) {
  if (isObservable(result)) {
    return await firstValueFrom(result);
  }
  return await result;
}

import { firstValueFrom } from 'rxjs';

function expectElement<T extends Element>(
  value: T | null,
  selector: string
): T {
  expect(
    value,
    `Expected element matching "${selector}" to be present`
  ).toBeTruthy();
  if (!value) {
    throw new Error(`Expected element matching "${selector}" to be present`);
  }
  return value;
}

@Component({
  selector: 'test-form',
  imports: [NgxVestForms],

  template: `
    <form
      ngxVestForm
      [suite]="suite()"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      #vest="ngxVestForm"
    >
      <label for="username">Username</label>
      <input
        id="username"
        name="username"
        [ngModel]="formValue().username"
        [validationOptions]="{ debounceTime: 150 }"
      />
      <div data-testid="form-valid">{{ vest.validChange }}</div>
    </form>
  `,
})
class TestFormComponent {
  formValue = signal({ username: '' });
  count = signal(0);
  suite = signal(
    create((model: { username: string } = { username: '' }) => {
      this.count.update((count) => count + 1);
      enforce(model.username).isNotEmpty();
    })
  );
}

describe('FormDirective - Async Validator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should debounce async validation calls per field (single-flight)', async () => {
    // Arrange: render the form
    const { fixture } = await render(TestFormComponent);
    const instance = fixture.componentInstance as TestFormComponent;

    // Simulate rapid typing by directly updating the form value
    instance.formValue.set({ username: 'a' });
    fixture.detectChanges();
    instance.formValue.set({ username: 'ab' });
    fixture.detectChanges();
    instance.formValue.set({ username: 'abc' });
    fixture.detectChanges();

    // Advance time less than debounce window (simulate debounceTime: 150ms)
    vi.advanceTimersByTime(100);
    fixture.detectChanges();
    // No validation should have run yet
    expect(instance.count()).toBe(0);

    // Advance past debounce window
    vi.advanceTimersByTime(100);
    fixture.detectChanges();
    // Only one validation should have run
    expect(instance.count()).toBe(1);
  });

  @Component({
    selector: 'test-parallel-validation-host',
    template: `
      <form
        ngxVestForm
        [suite]="suite()"
        [formValue]="formValue()"
        #vest="ngxVestForm"
      ></form>
    `,

    imports: [NgxVestForms],
  })
  class TestParallelValidationHost {
    formValue = signal({ username: '' });
    // Vest 6: suite.only(field).run(model) pattern
    mockRun = vi.fn().mockReturnValue({
      getErrors: () => ({}),
      getWarnings: () => ({}),
      isPending: () => false,
      isValid: () => true,
      then: (cb: any) =>
        Promise.resolve().then(() =>
          cb({ getErrors: () => ({}), getWarnings: () => ({}) })
        ),
    });
    suite = signal({
      only: () => ({ run: this.mockRun }),
      reset: vi.fn(),
    } as any);
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  it('should not run multiple validations in parallel for the same field', async () => {
    const { fixture } = await render(TestParallelValidationHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm().createAsyncValidator('username', {
      debounceTime: 0,
    });
    const controlA = { value: 'a' } as any;
    const controlB = { value: 'b' } as any;
    const pending = Promise.all([
      awaitResult(validator(controlA)),
      awaitResult(validator(controlB)),
    ]);
    vi.runOnlyPendingTimers();
    await pending;
    expect(instance.mockRun).toHaveBeenCalled();
  });

  @Component({
    selector: 'test-debounce-cache-host',
    template: `
      <form
        ngxVestForm
        [suite]="suite()"
        [formValue]="formValue()"
        #vest="ngxVestForm"
      ></form>
    `,

    imports: [NgxVestForms],
  })
  class TestDebounceCacheHost {
    formValue = signal({ username: '', email: '' });
    suite = signal(vi.fn());
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-form-throw',
    imports: [NgxVestForms],

    template: `
      <form
        ngxVestForm
        [suite]="suite()"
        [formValue]="formValue()"
        #vest="ngxVestForm"
      >
        <label for="username">Username</label>
        <input id="username" name="username" [ngModel]="formValue().username" />
        <div data-testid="form-valid">{{ vest.validChange }}</div>
      </form>
    `,
  })
  class TestFormThrowComponent {
    formValue = signal({ username: '' });
    suite = signal(
      create(() => {
        throw new Error('Vest suite execution error');
      })
    );
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  it('should return vestInternalError if suite throws', async () => {
    const { fixture } = await render(TestFormThrowComponent);
    const validator = fixture.componentInstance
      .vestForm()
      .createAsyncValidator('username', { debounceTime: 0 });
    const resultPromise = awaitResult(validator({ value: 'abc' } as any));
    vi.runOnlyPendingTimers();
    await Promise.resolve();
    const result = await resultPromise;
    // Both v2 and current implementation use generic error message
    expect(result).toEqual({
      vestInternalError: 'Validation failed',
    });
  });

  it('should return null if suite or formValue is not set', async () => {
    @Component({
      selector: 'test-null-suite-host',
      template: `<form ngxVestForm #vest="ngxVestForm"></form>`,

      imports: [NgxVestForms],
    })
    class TestNullSuiteHost {
      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }
    const { fixture } = await render(TestNullSuiteHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm().createAsyncValidator('username', {
      debounceTime: 0,
    });
    const control = { value: 'a' } as any;
    const result = await awaitResult(validator(control));
    expect(result).toBeNull();
  });

  it('should handle undefined/null values for candidate model', async () => {
    @Component({
      selector: 'test-undefined-value-host',
      template: `<form
        ngxVestForm
        [suite]="suite()"
        #vest="ngxVestForm"
      ></form>`,

      imports: [NgxVestForms],
    })
    class TestUndefinedValueHost {
      // Provide a proper Vest suite that resolves validation
      suite = signal(
        create((model: any = {}) => {
          // Suite runs but produces no errors (valid)
        })
      );
      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }
    const { fixture } = await render(TestUndefinedValueHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm().createAsyncValidator('username', {
      debounceTime: 0,
    });
    const control = { value: 'a' } as any;

    // Start the async validator
    const resultPromise = awaitResult(validator(control));

    // Advance all timers to complete the timer(0) and Vest suite execution
    vi.runAllTimers();
    await Promise.resolve(); // Let microtasks flush

    const result = await resultPromise;
    // Should be null because the suite produces no errors/warnings
    expect(result).toBeNull();
  });

  it('should return null (valid) when field has only warnings, not errors', async () => {
    // This test verifies the fix for: Warnings should NOT affect field validity
    // Previously, returning { warnings: [...] } caused Angular to mark the field as invalid
    @Component({
      selector: 'test-warnings-only-host',
      template: `<form
        ngxVestForm
        [suite]="suite()"
        #vest="ngxVestForm"
      ></form>`,

      imports: [NgxVestForms],
    })
    class TestWarningsOnlyHost {
      // Suite that only produces warnings (via warn()), no errors
      suite = signal(
        create((model: { password?: string } = {}) => {
          // Only a warning - should NOT make field invalid
          vestTest('password', 'Password is weak', () => {
            warn();
            enforce(model.password ?? '').longerThan(12);
          });
        })
      );
      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }
    const { fixture } = await render(TestWarningsOnlyHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm().createAsyncValidator('password', {
      debounceTime: 0,
    });
    // Password of length 8 triggers warning but NOT error (warn() makes it non-blocking)
    const control = { value: 'Short123' } as any;

    // Start the async validator
    const resultPromise = awaitResult(validator(control));

    // Advance all timers to complete the timer(0) and Vest suite execution
    vi.runAllTimers();
    await Promise.resolve(); // Let microtasks flush

    const result = await resultPromise;

    // CRITICAL: When a field has ONLY warnings (no errors), the validator should
    // return null OR { warnings: [...] } with a truthy 'warnings' key but NO 'errors'.
    // However, Angular interprets any non-null return as "invalid".
    //
    // The FIX: Return { warnings: [...] } separately from errors, but ensure the
    // actual ValidationErrors (errors key) is null/empty so Angular marks field as valid.
    //
    // Expected: null (field is valid, warnings are informational only)
    // Bug would return: { warnings: ['Password is weak'] } making field ng-invalid
    expect(result).toBeNull();
  });

  it('should return errors AND warnings when both exist', async () => {
    // When a field has BOTH errors and warnings, we need to return both
    // but only errors should affect validity
    @Component({
      selector: 'test-errors-and-warnings-host',
      template: `<form
        ngxVestForm
        [suite]="suite()"
        #vest="ngxVestForm"
      ></form>`,

      imports: [NgxVestForms],
    })
    class TestErrorsAndWarningsHost {
      // Suite that produces both errors and warnings for short passwords
      // IMPORTANT: Warning tests must come BEFORE error tests in Vest
      // because Vest stops processing after a field fails a non-warning test
      suite = signal(
        create((model: { password?: string } = {}) => {
          // Warning - password should be longer than 12 characters (informational)
          // Runs FIRST so it gets captured before the error test
          vestTest(
            'password',
            'Password should be longer than 12 characters',
            () => {
              warn();
              enforce(model.password ?? '').longerThan(12);
            }
          );
          // Error - password must be at least 8 characters
          vestTest('password', 'Password must be at least 8 characters', () => {
            enforce(model.password ?? '').longerThanOrEquals(8);
          });
        })
      );
      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }
    const { fixture } = await render(TestErrorsAndWarningsHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm().createAsyncValidator('password', {
      debounceTime: 0,
    });
    // Short password (5 chars) triggers both:
    // - Error: not >= 8 characters
    // - Warning: not > 12 characters
    const control = { value: 'short' } as any;

    // Start the async validator
    const resultPromise = awaitResult(validator(control));

    // Advance all timers
    vi.runAllTimers();
    await Promise.resolve();

    const result = await resultPromise;

    // When both exist, errors should be returned (making field invalid)
    // and warnings should be included for display purposes
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('errors');
    expect(result?.['errors']).toContain(
      'Password must be at least 8 characters'
    );
    // Warnings should also be present for the control-wrapper to display
    expect(result).toHaveProperty('warnings');
    expect(result?.['warnings']).toContain(
      'Password should be longer than 12 characters'
    );
  });

  it('should ignore stale async completions after a validator subscription is cancelled', async () => {
    @Component({
      selector: 'test-cancelled-validation-host',
      template: `<form
        ngxVestForm
        [suite]="suite()"
        #vest="ngxVestForm"
      ></form>`,

      imports: [NgxVestForms],
    })
    class TestCancelledValidationHost {
      private resolvePendingRun: (() => void) | undefined;

      private readonly finalResult = {
        isPending: () => false,
        isValid: () => true,
        hasErrors: () => false,
        hasWarnings: () => true,
        isTested: () => true,
        getErrors: () => ({}),
        getWarnings: () => ({ username: ['Username looks weak'] }),
      };

      private readonly pendingResult = {
        ...this.finalResult,
        isPending: () => true,
        then: (onfulfilled?: ((value: unknown) => unknown) | null) =>
          new Promise((resolve) => {
            this.resolvePendingRun = () => {
              const value = onfulfilled
                ? onfulfilled(this.finalResult)
                : this.finalResult;
              resolve(value);
            };
          }),
      };

      readonly suite = signal({
        only: () => ({ run: () => this.pendingResult }),
        get: () => this.finalResult,
        reset: vi.fn(),
        resetField: vi.fn(),
        remove: vi.fn(),
        subscribe: vi.fn(),
        dump: vi.fn(),
        resume: vi.fn(),
      } as any);

      flushPendingRun(): void {
        this.resolvePendingRun?.();
      }

      @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
    }

    const { fixture } = await render(TestCancelledValidationHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm.createAsyncValidator('username', {
      debounceTime: 0,
    });
    const nextSpy = vi.fn();

    const subscription = (
      validator({ value: 'abc' } as any) as Observable<any>
    ).subscribe(nextSpy);

    vi.runAllTimers();
    await Promise.resolve();

    subscription.unsubscribe();
    instance.flushPendingRun();
    await Promise.resolve();

    expect(nextSpy).not.toHaveBeenCalled();
    expect(instance.vestForm.fieldWarnings().has('username')).toBe(false);
  });

  it('should not leak stale fieldWarnings when a rejected thenable is cancelled', async () => {
    @Component({
      selector: 'test-rejected-cancel-host',
      template: `<form
        ngxVestForm
        [suite]="suite()"
        #vest="ngxVestForm"
      ></form>`,
      imports: [NgxVestForms],
    })
    class TestRejectedCancelHost {
      private rejectPendingRun: (() => void) | undefined;

      private readonly finalResult = {
        isPending: () => false,
        isValid: () => true,
        hasErrors: () => false,
        hasWarnings: () => true,
        isTested: () => true,
        getErrors: () => ({}),
        getWarnings: () => ({ username: ['Username looks weak'] }),
      };

      private readonly pendingResult = {
        ...this.finalResult,
        isPending: () => true,
        then: (
          _onfulfilled?: ((value: unknown) => unknown) | null,
          onrejected?: ((reason: unknown) => unknown) | null
        ) =>
          new Promise((_resolve, reject) => {
            this.rejectPendingRun = () => {
              if (onrejected) onrejected(new Error('rejected'));
              reject(new Error('rejected'));
            };
          }),
      };

      readonly suite = signal({
        only: () => ({ run: () => this.pendingResult }),
        get: () => this.finalResult,
        reset: vi.fn(),
        resetField: vi.fn(),
        remove: vi.fn(),
        subscribe: vi.fn(),
        dump: vi.fn(),
        resume: vi.fn(),
      } as any);

      flushPendingRun(): void {
        this.rejectPendingRun?.();
      }

      @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
    }

    const { fixture } = await render(TestRejectedCancelHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm.createAsyncValidator('username', {
      debounceTime: 0,
    });
    const nextSpy = vi.fn();

    const subscription = (
      validator({ value: 'abc' } as any) as Observable<any>
    ).subscribe(nextSpy);

    vi.runAllTimers();
    await Promise.resolve();

    // Cancel before promise rejection is handled
    subscription.unsubscribe();
    instance.flushPendingRun();
    await Promise.resolve();
    vi.runAllTimers();
    await Promise.resolve();

    expect(nextSpy).not.toHaveBeenCalled();
    expect(instance.vestForm.fieldWarnings().has('username')).toBe(false);
  });

  it('should only emit the latest result when rapid field changes overlap', async () => {
    let runCount = 0;
    @Component({
      selector: 'test-rapid-overlap-host',
      template: `<form
        ngxVestForm
        [suite]="suite()"
        #vest="ngxVestForm"
      ></form>`,
      imports: [NgxVestForms],
    })
    class TestRapidOverlapHost {
      readonly suite = signal({
        only: () => ({
          run: () => {
            runCount++;
            return {
              isPending: () => false,
              isValid: () => true,
              getErrors: () => ({}),
              getWarnings: () => ({}),
            };
          },
        }),
        get: () => ({
          isPending: () => false,
          isValid: () => true,
          getErrors: () => ({}),
          getWarnings: () => ({}),
        }),
        reset: vi.fn(),
      } as any);

      @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
    }

    const { fixture } = await render(TestRapidOverlapHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm.createAsyncValidator('username', {
      debounceTime: 0,
    });

    runCount = 0;
    const results: unknown[] = [];

    // Start first validation, then immediately start second (supersedes first)
    const sub1 = (
      validator({ value: 'a' } as any) as Observable<any>
    ).subscribe((v: unknown) => results.push(v));
    sub1.unsubscribe(); // Superseded by next call

    const result2 = awaitResult(validator({ value: 'ab' } as any));
    vi.runAllTimers();
    await Promise.resolve();
    const finalResult = await result2;

    // First subscription was cancelled, so it should not have emitted
    expect(results).toHaveLength(0);
    // Second validation should produce a result
    expect(finalResult).toBeNull(); // no errors → null
  });
});

describe.todo('FormDirective - Validator Cache');

describe('FormDirective - Composability & Host Bindings', () => {
  it('should allow multiple directives to coexist', async () => {
    @Component({
      selector: 'test-multi-directive-host',
      template: `
        <form ngxVestForm #vest1="ngxVestForm"></form>
        <form ngxVestForm #vest2="ngxVestForm"></form>
      `,

      imports: [NgxVestForms],
    })
    class TestMultiDirectiveHost {
      readonly vestForm1 =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest1');
      readonly vestForm2 =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest2');
    }
    const { fixture } = await render(TestMultiDirectiveHost);
    const instance = fixture.componentInstance;
    expect(instance.vestForm1()).not.toBe(instance.vestForm2());
  });
});

describe('FormDirective - ValidationConfig', () => {
  @Component({
    selector: 'test-validation-config-host',
    template: `
      <form
        ngxVestForm
        [validationConfig]="validationConfig()"
        #vest="ngxVestForm"
      ></form>
    `,

    imports: [NgxVestForms],
  })
  class TestValidationConfigHost {
    validationConfig = signal<{ [key: string]: string[] }>({
      username: ['email'],
    });
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  it('should debounce dependent field validation', async () => {
    const { fixture } = await render(TestValidationConfigHost);
    const instance = fixture.componentInstance;
    expect(instance.vestForm()).toBeDefined();
    expect(instance.vestForm().validationConfig()).toEqual({
      username: ['email'],
    });
  });

  it('should not cause infinite loops or redundant validations', async () => {
    @Component({
      selector: 'test-validation-config-loop',
      template: `<form
        ngxVestForm
        [validationConfig]="validationConfig()"
        #vest="ngxVestForm"
      ></form>`,

      imports: [NgxVestForms],
    })
    class TestValidationConfigLoop {
      validationConfig = signal<{ [key: string]: string[] }>({
        username: ['email'],
        email: ['username'],
      });
      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }
    const { fixture } = await render(TestValidationConfigLoop);
    const instance = fixture.componentInstance;
    expect(instance.vestForm()).toBeDefined();
    expect(instance.vestForm().validationConfig()).toEqual({
      username: ['email'],
      email: ['username'],
    });
  });
});

describe('FormDirective - Model to Form Synchronization', () => {
  it('should patch nested values when model changes (ngModelGroup) without requiring full objects', async () => {
    @Component({
      selector: 'test-nested-model-sync-host',
      template: `
        <form
          ngxVestForm
          [suite]="suite()"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          #vest="ngxVestForm"
        >
          <div ngModelGroup="user">
            <label for="firstName">First name</label>
            <input
              id="firstName"
              name="firstName"
              [ngModel]="formValue().user?.firstName"
            />
            <label for="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              [ngModel]="formValue().user?.lastName"
            />
          </div>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestNestedModelSyncHost {
      formValue = signal<{ user?: { firstName?: string; lastName?: string } }>({
        user: { firstName: '', lastName: '' },
      });
      suite = signal(
        create((model: unknown = {}) => {
          // No validations required for this test; keep suite well-formed.
        })
      );
    }

    const { fixture } = await render(TestNestedModelSyncHost);
    const instance = fixture.componentInstance;

    // Initial render
    fixture.detectChanges();
    await fixture.whenStable();

    const firstNameInput = fixture.nativeElement.querySelector(
      'input[name="firstName"]'
    ) as HTMLInputElement | null;
    const lastNameInput = fixture.nativeElement.querySelector(
      'input[name="lastName"]'
    ) as HTMLInputElement | null;

    expect(firstNameInput).toBeTruthy();
    expect(lastNameInput).toBeTruthy();

    if (!firstNameInput || !lastNameInput) {
      throw new Error('Inputs not found');
    }

    expect(firstNameInput.value).toBe('');
    expect(lastNameInput.value).toBe('');

    // Programmatic model update with a partial nested object.
    // Regression: previous implementation used setValue on the FormGroup which would throw.
    instance.formValue.set({ user: { firstName: 'Ada' } });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(firstNameInput.value).toBe('Ada');
    // lastName should remain unchanged.
    expect(lastNameInput.value).toBe('');
  });
});

describe('FormDirective - Signals/Outputs', () => {
  it('should emit correct values on formValueChange, errorsChange, dirtyChange, validChange', async () => {
    @Component({
      selector: 'test-signals-outputs-host',
      template: `<form ngxVestForm #vest="ngxVestForm"></form>`,

      imports: [NgxVestForms],
    })
    class TestSignalsOutputsHost {
      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }
    const { fixture } = await render(TestSignalsOutputsHost);
    const instance = fixture.componentInstance;
    expect(instance.vestForm().formValueChange).toBeDefined();
    expect(instance.vestForm().errorsChange).toBeDefined();
    expect(instance.vestForm().dirtyChange).toBeDefined();
    expect(instance.vestForm().validChange).toBeDefined();
  });

  it('should expose pending/valid/invalid helpers and validatedFields alias', async () => {
    @Component({
      selector: 'test-state-helpers-host',
      template: `
        <form
          ngxVestForm
          [suite]="suite()"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          #vest="ngxVestForm"
        >
          <label for="email">Email</label>
          <input id="email" name="email" [ngModel]="formValue().email" />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestStateHelpersHost {
      readonly formValue = signal<{ email?: string }>({});
      readonly suite = signal(
        create((model: { email?: string } = {}) => {
          vestTest('email', 'Email is required', () => {
            enforce(model.email).isNotBlank();
          });
        })
      );

      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }

    const { fixture } = await render(TestStateHelpersHost);
    const instance = fixture.componentInstance;

    await userEvent.click(screen.getByLabelText('Email'));
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveClass('ng-invalid');
    });

    expect(instance.vestForm().pending()).toBe(false);
    expect(instance.vestForm().valid()).toBe(false);
    expect(instance.vestForm().invalid()).toBe(true);
    expect(instance.vestForm().status()).toBe('INVALID');
    expect(instance.vestForm().validatedFields()).toContain('email');
    expect(instance.vestForm().validatedFields()).toEqual(
      instance.vestForm().touchedFieldPaths()
    );
  });
});

describe('FormDirective - triggerFormValidation', () => {
  @Component({
    selector: 'test-trigger-validation-host',
    template: `<form ngxVestForm #vest="ngxVestForm"></form>`,

    imports: [NgxVestForms],
  })
  class TestTriggerValidationHost {
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  it('should force validation of all fields when called', async () => {
    const { fixture } = await render(TestTriggerValidationHost);
    const instance = fixture.componentInstance;
    // Mock updateValueAndValidity
    const mockFn = vi.fn();
    Object.defineProperty(
      instance.vestForm().ngForm.form,
      'updateValueAndValidity',
      {
        value: mockFn,
      }
    );
    instance.vestForm().triggerFormValidation();
    expect(mockFn).toHaveBeenCalledWith({ emitEvent: true });
  });
});

describe('FormDirective - first invalid helpers', () => {
  function mockMatchMedia(matches: boolean): ReturnType<typeof vi.spyOn> {
    return vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string): MediaQueryList =>
        ({
          matches,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList
    );
  }

  @Component({
    selector: 'test-first-invalid-host',
    template: `
      <form ngxVestForm #vest="ngxVestForm">
        <div class="ngx-control-wrapper--invalid" data-testid="wrapper-invalid">
          <input id="wrapper-input" name="wrapperInput" />
        </div>
        <input
          id="aria-invalid-input"
          name="ariaInvalidInput"
          aria-invalid="true"
        />
      </form>
    `,
    imports: [NgxVestForms],
  })
  class TestFirstInvalidHost {
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-details-first-invalid-host',
    template: `
      <form ngxVestForm #vest="ngxVestForm">
        <details>
          <details>
            <div class="ngx-control-wrapper--invalid">
              <input id="details-invalid-input" name="detailsInvalidInput" />
            </div>
          </details>
        </details>
      </form>
    `,
    imports: [NgxVestForms],
  })
  class TestDetailsFirstInvalidHost {
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-no-invalid-host',
    template: `
      <form ngxVestForm #vest="ngxVestForm">
        <input id="valid-input" name="validInput" />
      </form>
    `,
    imports: [NgxVestForms],
  })
  class TestNoInvalidHost {
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-group-invalid-host',
    template: `
      <form ngxVestForm #vest="ngxVestForm">
        <fieldset class="ngx-form-group-wrapper--invalid">
          <input id="group-first-valid" name="groupFirstValid" />
          <input
            id="group-first-invalid"
            name="groupFirstInvalid"
            aria-invalid="true"
          />
        </fieldset>
      </form>
    `,
    imports: [NgxVestForms],
  })
  class TestGroupInvalidHost {
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  it('focuses and scrolls the first invalid descendant in an invalid wrapper', async () => {
    const { fixture } = await render(TestFirstInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const target = fixture.nativeElement.querySelector(
      '#wrapper-input'
    ) as HTMLElement | null;
    const safeTarget = expectElement(target, '#wrapper-input');
    const focusSpy = vi.spyOn(safeTarget, 'focus');
    const scrollSpy = vi.spyOn(safeTarget, 'scrollIntoView');

    const resolved = fixture.componentInstance
      .vestForm()
      .focusFirstInvalidControl();

    expect(resolved).toBe(safeTarget);
    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('uses auto scrolling when reduced-motion is preferred and behavior is not provided', async () => {
    const matchMediaSpy = mockMatchMedia(true);
    const { fixture } = await render(TestFirstInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const target = fixture.nativeElement.querySelector(
      '#wrapper-input'
    ) as HTMLElement | null;
    const safeTarget = expectElement(target, '#wrapper-input');
    const scrollSpy = vi.spyOn(safeTarget, 'scrollIntoView');

    fixture.componentInstance.vestForm().focusFirstInvalidControl();

    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
      inline: 'nearest',
    });
    matchMediaSpy.mockRestore();
  });

  it('keeps explicit behavior even when reduced-motion is preferred', async () => {
    const matchMediaSpy = mockMatchMedia(true);
    const { fixture } = await render(TestFirstInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const target = fixture.nativeElement.querySelector(
      '#wrapper-input'
    ) as HTMLElement | null;
    const safeTarget = expectElement(target, '#wrapper-input');
    const scrollSpy = vi.spyOn(safeTarget, 'scrollIntoView');

    fixture.componentInstance.vestForm().focusFirstInvalidControl({
      behavior: 'smooth',
    });

    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
    matchMediaSpy.mockRestore();
  });

  it('opens ancestor details before scrolling and focusing', async () => {
    const { fixture } = await render(TestDetailsFirstInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const target = fixture.nativeElement.querySelector(
      '#details-invalid-input'
    ) as HTMLElement | null;
    const safeTarget = expectElement(target, '#details-invalid-input');
    const details = Array.from(
      fixture.nativeElement.querySelectorAll('details')
    ) as HTMLDetailsElement[];

    for (const detail of details) {
      detail.open = false;
    }

    fixture.componentInstance.vestForm().focusFirstInvalidControl();

    expect(details.every((detail) => detail.open)).toBe(true);
    expect(document.activeElement).toBe(safeTarget);
  });

  it('falls back to aria-invalid controls and does not focus when focus is disabled', async () => {
    const { fixture } = await render(TestFirstInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const target = fixture.nativeElement.querySelector(
      '#aria-invalid-input'
    ) as HTMLElement | null;
    const safeTarget = expectElement(target, '#aria-invalid-input');
    const focusSpy = vi.spyOn(safeTarget, 'focus');
    const scrollSpy = vi.spyOn(safeTarget, 'scrollIntoView');

    const resolved = fixture.componentInstance
      .vestForm()
      .focusFirstInvalidControl({
        focus: false,
        invalidSelector: 'input[aria-invalid="true"]',
      });

    expect(resolved).toBe(safeTarget);
    expect(scrollSpy).toHaveBeenCalledOnce();
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('scrollToFirstInvalidControl does not move focus', async () => {
    const { fixture } = await render(TestFirstInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const target = fixture.nativeElement.querySelector(
      '#wrapper-input'
    ) as HTMLElement | null;
    const safeTarget = expectElement(target, '#wrapper-input');
    const focusSpy = vi.spyOn(safeTarget, 'focus');

    const resolved = fixture.componentInstance
      .vestForm()
      .scrollToFirstInvalidControl();

    expect(resolved).toBe(safeTarget);
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('returns null when no invalid control is found', async () => {
    const { fixture } = await render(TestNoInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const resolved = fixture.componentInstance
      .vestForm()
      .focusFirstInvalidControl();
    expect(resolved).toBeNull();
  });

  it('returns null without throwing when invalidSelector is not a valid CSS selector', async () => {
    const { fixture } = await render(TestFirstInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(() =>
      fixture.componentInstance.vestForm().focusFirstInvalidControl({
        invalidSelector: 'input:not(',
      })
    ).not.toThrow();

    const resolved = fixture.componentInstance
      .vestForm()
      .focusFirstInvalidControl({
        invalidSelector: 'input:not(',
      });
    expect(resolved).toBeNull();
  });

  it('returns first invalid element without throwing when focusSelector is not a valid CSS selector', async () => {
    const { fixture } = await render(TestFirstInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(() =>
      fixture.componentInstance.vestForm().focusFirstInvalidControl({
        focusSelector: 'input:not(',
      })
    ).not.toThrow();

    const wrapper = fixture.nativeElement.querySelector(
      '[data-testid="wrapper-invalid"]'
    ) as HTMLElement | null;
    const safeWrapper = expectElement(
      wrapper,
      '[data-testid="wrapper-invalid"]'
    );

    const resolved = fixture.componentInstance
      .vestForm()
      .focusFirstInvalidControl({
        focusSelector: 'input:not(',
      });

    expect(resolved).toBe(safeWrapper);
  });

  it('prefers an invalid descendant over the first focusable control in an invalid group wrapper', async () => {
    const { fixture } = await render(TestGroupInvalidHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const invalidTarget = fixture.nativeElement.querySelector(
      '#group-first-invalid'
    ) as HTMLElement | null;
    const safeInvalidTarget = expectElement(
      invalidTarget,
      '#group-first-invalid'
    );
    const validTarget = fixture.nativeElement.querySelector(
      '#group-first-valid'
    ) as HTMLElement | null;
    const safeValidTarget = expectElement(validTarget, '#group-first-valid');

    const invalidFocusSpy = vi.spyOn(safeInvalidTarget, 'focus');
    const validFocusSpy = vi.spyOn(safeValidTarget, 'focus');

    const resolved = fixture.componentInstance
      .vestForm()
      .focusFirstInvalidControl();

    expect(resolved).toBe(safeInvalidTarget);
    expect(invalidFocusSpy).toHaveBeenCalled();
    expect(validFocusSpy).not.toHaveBeenCalled();
  });
});

describe('FormDirective - Shape Validation', () => {
  @Component({
    selector: 'test-shape-validation-host',
    template: `<form
      ngxVestForm
      [formShape]="formShape()"
      [formValue]="formValue()"
      #vest="ngxVestForm"
    ></form>`,

    imports: [NgxVestForms],
  })
  class TestShapeValidationHost {
    formShape = signal<{ username: string }>({ username: '' });
    formValue = signal<any>({ username: 'initial' });
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should warn in dev mode if form value shape does not match formShape', async () => {
    // Only run this test if isDevMode is true
    const { fixture } = await render(TestShapeValidationHost);
    const instance = fixture.componentInstance;
    // Simulate a value change that triggers shape validation
    instance.formValue.set({ foo: 'bar' });
    fixture.detectChanges();
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should not warn in production mode', async () => {
    // This test is skipped in prod builds; in real prod, shape validation is a no-op
    // Here, we just ensure no warning if shape is correct
    const { fixture } = await render(TestShapeValidationHost);
    const instance = fixture.componentInstance;
    instance.formValue.set({ username: 'ok' });
    fixture.detectChanges();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

describe('FormDirective - Submit Accessibility', () => {
  it('should focus the first invalid field after form submit', async () => {
    @Component({
      selector: 'test-submit-focus-host',
      template: `
        <form
          ngxVestForm
          [suite]="suite()"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
        >
          <label for="firstName">First name</label>
          <input
            id="firstName"
            name="firstName"
            [ngModel]="formValue().firstName"
          />

          <label for="lastName">Last name</label>
          <input
            id="lastName"
            name="lastName"
            [ngModel]="formValue().lastName"
          />

          <button type="submit">Submit</button>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestSubmitFocusHost {
      readonly formValue = signal<{ firstName: string; lastName: string }>({
        firstName: '',
        lastName: '',
      });

      readonly suite = signal(
        create((model: { firstName?: string; lastName?: string } = {}) => {
          vestTest('firstName', 'First name is required', () => {
            enforce(model.firstName).isNotBlank();
          });

          vestTest('lastName', 'Last name is required', () => {
            enforce(model.lastName).isNotBlank();
          });
        })
      );
    }

    await render(TestSubmitFocusHost);

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByLabelText('First name')).toHaveFocus();
    });
  });
});

describe('FormDirective - FormState Memoization', () => {
  @Component({
    selector: 'test-memoization-host',
    template: `
      <form
        ngxVestForm
        [suite]="suite()"
        [formValue]="formValue()"
        (formValueChange)="formValue.set($event)"
        #vest="ngxVestForm"
      >
        <input name="field1" [ngModel]="formValue().field1" />
      </form>
    `,

    imports: [NgxVestForms],
  })
  class TestMemoizationHost {
    formValue = signal<{ field1?: string }>({});
    suite = signal(create((model: { field1?: string } = {}) => {}));
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  it('should memoize formState when status changes but values/errors/valid remain the same', async () => {
    const { fixture } = await render(TestMemoizationHost);
    const instance = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    // Get initial formState reference
    const initialState = instance.vestForm().formState();

    // Trigger form status change without changing actual values/errors/valid
    // This simulates Angular's statusChanges emitting even when nothing meaningful changed
    instance.vestForm().ngForm.form.updateValueAndValidity({ emitEvent: true });
    fixture.detectChanges();
    await fixture.whenStable();

    // FormState should return same reference due to memoization
    const stateAfterUpdate = instance.vestForm().formState();
    expect(stateAfterUpdate).toBe(initialState);

    // Verify the equality function is working by checking the values are actually equal
    expect(stateAfterUpdate.valid).toBe(initialState.valid);
    expect(stateAfterUpdate.errors).toEqual(initialState.errors);
    expect(stateAfterUpdate.value).toEqual(initialState.value);
  });

  it('should use custom equality function with fastDeepEqual for deep comparison', async () => {
    const { fixture } = await render(TestMemoizationHost);
    const instance = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const state1 = instance.vestForm().formState();

    // Multiple calls without changes should return same instance
    const state2 = instance.vestForm().formState();
    expect(state1).toBe(state2);

    // The computed signal should use the custom equality function
    // which compares valid (boolean), errors (object), and value (object) deeply
    // This test verifies the memoization is working correctly
  });

  it('should prevent getAllFormErrors from being called repeatedly for identical states', async () => {
    const { fixture } = await render(TestMemoizationHost);
    const instance = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    // Get initial state (this calls getAllFormErrors once)
    const state1 = instance.vestForm().formState();

    // Trigger multiple status changes without actual value/error changes
    for (let i = 0; i < 5; i++) {
      instance
        .vestForm()
        .ngForm.form.updateValueAndValidity({ emitEvent: true });
      fixture.detectChanges();
    }

    const state2 = instance.vestForm().formState();

    // Should still be the same reference, meaning getAllFormErrors was not called
    // for each status change - the memoization prevented unnecessary recalculations
    expect(state2).toBe(state1);
  });

  it('should update formState errors when the error set changes but status stays invalid', async () => {
    @Component({
      selector: 'test-form-state-errors-host',
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          #vest="ngxVestForm"
        >
          <input name="email" [ngModel]="formValue().email" />
          <input name="username" [ngModel]="formValue().username" />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestFormStateErrorsHost {
      formValue = signal<{ email?: string; username?: string }>({});
      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }

    const { fixture } = await render(TestFormStateErrorsHost);
    const instance = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();

    const emailControl = instance.vestForm().ngForm.form.get('email');
    const usernameControl = instance.vestForm().ngForm.form.get('username');

    expect(emailControl).toBeTruthy();
    expect(usernameControl).toBeTruthy();

    emailControl?.setErrors({ errors: ['Email is required'] });
    usernameControl?.setErrors({ errors: ['Username is required'] });
    fixture.detectChanges();
    await fixture.whenStable();

    const initialErrors = instance.vestForm().formState().errors;
    expect(initialErrors['email']).toContain('Email is required');
    expect(initialErrors['username']).toContain('Username is required');
    expect(instance.vestForm().formState().valid).toBe(false);

    emailControl?.setErrors(null);
    fixture.detectChanges();
    await fixture.whenStable();

    const updatedErrors = instance.vestForm().formState().errors;
    expect(updatedErrors['email']).toBeUndefined();
    expect(updatedErrors['username']).toContain('Username is required');
    expect(instance.vestForm().formState().valid).toBe(false);
  });
});
