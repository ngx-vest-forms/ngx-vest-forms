/* eslint-disable @angular-eslint/component-selector */
import {
  ApplicationRef,
  Component,
  ErrorHandler,
  forwardRef,
  signal,
  Type,
  viewChild,
  ViewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { isObservable, Observable } from 'rxjs';
import {
  create,
  enforce,
  omitWhen,
  skipWhen,
  test as vestTest,
  warn,
} from 'vest';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest';
import type { StandardSchemaV1 } from '../../public-api';
import {
  FormDirective,
  NgxFieldBlurEvent,
  NgxSubmitSettledEvent,
} from '../directives/form.directive';
import { NgxVestForms } from '../exports';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from '../tokens/debounce.token';
import {
  provideFormContract,
  provideFormContractFactory,
} from '../tokens/form-contract.token';
import { createValidationConfig } from '../utils/validation-config-builder';
import type { NgxVestSuite } from '../utils/validation-suite';
// Helper to await either a Promise or Observable
async function awaitResult<T>(result: Promise<T> | Observable<T>) {
  if (isObservable(result)) {
    return await firstValueFrom(result);
  }
  return await result;
}

import { firstValueFrom } from 'rxjs';

const whenStable = () => TestBed.inject(ApplicationRef).whenStable();

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

type TestContractIssuePathSegment = string | number | { key: string | number };
type TestContractIssue = {
  message: string;
  path?: ReadonlyArray<TestContractIssuePathSegment>;
};

function createIssueContract(
  issues: readonly TestContractIssue[] = []
): StandardSchemaV1<Record<string, unknown>> {
  return {
    '~standard': {
      version: 1,
      vendor: 'ngx-vest-forms-tests',
      validate(value) {
        return issues.length > 0
          ? { issues: [...issues] }
          : { value: value as Record<string, unknown> };
      },
    },
  };
}

function createAsyncIssueContract(
  issues: readonly TestContractIssue[]
): StandardSchemaV1<Record<string, unknown>> {
  return {
    '~standard': {
      version: 1,
      vendor: 'ngx-vest-forms-tests',
      async validate(value) {
        return issues.length > 0
          ? { issues: [...issues] }
          : { value: value as Record<string, unknown> };
      },
    },
  };
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
    // (advancing 0ms flushes the zoneless scheduler's render timer)
    instance.formValue.set({ username: 'a' });
    await vi.advanceTimersByTimeAsync(0);
    instance.formValue.set({ username: 'ab' });
    await vi.advanceTimersByTimeAsync(0);
    instance.formValue.set({ username: 'abc' });
    await vi.advanceTimersByTimeAsync(0);

    // Advance time less than debounce window (simulate debounceTime: 150ms)
    await vi.advanceTimersByTimeAsync(100);
    // No validation should have run yet
    expect(instance.count()).toBe(0);

    // Advance past debounce window
    await vi.advanceTimersByTimeAsync(100);
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
    suite = signal(vi.fn() as unknown as NgxVestSuite<Record<string, unknown>>);
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
    const handleError = vi.fn();
    const { fixture } = await render(TestFormThrowComponent, {
      providers: [{ provide: ErrorHandler, useValue: { handleError } }],
    });
    handleError.mockClear();
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
    // The original error is reported, not swallowed.
    expect(handleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Vest suite execution error' })
    );
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

  it('keeps the fieldWarnings map when a re-run yields the same warnings', async () => {
    @Component({
      selector: 'test-stable-warnings-host',
      template: `<form
        ngxVestForm
        [suite]="suite()"
        #vest="ngxVestForm"
      ></form>`,
      imports: [NgxVestForms],
    })
    class TestStableWarningsHost {
      suite = signal(
        create((model: { password?: string } = {}) => {
          vestTest('password', 'Password is weak', () => {
            warn();
            enforce(model.password ?? '').longerThan(12);
          });
        })
      );
      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }
    const { fixture } = await render(TestStableWarningsHost);
    const vestForm = fixture.componentInstance.vestForm();
    const validator = vestForm.createAsyncValidator('password', {
      debounceTime: 0,
    });
    const run = async (value: string) => {
      const result = awaitResult(validator({ value } as any));
      vi.runAllTimers();
      await Promise.resolve();
      return result;
    };

    await run('Short123');
    const firstMap = vestForm.fieldWarnings();
    expect(firstMap.get('password')).toEqual(['Password is weak']);

    await run('Short1234');
    expect(vestForm.fieldWarnings()).toBe(firstMap);

    await run('a-long-enough-password');
    expect(vestForm.fieldWarnings().has('password')).toBe(false);
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
          new Promise((resolve, reject) => {
            this.rejectPendingRun = () => {
              const rejection = new Error('rejected');

              if (onrejected) {
                resolve(onrejected(rejection));
                return;
              }

              reject(rejection);
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

    await whenStable();

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

    await expect.poll(() => firstNameInput.value).toBe('Ada');
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
    expect(instance.vestForm().fieldBlur).toBeDefined();
  });

  it('should emit field blur metadata for named controls', async () => {
    @Component({
      selector: 'test-field-blur-host',
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          (fieldBlur)="handleFieldBlur($event)"
        >
          <label for="projectName">Project name</label>
          <input
            id="projectName"
            name="projectName"
            [ngModel]="formValue().projectName"
          />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestFieldBlurHost {
      readonly formValue = signal<{ projectName?: string }>({
        projectName: '',
      });
      readonly blurEvents = signal<
        Array<NgxFieldBlurEvent<{ projectName?: string }>>
      >([]);

      handleFieldBlur(
        event: NgxFieldBlurEvent<{ projectName?: string }>
      ): void {
        this.blurEvents.update((events) => [...events, event]);
      }
    }

    const { fixture } = await render(TestFieldBlurHost);
    await whenStable();

    const input = fixture.nativeElement.querySelector(
      '#projectName'
    ) as HTMLInputElement | null;
    expect(input).toBeTruthy();

    if (!input) {
      throw new Error('Expected #projectName input to exist');
    }

    await userEvent.clear(input);
    await userEvent.type(input, 'Angular course');
    await whenStable();

    await userEvent.tab();
    await expect
      .poll(() => fixture.componentInstance.blurEvents().length)
      .toBe(1);

    const [blurEvent] = fixture.componentInstance.blurEvents();
    expect(blurEvent).toBeTruthy();
    expect(blurEvent?.field).toBe('projectName');
    expect(blurEvent?.value).toBe('Angular course');
    expect(blurEvent?.touched).toBe(true);
    expect(blurEvent?.dirty).toBe(true);
    expect(blurEvent?.formValue).toEqual({
      projectName: 'Angular course',
    });
  });

  it('should emit the latest blur snapshot even when model sync is delayed', async () => {
    @Component({
      selector: 'test-field-blur-delayed-sync-host',
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="delayFormValueUpdate($event)"
          (fieldBlur)="handleFieldBlur($event)"
        >
          <label for="projectName">Project name</label>
          <input
            id="projectName"
            name="projectName"
            [ngModel]="formValue().projectName"
          />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestFieldBlurDelayedSyncHost {
      readonly formValue = signal<{ projectName?: string }>({
        projectName: '',
      });
      readonly blurEvents = signal<
        Array<NgxFieldBlurEvent<{ projectName?: string }>>
      >([]);

      delayFormValueUpdate(value: { projectName?: string }): void {
        setTimeout(() => {
          this.formValue.set(value);
        }, 0);
      }

      handleFieldBlur(
        event: NgxFieldBlurEvent<{ projectName?: string }>
      ): void {
        this.blurEvents.update((events) => [...events, event]);
      }
    }

    const { fixture } = await render(TestFieldBlurDelayedSyncHost);
    await whenStable();

    const input = fixture.nativeElement.querySelector(
      '#projectName'
    ) as HTMLInputElement | null;
    expect(input).toBeTruthy();

    if (!input) {
      throw new Error('Expected #projectName input to exist');
    }

    // delay: null keeps user-event from yielding a macrotask between actions,
    // so the host's setTimeout(0) model sync is still pending at blur time.
    const user = userEvent.setup({ delay: null });
    await user.clear(input);
    await user.type(input, 'Recovered draft');
    await user.tab();
    await expect
      .poll(() => fixture.componentInstance.blurEvents().length)
      .toBe(1);

    const [blurEvent] = fixture.componentInstance.blurEvents();
    expect(blurEvent).toBeTruthy();
    expect(blurEvent?.value).toBe('Recovered draft');
    expect(blurEvent?.formValue).toEqual({
      projectName: 'Recovered draft',
    });
  });

  it('should include recent edits from other fields in later blur snapshots', async () => {
    @Component({
      selector: 'test-field-blur-cross-field-snapshot-host',
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          (fieldBlur)="handleFieldBlur($event)"
        >
          <label for="projectName">Project name</label>
          <input
            id="projectName"
            name="projectName"
            [ngModel]="formValue().projectName"
          />

          <label for="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            [ngModel]="formValue().notes"
          ></textarea>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestFieldBlurCrossFieldSnapshotHost {
      readonly formValue = signal<{
        projectName?: string;
        notes?: string;
      }>({
        projectName: 'Release checklist',
        notes: '',
      });
      readonly blurEvents = signal<
        Array<
          NgxFieldBlurEvent<{
            projectName?: string;
            notes?: string;
          }>
        >
      >([]);

      handleFieldBlur(
        event: NgxFieldBlurEvent<{
          projectName?: string;
          notes?: string;
        }>
      ): void {
        this.blurEvents.update((events) => [...events, event]);
      }
    }

    const { fixture } = await render(TestFieldBlurCrossFieldSnapshotHost);
    await whenStable();

    const projectName = fixture.nativeElement.querySelector(
      '#projectName'
    ) as HTMLInputElement | null;
    const notes = fixture.nativeElement.querySelector(
      '#notes'
    ) as HTMLTextAreaElement | null;

    expect(projectName).toBeTruthy();
    expect(notes).toBeTruthy();

    if (!projectName || !notes) {
      throw new Error('Expected projectName and notes controls to exist');
    }

    await userEvent.clear(notes);
    await userEvent.type(
      notes,
      'Add deployment notes for the production team.'
    );
    await whenStable();

    projectName.focus();
    projectName.blur();
    await expect
      .poll(() =>
        fixture.componentInstance
          .blurEvents()
          .some((event) => event.field === 'projectName')
      )
      .toBe(true);

    const blurEvent = fixture.componentInstance
      .blurEvents()
      .find((event) => event.field === 'projectName');

    expect(blurEvent).toBeTruthy();
    expect(blurEvent?.formValue).toEqual({
      projectName: 'Release checklist',
      notes: 'Add deployment notes for the production team.',
    });
  });

  it('should emit the full dotted path for controls inside ngModelGroup', async () => {
    type Model = { passwords?: { password?: string; confirm?: string } };

    @Component({
      selector: 'test-field-blur-group-host',
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          (fieldBlur)="handleFieldBlur($event)"
        >
          <div ngModelGroup="passwords">
            <label for="password">Password</label>
            <input
              id="password"
              name="password"
              [ngModel]="formValue().passwords?.password"
            />
            <label for="confirm">Confirm</label>
            <input
              id="confirm"
              name="confirm"
              [ngModel]="formValue().passwords?.confirm"
            />
          </div>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestFieldBlurGroupHost {
      readonly formValue = signal<Model>({ passwords: {} });
      readonly blurEvents = signal<Array<NgxFieldBlurEvent<Model>>>([]);

      handleFieldBlur(event: NgxFieldBlurEvent<Model>): void {
        this.blurEvents.update((events) => [...events, event]);
      }
    }

    const { fixture } = await render(TestFieldBlurGroupHost);
    await whenStable();

    const input = fixture.nativeElement.querySelector(
      '#password'
    ) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'hunter2');
    await whenStable();

    await userEvent.tab();
    await expect
      .poll(() => fixture.componentInstance.blurEvents().length)
      .toBe(1);

    const [blurEvent] = fixture.componentInstance.blurEvents();
    expect(blurEvent).toBeTruthy();
    expect(blurEvent?.field).toBe('passwords.password');
    expect(blurEvent?.value).toBe('hunter2');
    expect(blurEvent?.formValue).toEqual({
      passwords: { password: 'hunter2' },
    });
  });

  it('should report the custom control host, not its internal ngModel', async () => {
    type Model = { startDate?: string };

    @Component({
      selector: 'test-inner-model-control',
      template: `<input id="inner" name="day" [(ngModel)]="day" />`,
      imports: [NgxVestForms],
      providers: [
        {
          provide: NG_VALUE_ACCESSOR,
          useExisting: forwardRef(() => TestInnerModelControl),
          multi: true,
        },
      ],
    })
    class TestInnerModelControl implements ControlValueAccessor {
      day = '';
      writeValue(value: string | null): void {
        this.day = value ?? '';
      }
      registerOnChange(): void {
        // Not needed for this test.
      }
      registerOnTouched(): void {
        // Not needed for this test.
      }
    }

    @Component({
      selector: 'test-field-blur-inner-model-host',
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          (fieldBlur)="handleFieldBlur($event)"
        >
          <test-inner-model-control
            name="startDate"
            [ngModel]="formValue().startDate"
          />
        </form>
      `,
      imports: [NgxVestForms, TestInnerModelControl],
    })
    class TestFieldBlurInnerModelHost {
      readonly formValue = signal<Model>({ startDate: '2026-10-14' });
      readonly blurEvents = signal<Array<NgxFieldBlurEvent<Model>>>([]);

      handleFieldBlur(event: NgxFieldBlurEvent<Model>): void {
        this.blurEvents.update((events) => [...events, event]);
      }
    }

    const { fixture } = await render(TestFieldBlurInnerModelHost);
    await whenStable();

    const inner = fixture.nativeElement.querySelector(
      '#inner'
    ) as HTMLInputElement;
    inner.focus();
    inner.blur();
    await expect
      .poll(() => fixture.componentInstance.blurEvents().length)
      .toBe(1);

    const [blurEvent] = fixture.componentInstance.blurEvents();
    expect(blurEvent?.field).toBe('startDate');
    expect(blurEvent?.value).toBe('2026-10-14');
  });

  it('should emit the selected radio group value, not the focused option', async () => {
    type Model = { gender?: string };

    @Component({
      selector: 'test-field-blur-radio-host',
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          (fieldBlur)="handleFieldBlur($event)"
        >
          <label
            ><input
              type="radio"
              name="gender"
              value="female"
              [ngModel]="formValue().gender"
            />Female</label
          >
          <label
            ><input
              id="male"
              type="radio"
              name="gender"
              value="male"
              [ngModel]="formValue().gender"
            />Male</label
          >
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestFieldBlurRadioHost {
      readonly formValue = signal<Model>({ gender: 'female' });
      readonly blurEvents = signal<Array<NgxFieldBlurEvent<Model>>>([]);

      handleFieldBlur(event: NgxFieldBlurEvent<Model>): void {
        this.blurEvents.update((events) => [...events, event]);
      }
    }

    const { fixture } = await render(TestFieldBlurRadioHost);
    await whenStable();

    const unselectedRadio = fixture.nativeElement.querySelector(
      '#male'
    ) as HTMLInputElement;
    // The "male" radio is focused but NOT checked — the bound value remains "female".
    unselectedRadio.focus();
    unselectedRadio.blur();
    await expect
      .poll(() => fixture.componentInstance.blurEvents().length)
      .toBe(1);

    const [blurEvent] = fixture.componentInstance.blurEvents();
    expect(blurEvent).toBeTruthy();
    // Must reflect the *selected* group value, not the focused unchecked option.
    expect(blurEvent?.value).toBe('female');
    expect(blurEvent?.formValue).toEqual({ gender: 'female' });
  });

  it('should disambiguate repeated leaf names across sibling ngModelGroups', async () => {
    type Range = { day?: string };
    type Model = { from?: Range; to?: Range };

    @Component({
      selector: 'test-field-blur-repeated-leaf-host',
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          (fieldBlur)="handleFieldBlur($event)"
        >
          <div ngModelGroup="from">
            <label for="from-day">From day</label>
            <input id="from-day" name="day" [ngModel]="formValue().from?.day" />
          </div>
          <div ngModelGroup="to">
            <label for="to-day">To day</label>
            <input id="to-day" name="day" [ngModel]="formValue().to?.day" />
          </div>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestFieldBlurRepeatedLeafHost {
      readonly formValue = signal<Model>({ from: {}, to: {} });
      readonly blurEvents = signal<Array<NgxFieldBlurEvent<Model>>>([]);

      handleFieldBlur(event: NgxFieldBlurEvent<Model>): void {
        this.blurEvents.update((events) => [...events, event]);
      }
    }

    const { fixture } = await render(TestFieldBlurRepeatedLeafHost);
    await whenStable();

    const toDay = fixture.nativeElement.querySelector(
      '#to-day'
    ) as HTMLInputElement;
    await userEvent.clear(toDay);
    await userEvent.type(toDay, '2026-05-10');
    await whenStable();

    await userEvent.tab();
    await expect
      .poll(() => fixture.componentInstance.blurEvents().length)
      .toBe(1);

    const [blurEvent] = fixture.componentInstance.blurEvents();
    expect(blurEvent).toBeTruthy();
    // Must resolve to `to.day`, not `from.day` — both leaves share the same name.
    expect(blurEvent?.field).toBe('to.day');
    expect(blurEvent?.value).toBe('2026-05-10');
    expect(blurEvent?.formValue).toEqual({
      from: {},
      to: { day: '2026-05-10' },
    });
  });

  it('should resolve paths through dynamic [ngModelGroup] with numeric keys', async () => {
    type Slot = { from?: string; to?: string };
    type Model = { slots?: Record<string, Slot> };

    @Component({
      selector: 'test-field-blur-dynamic-group-host',
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          (fieldBlur)="handleFieldBlur($event)"
        >
          <div ngModelGroup="slots">
            @for (item of items; track item) {
              <div [ngModelGroup]="item">
                <input
                  [id]="'from-' + item"
                  name="from"
                  [ngModel]="formValue().slots?.[item]?.from"
                />
                <input
                  [id]="'to-' + item"
                  name="to"
                  [ngModel]="formValue().slots?.[item]?.to"
                />
              </div>
            }
          </div>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestFieldBlurDynamicGroupHost {
      readonly items = ['0', '1'];
      readonly formValue = signal<Model>({ slots: { '0': {}, '1': {} } });
      readonly blurEvents = signal<Array<NgxFieldBlurEvent<Model>>>([]);

      handleFieldBlur(event: NgxFieldBlurEvent<Model>): void {
        this.blurEvents.update((events) => [...events, event]);
      }
    }

    const { fixture } = await render(TestFieldBlurDynamicGroupHost);
    await whenStable();

    // Blur the second slot's `to` input — identical name+structure as slot 0,
    // distinguished only by the dynamic `[ngModelGroup]="'1'"` ancestor.
    const target = fixture.nativeElement.querySelector(
      '#to-1'
    ) as HTMLInputElement;
    await userEvent.clear(target);
    await userEvent.type(target, '17:30');
    await whenStable();

    await userEvent.tab();
    await expect
      .poll(() => fixture.componentInstance.blurEvents().length)
      .toBe(1);

    const [blurEvent] = fixture.componentInstance.blurEvents();
    expect(blurEvent).toBeTruthy();
    expect(blurEvent?.field).toBe('slots.1.to');
    expect(blurEvent?.value).toBe('17:30');
    expect(blurEvent?.formValue).toEqual({
      slots: { '0': {}, '1': { to: '17:30' } },
    });
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

describe('FormDirective - clearSubmittedState', () => {
  @Component({
    selector: 'test-clear-submitted-state-host',
    template: `
      <form ngxVestForm #vest="ngxVestForm">
        <input
          ngxErrorDisplay
          [errorDisplayMode]="'on-submit'"
          #display="ngxErrorDisplay"
          name="username"
          [ngModel]="model"
          required
        />
        <span data-testid="form-submitted">{{ display.formSubmitted() }}</span>
        <span data-testid="should-show-errors">{{
          display.shouldShowErrors()
        }}</span>
        <span data-testid="is-touched">{{ display.isTouched() }}</span>
        <button type="submit">Submit</button>
      </form>
    `,
    imports: [NgxVestForms],
  })
  class TestClearSubmittedStateHost {
    model = '';
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  it('should clear submitted state without resetting touched controls', async () => {
    const { fixture } = await render(TestClearSubmittedStateHost);
    await whenStable();

    const input = expectElement(
      fixture.nativeElement.querySelector('input'),
      'input'
    ) as HTMLInputElement;
    input.focus();
    input.blur();
    await whenStable();

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('[data-testid="is-touched"]')
            ?.textContent
      )
      .toBe('true');

    const submitButton = expectElement(
      fixture.nativeElement.querySelector('button[type="submit"]'),
      'button[type="submit"]'
    ) as HTMLButtonElement;
    await userEvent.click(submitButton);
    await whenStable();

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('[data-testid="form-submitted"]')
            ?.textContent
      )
      .toBe('true');
    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector(
            '[data-testid="should-show-errors"]'
          )?.textContent
      )
      .toBe('true');

    fixture.componentInstance.vestForm().clearSubmittedState();
    await whenStable();

    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('[data-testid="form-submitted"]')
            ?.textContent
      )
      .toBe('false');
    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector(
            '[data-testid="should-show-errors"]'
          )?.textContent
      )
      .toBe('false');
    await expect
      .poll(
        () =>
          fixture.nativeElement.querySelector('[data-testid="is-touched"]')
            ?.textContent
      )
      .toBe('true');
    expect(input.classList.contains('ng-touched')).toBe(true);
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
    await whenStable();

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
    await whenStable();

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
    await whenStable();

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
    await whenStable();

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
    await whenStable();

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
    await whenStable();

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
    await whenStable();

    const resolved = fixture.componentInstance
      .vestForm()
      .focusFirstInvalidControl();
    expect(resolved).toBeNull();
  });

  it('returns null without throwing when invalidSelector is not a valid CSS selector', async () => {
    const { fixture } = await render(TestFirstInvalidHost);
    await whenStable();

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
    await whenStable();

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
    await whenStable();

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

describe('FormDirective - Form Contracts', () => {
  @Component({
    selector: 'test-legacy-shape-contract-host',
    template: `<form
      ngxVestForm
      [formContract]="legacyContract()"
      [formValue]="formValue()"
      #vest="ngxVestForm"
    ></form>`,

    imports: [NgxVestForms],
  })
  class TestLegacyShapeContractHost {
    legacyContract = signal<{ username: string }>({ username: '' });
    formValue = signal<any>({ username: 'initial' });
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-injected-form-contract-host',
    template: `<form
      ngxVestForm
      [formValue]="formValue()"
      #vest="ngxVestForm"
    ></form>`,
    imports: [NgxVestForms],
    providers: [provideFormContract({ username: '' })],
  })
  class TestInjectedFormContractHost {
    formValue = signal<any>({ username: 'initial' });
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-factory-form-contract-host',
    template: `<form
      ngxVestForm
      [formValue]="formValue()"
      #vest="ngxVestForm"
    ></form>`,
    imports: [NgxVestForms],
    providers: [provideFormContractFactory(() => ({ username: '' }))],
  })
  class TestFactoryFormContractHost {
    formValue = signal<any>({ username: 'initial' });
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-form-contract-override-host',
    template: `<form
      ngxVestForm
      [formContract]="formContract()"
      [formValue]="formValue()"
      #vest="ngxVestForm"
    ></form>`,
    imports: [NgxVestForms],
    providers: [provideFormContract({ providerOnly: '' })],
  })
  class TestFormContractOverrideHost {
    formContract = signal<{ explicitOnly: string }>({ explicitOnly: '' });
    formValue = signal<any>({ explicitOnly: 'initial' });
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-form-contract-null-override-host',
    template: `<form
      ngxVestForm
      [formContract]="formContract()"
      [formValue]="formValue()"
      #vest="ngxVestForm"
    ></form>`,
    imports: [NgxVestForms],
    providers: [provideFormContract({ providerOnly: '' })],
  })
  class TestFormContractNullOverrideHost {
    formContract = signal<null>(null);
    formValue = signal<any>({ providerOnly: 'initial' });
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-schema-issue-contract-host',
    template: `<form
      ngxVestForm
      [formContract]="formContract()"
      [formValue]="formValue()"
      #vest="ngxVestForm"
    ></form>`,
    imports: [NgxVestForms],
  })
  class TestSchemaIssueContractHost {
    formContract = signal<StandardSchemaV1<Record<string, unknown>>>(
      createIssueContract()
    );
    formValue = signal<Record<string, unknown>>({});
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  @Component({
    selector: 'test-partial-legacy-contract-host',
    template: `<form
      ngxVestForm
      [formContract]="formContract()"
      [formValue]="formValue()"
      #vest="ngxVestForm"
    ></form>`,
    imports: [NgxVestForms],
  })
  class TestPartialLegacyContractHost {
    formContract = signal({
      user: {
        name: '',
        email: '',
      },
    });
    formValue = signal<Record<string, unknown>>({
      user: {
        name: 'Ada',
      },
    });
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  async function createHost<T>(component: Type<T>) {
    await TestBed.configureTestingModule({
      imports: [component],
    }).compileComponents();

    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    await whenStable();
    return fixture;
  }

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    TestBed.resetTestingModule();
  });

  it('should warn in dev mode if a legacy shape contract does not match the form value', async () => {
    const { fixture } = await render(TestLegacyShapeContractHost);
    const instance = fixture.componentInstance;
    instance.formValue.set({ foo: 'bar' });
    await whenStable();

    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should use an injected form contract when the template omits [formContract]', async () => {
    const fixture = await createHost(TestInjectedFormContractHost);
    const instance = fixture.componentInstance;

    instance.formValue.set({ foo: 'bar' });
    await whenStable();

    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should use a factory-provided form contract when the template omits [formContract]', async () => {
    const fixture = await createHost(TestFactoryFormContractHost);
    const instance = fixture.componentInstance;

    instance.formValue.set({ foo: 'bar' });
    await whenStable();

    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should prefer explicit [formContract] over an injected form contract', async () => {
    const fixture = await createHost(TestFormContractOverrideHost);

    expect(consoleWarnSpy).not.toHaveBeenCalled();

    const instance = fixture.componentInstance;
    instance.formValue.set({ providerOnly: 'bar' });
    await whenStable();

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("'providerOnly'")
    );
  });

  it('should allow explicit [formContract]="null" to disable an injected form contract', async () => {
    const fixture = await createHost(TestFormContractNullOverrideHost);

    expect(consoleWarnSpy).not.toHaveBeenCalled();

    const instance = fixture.componentInstance;
    instance.formValue.set({ anotherField: 'bar' });
    await whenStable();

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should not warn in production mode', async () => {
    // This test is skipped in prod builds; in real prod, shape validation is a no-op
    // Here, we just ensure no warning if shape is correct
    const { fixture } = await render(TestLegacyShapeContractHost);
    const instance = fixture.componentInstance;
    instance.formValue.set({ username: 'ok' });
    await whenStable();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should format nested and root Standard Schema issue paths using Angular field syntax', async () => {
    const { fixture } = await render(TestSchemaIssueContractHost);
    const instance = fixture.componentInstance;
    await whenStable();
    consoleWarnSpy.mockClear();

    instance.formContract.set(
      createIssueContract([
        {
          message: 'Invalid user email',
          path: ['users', { key: 0 }, 'email'],
        },
        {
          message: 'Whole contract failed',
        },
      ])
    );
    await whenStable();

    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('users[0].email')
    );
    expect(consoleWarnSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('<root>')
    );
  });

  it('should allow partial values with a legacy shape contract', async () => {
    await render(TestPartialLegacyContractHost);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should rely on schema strictness for unknown-key warnings', async () => {
    const { fixture } = await render(TestSchemaIssueContractHost);
    const instance = fixture.componentInstance;
    instance.formValue.set({ known: 'ok', unexpected: 'value' });
    await whenStable();
    consoleWarnSpy.mockClear();

    instance.formContract.set(
      createIssueContract([
        {
          message: 'Unexpected key',
          path: ['unexpected'],
        },
      ])
    );
    await whenStable();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("'unexpected'")
    );

    consoleWarnSpy.mockClear();
    instance.formContract.set(createIssueContract());
    await whenStable();

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should keep runtime validity independent from contract warnings', async () => {
    const { fixture } = await render(TestSchemaIssueContractHost);
    const instance = fixture.componentInstance;
    await whenStable();
    consoleWarnSpy.mockClear();

    instance.formContract.set(
      createIssueContract([
        {
          message: 'Unexpected key',
          path: ['unexpected'],
        },
      ])
    );
    await whenStable();

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(instance.vestForm().valid()).toBe(true);
  });

  it('should ignore async schema issues in the directive diagnostic pass', async () => {
    const { fixture } = await render(TestSchemaIssueContractHost);
    const instance = fixture.componentInstance;
    await whenStable();
    consoleWarnSpy.mockClear();

    instance.formContract.set(
      createAsyncIssueContract([
        {
          message: 'Async issue',
          path: ['username'],
        },
      ])
    );
    await whenStable();
    await Promise.resolve();

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(instance.vestForm().valid()).toBe(true);
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

  it('should not move focus on submit when focusFirstInvalidOnSubmit is false', async () => {
    @Component({
      selector: 'test-submit-no-focus-host',
      template: `
        <form
          ngxVestForm
          [suite]="suite()"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          [focusFirstInvalidOnSubmit]="false"
        >
          <label for="firstName">First name</label>
          <input
            id="firstName"
            name="firstName"
            [ngModel]="formValue().firstName"
          />

          <button type="submit">Submit</button>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestSubmitNoFocusHost {
      readonly formValue = signal<{ firstName: string }>({ firstName: '' });

      readonly suite = signal(
        create((model: { firstName?: string } = {}) => {
          vestTest('firstName', 'First name is required', () => {
            enforce(model.firstName).isNotBlank();
          });
        })
      );
    }

    const { fixture } = await render(TestSubmitNoFocusHost);

    const button = screen.getByRole('button', { name: 'Submit' });
    await userEvent.click(button);

    // Wait for the submit pipeline to complete: markAllAsTouched runs
    // synchronously on ngSubmit, and the async validator resolves after.
    // The focus microtask then returns early (focusFirstInvalidOnSubmit=false),
    // so focus stays on the button.
    await waitFor(() => {
      const input = screen.getByLabelText('First name');
      expect(input).toHaveClass('ng-touched');
      expect(input).toHaveClass('ng-invalid');
    });

    expect(screen.getByLabelText('First name')).not.toHaveFocus();
    expect(button).toHaveFocus();
  });
});

describe('FormDirective - suite input changes (late/swapped suite)', () => {
  @Component({
    selector: 'test-late-suite-host',
    template: `
      <form
        ngxVestForm
        [suite]="suite()"
        [formValue]="formValue()"
        (formValueChange)="formValue.set($event)"
        #vest="ngxVestForm"
      >
        <label for="username">Username</label>
        <input id="username" name="username" [ngModel]="formValue().username" />
      </form>
    `,
    imports: [NgxVestForms],
  })
  class TestLateSuiteHost {
    readonly formValue = signal<{ username: string }>({ username: '' });
    readonly suite = signal<NgxVestSuite<{ username?: string }> | null>(null);
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');
  }

  it('should revalidate existing fields when the suite arrives late (null → suite)', async () => {
    const { fixture } = await render(TestLateSuiteHost);
    const instance = fixture.componentInstance as TestLateSuiteHost;
    await whenStable();

    // While the suite is absent, the field validates as VALID.
    expect(instance.vestForm().ngForm.form.get('username')?.valid).toBe(true);
    expect(instance.vestForm().formState().valid).toBe(true);

    // The suite arrives asynchronously (e.g. lazy import / per-locale suite).
    instance.suite.set(
      create((model: { username?: string } = {}) => {
        vestTest('username', 'Username is required', () => {
          enforce(model.username).isNotBlank();
        });
      })
    );

    // Without any user interaction, the now-present suite must be applied.
    await waitFor(() => {
      expect(instance.vestForm().ngForm.form.get('username')?.invalid).toBe(
        true
      );
    });
    await waitFor(() => {
      expect(instance.vestForm().formState().valid).toBe(false);
    });
  });

  it('should revalidate existing fields when the suite is swapped at runtime', async () => {
    const { fixture } = await render(TestLateSuiteHost);
    const instance = fixture.componentInstance as TestLateSuiteHost;

    // Let the model value sync into the form controls first.
    instance.formValue.set({ username: 'abc' });
    await whenStable();

    // Initial suite: 3 characters are enough — field is VALID.
    instance.suite.set(
      create((model: { username?: string } = {}) => {
        vestTest('username', 'Username must be at least 3 characters', () => {
          enforce(model.username).longerThanOrEquals(3);
        });
      })
    );

    await waitFor(() => {
      expect(instance.vestForm().ngForm.form.get('username')?.valid).toBe(true);
    });

    // Swap to a stricter suite (e.g. wizard step / mode switch): the existing
    // value no longer passes and must become INVALID without user input.
    instance.suite.set(
      create((model: { username?: string } = {}) => {
        vestTest('username', 'Username must be at least 5 characters', () => {
          enforce(model.username).longerThanOrEquals(5);
        });
      })
    );

    await waitFor(() => {
      expect(instance.vestForm().ngForm.form.get('username')?.invalid).toBe(
        true
      );
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
    await whenStable();
    // Let the initial validation pass settle before capturing the baseline.
    await expect.poll(() => instance.vestForm().formState().valid).toBe(true);

    // Get initial formState reference
    const initialState = instance.vestForm().formState();

    // Trigger form status change without changing actual values/errors/valid
    // This simulates Angular's statusChanges emitting even when nothing meaningful changed
    instance.vestForm().ngForm.form.updateValueAndValidity({ emitEvent: true });
    await whenStable();

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
    await whenStable();

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
    await whenStable();
    // Let the initial validation pass settle before capturing the baseline.
    await expect.poll(() => instance.vestForm().formState().valid).toBe(true);

    // Get initial state (this calls getAllFormErrors once)
    const state1 = instance.vestForm().formState();

    // Trigger multiple status changes without actual value/error changes
    for (let i = 0; i < 5; i++) {
      instance
        .vestForm()
        .ngForm.form.updateValueAndValidity({ emitEvent: true });
      await whenStable();
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
    await whenStable();

    const emailControl = instance.vestForm().ngForm.form.get('email');
    const usernameControl = instance.vestForm().ngForm.form.get('username');

    expect(emailControl).toBeTruthy();
    expect(usernameControl).toBeTruthy();

    emailControl?.setErrors({ errors: ['Email is required'] });
    usernameControl?.setErrors({ errors: ['Username is required'] });
    await whenStable();

    const initialErrors = instance.vestForm().formState().errors;
    expect(initialErrors['email']).toContain('Email is required');
    expect(initialErrors['username']).toContain('Username is required');
    expect(instance.vestForm().formState().valid).toBe(false);

    emailControl?.setErrors(null);
    await whenStable();

    const updatedErrors = instance.vestForm().formState().errors;
    expect(updatedErrors['email']).toBeUndefined();
    expect(updatedErrors['username']).toContain('Username is required');
    expect(instance.vestForm().formState().valid).toBe(false);
  });
});

describe('FormDirective - Destroy-aware async scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('destroying directive mid-async-validation produces no errors and no leaked timers', async () => {
    @Component({
      selector: 'test-destroy-mid-validation',
      imports: [NgxVestForms],
      template: `
        <form
          ngxVestForm
          [suite]="suite()"
          [formValue]="formValue()"
          #vest="ngxVestForm"
        >
          <input
            name="username"
            [ngModel]="formValue().username"
            [validationOptions]="{ debounceTime: 200 }"
          />
        </form>
      `,
    })
    class TestDestroyMidValidationComponent {
      formValue = signal({ username: '' });
      suite = signal(
        create((model: { username?: string } = {}) => {
          vestTest('username', 'Username is required', () => {
            enforce(model.username).isNotEmpty();
          });
        })
      );
    }

    const { fixture } = await render(TestDestroyMidValidationComponent);
    const instance = fixture.componentInstance;

    // Trigger validation by changing the value
    instance.formValue.set({ username: 'test' });
    // Flush the zoneless scheduler's render timer without reaching the debounce
    await vi.advanceTimersByTimeAsync(0);

    // Destroy the component before the debounce timer fires (validation in flight)
    fixture.destroy();

    // Advance timers past the debounce window - should NOT throw
    expect(() => {
      vi.advanceTimersByTime(500);
    }).not.toThrow();

    // Flush any remaining microtasks - should NOT throw
    await Promise.resolve();
  });

  it('validationInProgress Set is not leaked when directive destroyed before timeout fires', async () => {
    @Component({
      selector: 'test-destroy-validation-config',
      imports: [NgxVestForms],
      template: `
        <form
          ngxVestForm
          [suite]="suite()"
          [formValue]="formValue()"
          [validationConfig]="validationConfig"
          #vest="ngxVestForm"
        >
          <input name="password" [ngModel]="formValue().password" />
          <input
            name="confirmPassword"
            [ngModel]="formValue().confirmPassword"
          />
        </form>
      `,
    })
    class TestDestroyValidationConfigComponent {
      formValue = signal({ password: '', confirmPassword: '' });
      validationConfig = { password: ['confirmPassword'] };
      suite = signal(
        create(
          (_model: { password?: string; confirmPassword?: string } = {}) => {}
        )
      );
      readonly vestForm =
        viewChild.required<FormDirective<Record<string, unknown>>>('vest');
    }

    const { fixture } = await render(TestDestroyValidationConfigComponent);
    const instance = fixture.componentInstance;

    // Trigger validation config processing by changing the trigger field value
    instance.formValue.set({ password: 'changed', confirmPassword: '' });
    // Flush the zoneless scheduler's render timer without reaching the debounce
    await vi.advanceTimersByTimeAsync(0);

    // Destroy before the VALIDATION_IN_PROGRESS_TIMEOUT_MS fires
    fixture.destroy();

    // Advancing timers should NOT throw (the scheduleTimeout callback is suppressed)
    expect(() => {
      vi.advanceTimersByTime(1000);
    }).not.toThrow();
  });
});

describe('FormDirective - resetField/removeField with a pending async test', () => {
  const VALIDATION_DEBOUNCE_MS = 1000;
  const ASYNC_TEST_DELAY_MS = 200;

  @Component({
    selector: 'test-pending-async-reset-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        [suite]="suite"
        [formValue]="formValue()"
        (formValueChange)="formValue.set($event)"
        #vest="ngxVestForm"
      >
        <label for="username">Username</label>
        <input
          id="username"
          name="username"
          [ngModel]="formValue().username"
          [validationOptions]="{ debounceTime: 1000 }"
        />
      </form>
    `,
  })
  class TestPendingAsyncResetHost {
    readonly formValue = signal<{ username?: string }>({});
    readonly checkAvailability = signal(true);
    readonly suite = create((model: { username?: string } = {}) => {
      skipWhen(!this.checkAvailability(), () => {
        vestTest('username', 'Username is already taken', async () => {
          await new Promise((resolve) =>
            setTimeout(resolve, ASYNC_TEST_DELAY_MS)
          );
          throw new Error(`${model.username} is taken`);
        });
      });
    });
    readonly vestForm =
      viewChild.required<FormDirective<Record<string, unknown>>>('vest');

    disableAvailabilityCheck(): void {
      this.checkAvailability.set(false);
      this.vestForm().resetField('username');
    }
  }

  async function renderWithPendingUsernameTest() {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    const { fixture } = await render(TestPendingAsyncResetHost);
    const instance = fixture.componentInstance;

    await user.type(screen.getByLabelText('Username'), 'taken');
    // Past the debounce: the suite runs and the async test is now in flight.
    await vi.advanceTimersByTimeAsync(VALIDATION_DEBOUNCE_MS);

    const control = instance.vestForm().ngForm.form.get('username');
    if (!control) {
      throw new Error('Expected the username control to be registered');
    }
    expect(control.pending).toBe(true);
    expect(instance.suite.get().isPending('username')).toBe(true);

    return { instance, control };
  }

  it('resetField() cancels the pending async test so its late failure does not resurrect the field', async () => {
    const { instance, control } = await renderWithPendingUsernameTest();

    // Context change: the availability check no longer applies.
    instance.disableAvailabilityCheck();

    // Let the cancelled async test settle, then let the re-validation that
    // resetField() triggered run past its debounce.
    await vi.advanceTimersByTimeAsync(ASYNC_TEST_DELAY_MS);
    await vi.advanceTimersByTimeAsync(VALIDATION_DEBOUNCE_MS);

    expect(control.pending).toBe(false);
    expect(control.errors).toBeNull();
    expect(instance.suite.get().getErrors('username')).toEqual([]);
    expect(instance.vestForm().formState().errors['username']).toBeUndefined();
    expect(instance.vestForm().formState().valid).toBe(true);
  });

  it('removeField() drops the pending async test so its late failure is never reported', async () => {
    const { instance, control } = await renderWithPendingUsernameTest();

    instance.vestForm().removeField('username');

    // Past the moment the async test would have resolved to a failure.
    await vi.advanceTimersByTimeAsync(ASYNC_TEST_DELAY_MS);

    expect(control.pending).toBe(false);
    expect(control.errors).toBeNull();
    expect(instance.suite.get().getErrors('username')).toEqual([]);
    expect(instance.vestForm().formState().errors['username']).toBeUndefined();
    expect(instance.vestForm().formState().valid).toBe(true);
  });
});

describe('FormDirective - bidirectional sync conflict recovery', () => {
  @Component({
    selector: 'sc-conflict-host',
    imports: [NgxVestForms],
    template: `
      <form ngxVestForm [formValue]="formValue()">
        <input
          id="name"
          name="name"
          [ngModel]="formValue().name"
          aria-label="name"
        />
      </form>
    `,
  })
  class ConflictHostComponent {
    // No (formValueChange) binding: the model stays fixed while the user
    // edits the input, and the consumer never sees the edit, so a later
    // programmatic model change diverges from the form (the conflict
    // scenario).
    readonly formValue = signal<{ name?: string }>({ name: '' });
  }

  @Component({
    selector: 'sc-pristine-programmatic-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        [formValue]="formValue()"
        (formValueChange)="formValue.set($event)"
      >
        <input
          id="programmatic-name"
          name="name"
          [ngModel]="formValue().name"
          aria-label="programmatic name"
        />
      </form>
    `,
  })
  class PristineProgrammaticHostComponent {
    readonly formValue = signal<{ name?: string }>({ name: '' });
  }

  it('does not report pristine programmatic formValue updates as sync conflicts', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const { fixture } = await render(PristineProgrammaticHostComponent);
    const instance = fixture.componentInstance;
    const input = screen.getByLabelText(
      'programmatic name'
    ) as HTMLInputElement;

    instance.formValue.set({ name: 'model-only' });
    await whenStable();

    await waitFor(() => {
      expect(input.value).toBe('model-only');
    });
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('[NGX-100]')
    );
    consoleWarnSpy.mockRestore();
  });

  it('still applies later programmatic formValue updates after a prior true conflict', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const { fixture } = await render(ConflictHostComponent);
    const instance = fixture.componentInstance;
    const input = screen.getByLabelText('name') as HTMLInputElement;

    // 1. User edits the input -> form changes (model stays {name:''}).
    await userEvent.type(input, 'user-typed');

    // 2. Simultaneously change the model to a DIFFERENT value before the
    //    sync effect reconciles -> formChanged && modelChanged with unequal
    //    values == the "true conflict" branch.
    instance.formValue.set({ name: 'model-A' });
    await whenStable();

    // 3. A LATER, single-sided programmatic formValue update must still take
    //    effect (pre-fix this was permanently dropped because the conflict
    //    branch never advanced the sync baselines).
    instance.formValue.set({ name: 'model-B' });
    await whenStable();

    await waitFor(() => {
      expect(input.value).toBe('model-B');
    });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[NGX-100]')
    );
    consoleWarnSpy.mockRestore();
  });

  it('does not throw and keeps syncing across repeated conflicts', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const { fixture } = await render(ConflictHostComponent);
    const instance = fixture.componentInstance;
    const input = screen.getByLabelText('name') as HTMLInputElement;

    await userEvent.type(input, 'abc');
    instance.formValue.set({ name: 'conflict-1' });
    await whenStable();

    await userEvent.clear(input);
    await userEvent.type(input, 'def');
    instance.formValue.set({ name: 'conflict-2' });
    await whenStable();

    // Final clean programmatic update must still propagate to the DOM.
    instance.formValue.set({ name: 'final' });
    await whenStable();

    await waitFor(() => {
      expect(input.value).toBe('final');
    });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[NGX-100]')
    );
    consoleWarnSpy.mockRestore();
  });
});

describe('FormDirective - formValueChange with disabled controls', () => {
  type Model = { name?: string; nickname?: string };

  @Component({
    selector: 'test-disabled-value-change-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [formValue]="formValue()"
        (formValueChange)="onFormValueChange($event)"
      >
        <input name="name" [ngModel]="formValue().name" aria-label="Name" />
        <input
          name="nickname"
          [ngModel]="formValue().nickname"
          aria-label="Nickname"
        />
      </form>
    `,
  })
  class DisabledValueChangeHostComponent {
    readonly vestForm = viewChild.required<FormDirective<Model>>('vest');
    readonly formValue = signal<Model>({ name: 'Ann', nickname: 'Annie' });
    readonly emissions: Model[] = [];

    onFormValueChange(value: Model): void {
      this.emissions.push(value);
      this.formValue.set(value);
    }
  }

  async function renderHost() {
    const { fixture } = await render(DisabledValueChangeHostComponent);
    await whenStable();
    const instance = fixture.componentInstance;
    const form = instance.vestForm().ngForm.form;
    await expect.poll(() => form.get('nickname')).not.toBeNull();
    return { instance, form };
  }

  it('emits the new raw value when a disabled control is set programmatically', async () => {
    const { instance, form } = await renderHost();
    const nickname = form.get('nickname');
    nickname?.disable();
    await whenStable();
    instance.emissions.length = 0;

    nickname?.setValue('Nan');
    await whenStable();

    expect(form.value).toEqual({ name: 'Ann' });
    expect(instance.emissions).toEqual([{ name: 'Ann', nickname: 'Nan' }]);
  });

  it('emits once when value events repeat the same merged value', async () => {
    const { instance, form } = await renderHost();
    instance.emissions.length = 0;

    form.get('name')?.setValue('Bob');
    form.get('name')?.setValue('Bob');
    form.updateValueAndValidity();
    await whenStable();

    expect(instance.emissions).toEqual([{ name: 'Bob', nickname: 'Annie' }]);
  });
});

describe('FormDirective - model writes made in response to formValueChange', () => {
  @Component({
    selector: 'test-derived-clear-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        [formValue]="formValue()"
        (formValueChange)="onFormValueChange($event)"
      >
        <select
          id="mode"
          name="mode"
          aria-label="mode"
          [ngModel]="formValue().mode"
        >
          <option value="pickup">Pickup</option>
          <option value="shipment">Shipment</option>
        </select>
        <input
          id="address"
          name="address"
          aria-label="address"
          [ngModel]="formValue().address"
        />
      </form>
    `,
  })
  class DerivedClearHostComponent {
    readonly formValue = signal<{ mode?: string; address?: string }>({
      mode: 'shipment',
      address: 'Main Street 1',
    });

    onFormValueChange(value: { mode?: string; address?: string }): void {
      this.formValue.set(value);
      if (value.mode !== 'shipment' && value.address) {
        // Derived write in the same tick: clear what the new mode hides.
        this.formValue.set({ ...value, address: '' });
      }
    }
  }

  it('applies the derived model write instead of reporting a sync conflict', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    onTestFinished(() => consoleWarnSpy.mockRestore());
    const { fixture } = await render(DerivedClearHostComponent);

    await userEvent.selectOptions(screen.getByLabelText('mode'), 'pickup');
    await whenStable();

    await waitFor(() => {
      expect((screen.getByLabelText('address') as HTMLInputElement).value).toBe(
        ''
      );
    });
    expect(fixture.componentInstance.formValue()).toEqual({
      mode: 'pickup',
      address: '',
    });
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('[NGX-100]')
    );
  });
});

describe('FormDirective - programmatic model writes', () => {
  @Component({
    selector: 'test-listen-only-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [suite]="suite"
        [formValue]="formValue()"
        (formValueChange)="received.push($event)"
        (validChange)="validity.push($event)"
      >
        <input
          id="nickname"
          name="nickname"
          aria-label="nickname"
          [ngModel]="formValue().nickname"
        />
      </form>
    `,
  })
  class ListenOnlyHostComponent {
    // Listens to formValueChange but never copies the value into the model.
    readonly formValue = signal<{ nickname?: string }>({});
    readonly received: { nickname?: string }[] = [];
    readonly validity: boolean[] = [];
    readonly suite = create((model: { nickname?: string } = {}) => {
      vestTest('nickname', 'Nickname is required', () => {
        enforce(model.nickname).isNotBlank();
      });
    });
    readonly vest =
      viewChild.required<FormDirective<{ nickname?: string }>>('vest');
  }

  it('lets a later model write win over a value the consumer already received', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    onTestFinished(() => consoleWarnSpy.mockRestore());
    const { fixture } = await render(ListenOnlyHostComponent);
    const host = fixture.componentInstance;
    const input = screen.getByLabelText('nickname') as HTMLInputElement;

    await userEvent.type(input, 'typed');
    // Not copying the value back already warns while typing; only the model
    // write below is under test.
    consoleWarnSpy.mockClear();
    // Same turn as the last keystroke: the consumer has received 'typed'
    // and now writes a different model.
    host.formValue.set({ nickname: 'from-model' });
    await whenStable();

    await waitFor(() => {
      expect(input.value).toBe('from-model');
    });
    expect(host.received).toContainEqual({ nickname: 'typed' });
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('[NGX-100]')
    );
  });

  it('emits form events (validChange) when a model write changes validity', async () => {
    const { fixture } = await render(ListenOnlyHostComponent);
    const host = fixture.componentInstance;
    await whenStable();
    await waitFor(() => expect(host.vest().formState().valid).toBe(false));

    host.formValue.set({ nickname: 'Ada' });
    await whenStable();

    await waitFor(() => expect(host.validity.at(-1)).toBe(true));
  });
});

describe('FormDirective - submitSettled', () => {
  const ASYNC_TEST_DELAY_MS = 200;

  @Component({
    selector: 'test-submit-settled-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        [suite]="suite"
        [formValue]="formValue()"
        (formValueChange)="formValue.set($event)"
        (ngSubmit)="statusAtNgSubmit.push(vest.ngForm.form.status)"
        (submitSettled)="settled.push($event)"
        #vest="ngxVestForm"
      >
        <label for="username">Username</label>
        <input
          id="username"
          name="username"
          [ngModel]="formValue().username"
          [validationOptions]="{ debounceTime: 0 }"
        />
        <button type="submit">Submit</button>
      </form>
    `,
  })
  class SubmitSettledHostComponent {
    readonly formValue = signal<{ username?: string }>({});
    readonly statusAtNgSubmit: string[] = [];
    readonly settled: NgxSubmitSettledEvent<{ username?: string }>[] = [];
    readonly suite = create((model: { username?: string } = {}) => {
      vestTest('username', 'Username is required', () => {
        enforce(model.username).isNotBlank();
      });
      vestTest('username', 'Username is already taken', async () => {
        await new Promise((resolve) =>
          setTimeout(resolve, ASYNC_TEST_DELAY_MS)
        );
        if (model.username === 'taken') {
          throw new Error('taken');
        }
      });
    });
  }

  async function submitWith(username: string) {
    const { fixture } = await render(SubmitSettledHostComponent);
    const instance = fixture.componentInstance;
    await userEvent.type(screen.getByLabelText('Username'), username);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(instance.settled).toHaveLength(1));
    return instance;
  }

  it('emits once with valid: true after the async test passes', async () => {
    const instance = await submitWith('free');

    expect(instance.statusAtNgSubmit).toEqual(['PENDING']);
    expect(instance.settled).toEqual([
      { valid: true, value: { username: 'free' }, errors: {} },
    ]);
  });

  it('emits once with valid: false and the errors after the async test fails', async () => {
    const instance = await submitWith('taken');

    expect(instance.settled).toEqual([
      {
        valid: false,
        value: { username: 'taken' },
        errors: { username: ['Username is already taken'] },
      },
    ]);
  });
});

describe('FormDirective - model writes into controls inside embedded views', () => {
  type TripModel = { departureDate?: string; returnDate?: string };

  @Component({
    selector: 'test-embedded-proxy-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [suite]="suite"
        [formValue]="formValue()"
        [validationConfig]="validationConfig"
        (formValueChange)="emitted.push($event)"
      >
        @if (showProxies()) {
          <input
            type="hidden"
            name="departureDate"
            [ngModel]="formValue().departureDate"
          />
          <input
            type="hidden"
            name="returnDate"
            [ngModel]="formValue().returnDate"
          />
        }
      </form>
    `,
  })
  class EmbeddedProxyHostComponent {
    readonly showProxies = signal(true);
    readonly formValue = signal<TripModel>({});
    readonly emitted: TripModel[] = [];
    readonly validationConfig = createValidationConfig<TripModel>()
      .bidirectional('departureDate', 'returnDate')
      .build();
    readonly suite = create((model: TripModel = {}) => {
      omitWhen(!model.departureDate || !model.returnDate, () => {
        vestTest('returnDate', 'Return must be after departure', () => {
          enforce(model.returnDate! > model.departureDate!).isTruthy();
        });
      });
    });
    readonly vest = viewChild.required<FormDirective<TripModel>>('vest');
  }

  it('refreshes formState errors after a model-only update (composite adapter case)', async () => {
    // The proxies sit in an embedded view, so the sync effect writes their
    // values before NgModel sees the new input and NgModel skips its own
    // write. The form must still report the new validation result.
    const { fixture } = await render(EmbeddedProxyHostComponent);
    const host = fixture.componentInstance;
    await whenStable();
    // Control registration emits on first render; only count what follows.
    host.emitted.length = 0;

    host.formValue.set({
      departureDate: '2026-07-15',
      returnDate: '2026-07-01',
    });
    await whenStable();
    await waitFor(() => {
      expect(host.vest().formState().errors['returnDate']).toEqual([
        'Return must be after departure',
      ]);
    });

    host.formValue.set({
      departureDate: '2026-07-15',
      returnDate: '2026-07-20',
    });
    await whenStable();
    await waitFor(() => {
      expect(host.vest().formState().errors['returnDate']).toBeUndefined();
    });

    // The model write is not echoed back through formValueChange.
    expect(host.emitted).toEqual([]);
  });
});

describe('FormDirective - formValueChange after a model write', () => {
  type ModeModel = { mode?: string };

  @Component({
    selector: 'test-embedded-select-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        [formValue]="formValue()"
        (formValueChange)="formValue.set($event)"
      >
        @if (true) {
          <select
            id="mode"
            name="mode"
            aria-label="mode"
            [ngModel]="formValue().mode"
          >
            <option value="a">A</option>
            <option value="b">B</option>
          </select>
        }
      </form>
    `,
  })
  class EmbeddedSelectHostComponent {
    readonly formValue = signal<ModeModel>({ mode: 'b' });
  }

  it('emits a user selection that matches the value emitted before the model write', async () => {
    const { fixture } = await render(EmbeddedSelectHostComponent);
    const host = fixture.componentInstance;
    const select = screen.getByLabelText('mode') as HTMLSelectElement;

    await userEvent.selectOptions(select, 'a');
    await whenStable();
    expect(host.formValue()).toEqual({ mode: 'a' });

    host.formValue.set({ mode: 'b' });
    await whenStable();
    await waitFor(() => expect(select.value).toBe('b'));

    await userEvent.selectOptions(select, 'a');
    await whenStable();
    expect(host.formValue()).toEqual({ mode: 'a' });
  });
});

describe('FormDirective - partial model input', () => {
  type NameModel = { firstName?: string; lastName?: string };

  @Component({
    selector: 'test-partial-model-host',
    imports: [NgxVestForms],
    template: `
      <form ngxVestForm [suite]="suite" [formValue]="formValue()">
        <input
          name="firstName"
          aria-label="firstName"
          [ngModel]="formValue().firstName"
        />
        <input
          name="lastName"
          aria-label="lastName"
          [ngModel]="formValue().lastName"
        />
      </form>
    `,
  })
  class PartialModelHostComponent {
    // The model never holds lastName, so it stays a partial of the form value.
    readonly formValue = signal<NameModel>({});
    runs = 0;
    readonly suite = create((model: NameModel = {}) => {
      this.runs++;
      vestTest('firstName', 'First name is required', () => {
        enforce(model.firstName).isNotBlank();
      });
    });
  }

  it('settles after a model write instead of re-applying it on every validation', async () => {
    const { fixture } = await render(PartialModelHostComponent);
    const host = fixture.componentInstance;
    await whenStable();

    host.formValue.set({ firstName: 'Ada' });
    await whenStable();
    await waitFor(() =>
      expect(
        (screen.getByLabelText('firstName') as HTMLInputElement).value
      ).toBe('Ada')
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    await whenStable();
    const runsAfterWrite = host.runs;

    await new Promise((resolve) => setTimeout(resolve, 300));
    await whenStable();
    expect(host.runs).toBe(runsAfterWrite);
  });
});

describe('FormDirective - submitSettled with validationConfig', () => {
  type PasswordModel = { password?: string; confirmPassword?: string };

  @Component({
    selector: 'test-submit-settled-config-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        [suite]="suite"
        [formValue]="formValue()"
        [validationConfig]="validationConfig"
        (formValueChange)="formValue.set($event)"
        (submitSettled)="settled.push($event)"
      >
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          [ngModel]="formValue().password"
          [validationOptions]="{ debounceTime: 0 }"
        />
        <label for="confirmPassword">Confirm</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          [ngModel]="formValue().confirmPassword"
          [validationOptions]="{ debounceTime: 0 }"
        />
        <button type="submit">Submit</button>
      </form>
    `,
  })
  class SubmitSettledConfigHostComponent {
    readonly formValue = signal<PasswordModel>({});
    readonly settled: NgxSubmitSettledEvent<PasswordModel>[] = [];
    readonly validationConfig = createValidationConfig<PasswordModel>()
      .whenChanged('password', 'confirmPassword')
      .build();
    readonly suite = create((model: PasswordModel = {}) => {
      vestTest('confirmPassword', 'Passwords must match', () => {
        enforce(model.confirmPassword).equals(model.password);
      });
    });
  }

  it('revalidates dependent fields before deciding, even inside the config debounce window', async () => {
    const { fixture } = await render(SubmitSettledConfigHostComponent, {
      providers: [
        { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 1000 },
      ],
    });
    const host = fixture.componentInstance;
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.type(screen.getByLabelText('Confirm'), 'secret');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await whenStable();

    // Inside the debounce window: the pipeline has not revalidated
    // confirmPassword yet.
    await userEvent.type(screen.getByLabelText('Password'), '!');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(host.settled).toHaveLength(1));
    expect(host.settled[0]?.valid).toBe(false);
    expect(host.settled[0]?.errors).toEqual({
      confirmPassword: ['Passwords must match'],
    });
  });
});

describe('FormDirective - submit revalidation of validationConfig dependents', () => {
  type PasswordModel = { password?: string; confirmPassword?: string };

  const passwordSuite = create((model: PasswordModel = {}) => {
    vestTest('confirmPassword', 'Passwords must match', () => {
      enforce(model.confirmPassword).equals(model.password);
    });
  });
  const passwordConfig = createValidationConfig<PasswordModel>()
    .whenChanged('password', 'confirmPassword')
    .build();

  // `(submitSettled)` is bound before `(ngSubmit)`, so its listener is
  // registered first.
  @Component({
    selector: 'test-submit-revalidation-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [suite]="suite"
        [formValue]="formValue()"
        [validationConfig]="validationConfig"
        (formValueChange)="formValue.set($event)"
        (submitSettled)="settled.push($event)"
        (ngSubmit)="statusInNgSubmit = vest.ngForm.form.status"
      >
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          [ngModel]="formValue().password"
          [validationOptions]="{ debounceTime: 0 }"
        />
        <label for="confirmPassword">Confirm</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          [ngModel]="formValue().confirmPassword"
          [validationOptions]="{ debounceTime: 0 }"
        />
        <button type="submit">Submit</button>
      </form>
    `,
  })
  class SubmitRevalidationHostComponent {
    readonly formValue = signal<PasswordModel>({});
    readonly settled: NgxSubmitSettledEvent<PasswordModel>[] = [];
    statusInNgSubmit: string | null = null;
    readonly validationConfig = passwordConfig;
    readonly suite = passwordSuite;
    readonly vest = viewChild.required<FormDirective<PasswordModel>>('vest');
  }

  @Component({
    selector: 'test-submit-revalidation-no-settled-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [suite]="suite"
        [formValue]="formValue()"
        [validationConfig]="validationConfig"
        (formValueChange)="formValue.set($event)"
      >
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          [ngModel]="formValue().password"
          [validationOptions]="{ debounceTime: 0 }"
        />
        <label for="confirmPassword">Confirm</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          [ngModel]="formValue().confirmPassword"
          [validationOptions]="{ debounceTime: 0 }"
        />
        <button type="submit">Submit</button>
      </form>
    `,
  })
  class NoSettledListenerHostComponent {
    readonly formValue = signal<PasswordModel>({});
    readonly validationConfig = passwordConfig;
    readonly suite = passwordSuite;
    readonly vest = viewChild.required<FormDirective<PasswordModel>>('vest');
  }

  beforeEach(() => {
    passwordSuite.reset();
  });

  async function fillMatchingPasswords(): Promise<void> {
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.type(screen.getByLabelText('Confirm'), 'secret');
    await new Promise((resolve) => setTimeout(resolve, 150));
    await whenStable();
  }

  it('leaves the status alone for (ngSubmit) handlers, whatever the binding order', async () => {
    // Handlers that read the status synchronously must see the verdict the
    // user submitted, not a PENDING caused by the library's revalidation.
    const { fixture } = await render(SubmitRevalidationHostComponent, {
      providers: [
        { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 0 },
      ],
    });
    const host = fixture.componentInstance;
    await fillMatchingPasswords();

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(host.statusInNgSubmit).toBe('VALID');
    await waitFor(() => expect(host.settled).toHaveLength(1));
    expect(host.settled[0]?.valid).toBe(true);
  });

  it('revalidates each dependent once per submit, however many submitSettled listeners there are', async () => {
    // Each revalidation emits status events and restarts the dependent's
    // async validator; the listener count must not multiply that work.
    const { fixture } = await render(SubmitRevalidationHostComponent, {
      providers: [
        { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 0 },
      ],
    });
    const host = fixture.componentInstance;
    await fillMatchingPasswords();
    const extraListeners = [
      host.vest().submitSettled.subscribe(() => undefined),
      host.vest().submitSettled.subscribe(() => undefined),
    ];
    onTestFinished(() => {
      for (const listener of extraListeners) listener.unsubscribe();
    });
    const confirmPassword = host.vest().ngForm.form.get('confirmPassword');
    if (!confirmPassword) throw new Error('confirmPassword not registered');
    const revalidate = vi.spyOn(confirmPassword, 'updateValueAndValidity');

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(host.settled).toHaveLength(1));

    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('revalidates the dependents on submit without a submitSettled listener', async () => {
    // Submit focus and `errorsChange` rely on the fresh dependent verdict,
    // so it must not depend on whether the consumer binds submitSettled.
    const { fixture } = await render(NoSettledListenerHostComponent, {
      providers: [
        { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 1000 },
      ],
    });
    const host = fixture.componentInstance;
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.type(screen.getByLabelText('Confirm'), 'secret');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await whenStable();

    // Inside the debounce window: the pipeline has not revalidated
    // confirmPassword yet.
    await userEvent.type(screen.getByLabelText('Password'), '!');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(
      () =>
        expect(
          host.vest().ngForm.form.get('confirmPassword')?.errors
        ).toBeTruthy(),
      { timeout: 500 }
    );
  });
});

describe('FormDirective - formState after a programmatic model sync', () => {
  type ProfileModel = { name?: string };

  const profileSuite = create((model: ProfileModel = {}) => {
    vestTest('name', 'Name is required', () => {
      enforce(model.name).isNotBlank();
    });
  });

  @Component({
    selector: 'test-model-sync-direct-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [suite]="suite"
        [formValue]="formValue()"
        (formValueChange)="formValue.set($event)"
      >
        <input
          name="name"
          [ngModel]="formValue().name"
          [validationOptions]="{ debounceTime: 0 }"
        />
      </form>
    `,
  })
  class DirectControlHostComponent {
    readonly formValue = signal<ProfileModel>({});
    readonly suite = profileSuite;
    readonly vest = viewChild.required<FormDirective<ProfileModel>>('vest');
  }

  @Component({
    selector: 'test-model-sync-embedded-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [suite]="suite"
        [formValue]="formValue()"
        (formValueChange)="formValue.set($event)"
      >
        @if (true) {
          <input
            name="name"
            [ngModel]="formValue().name"
            [validationOptions]="{ debounceTime: 0 }"
          />
        }
      </form>
    `,
  })
  class EmbeddedControlHostComponent {
    readonly formValue = signal<ProfileModel>({});
    readonly suite = profileSuite;
    readonly vest = viewChild.required<FormDirective<ProfileModel>>('vest');
  }

  const layouts = [
    ['controls directly in the template', DirectControlHostComponent],
    ['controls inside an embedded view', EmbeddedControlHostComponent],
  ] as const;

  for (const [layout, hostType] of layouts) {
    it(`refreshes formState value, status and errors when the parent sets a new model (${layout})`, async () => {
      profileSuite.reset();
      const { fixture } = await render<
        DirectControlHostComponent | EmbeddedControlHostComponent
      >(hostType);
      const host = fixture.componentInstance;
      await whenStable();
      await waitFor(() => {
        expect(host.vest().formState().errors['name']).toEqual([
          'Name is required',
        ]);
      });
      expect(host.vest().status()).toBe('INVALID');

      host.formValue.set({ name: 'Ada' });
      await whenStable();

      expect(host.vest().formState().value).toEqual({ name: 'Ada' });
      await waitFor(() => {
        expect(host.vest().formState().valid).toBe(true);
      });
      expect(host.vest().formState().errors).toEqual({});
      expect(host.vest().status()).toBe('VALID');
      expect(host.vest().valid()).toBe(true);
    });
  }
});

describe('FormDirective - validationConfig identity', () => {
  type PasswordModel = { password?: string; confirmPassword?: string };

  @Component({
    selector: 'test-validation-config-identity-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [suite]="suite"
        [formValue]="formValue()"
        [validationConfig]="validationConfig()"
        (formValueChange)="formValue.set($event)"
      >
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          [ngModel]="formValue().password"
          [validationOptions]="{ debounceTime: 0 }"
        />
        <label for="confirmPassword">Confirm</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          [ngModel]="formValue().confirmPassword"
          [validationOptions]="{ debounceTime: 0 }"
        />
      </form>
    `,
  })
  class ValidationConfigIdentityHostComponent {
    readonly formValue = signal<PasswordModel>({});
    readonly validationConfig = signal<Record<string, string[]>>({
      password: ['confirmPassword'],
    });
    readonly suite = create((model: PasswordModel = {}) => {
      vestTest('confirmPassword', 'Passwords must match', () => {
        enforce(model.confirmPassword).equals(model.password);
      });
    });
    readonly vest = viewChild.required<FormDirective<PasswordModel>>('vest');
  }

  it('keeps a pending dependent revalidation when an equal config object arrives', async () => {
    const { fixture } = await render(ValidationConfigIdentityHostComponent, {
      providers: [
        { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 100 },
      ],
    });
    const host = fixture.componentInstance;
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.type(screen.getByLabelText('Confirm'), 'secret');
    await new Promise((resolve) => setTimeout(resolve, 300));
    await whenStable();
    const confirm = host.vest().ngForm.form.get('confirmPassword');
    expect(confirm?.valid).toBe(true);

    // Inside the config debounce window, the consumer passes a new config
    // object with the same entries.
    await userEvent.type(screen.getByLabelText('Password'), '!');
    host.validationConfig.set({ password: ['confirmPassword'] });
    await whenStable();

    await waitFor(() => expect(confirm?.invalid).toBe(true));
  });
});

describe('FormDirective - validationConfig with a re-created trigger', () => {
  type PasswordModel = { password?: string; confirmPassword?: string };

  @Component({
    selector: 'test-recreated-trigger-host',
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [suite]="suite"
        [formValue]="formValue()"
        [validationConfig]="validationConfig"
        (formValueChange)="formValue.set($event)"
      >
        @if (showPassword()) {
          <label for="password">Password</label>
          <input
            id="password"
            name="password"
            [ngModel]="formValue().password"
            [validationOptions]="{ debounceTime: 0 }"
          />
        }
        <label for="confirmPassword">Confirm</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          [ngModel]="formValue().confirmPassword"
          [validationOptions]="{ debounceTime: 0 }"
        />
      </form>
    `,
  })
  class RecreatedTriggerHostComponent {
    readonly formValue = signal<PasswordModel>({});
    readonly showPassword = signal(true);
    readonly vestForm =
      viewChild.required<FormDirective<PasswordModel>>('vest');
    readonly validationConfig = createValidationConfig<PasswordModel>()
      .whenChanged('password', 'confirmPassword')
      .build();
    readonly suite = create((model: PasswordModel = {}) => {
      vestTest('confirmPassword', 'Passwords must match', () => {
        enforce(model.confirmPassword ?? '').equals(model.password ?? '');
      });
    });
  }

  it('revalidates the dependent after the trigger is hidden and shown again', async () => {
    const { fixture } = await render(RecreatedTriggerHostComponent, {
      providers: [
        { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 0 },
      ],
    });
    const host = fixture.componentInstance;
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.type(screen.getByLabelText('Confirm'), 'secret');
    await waitFor(() =>
      expect(
        host.vestForm().formState().errors['confirmPassword']
      ).toBeUndefined()
    );

    // `@if` destroys the password control and renders a new instance.
    host.showPassword.set(false);
    await whenStable();
    host.showPassword.set(true);
    await whenStable();

    // Only the trigger changes: without the config following the new
    // instance, confirmPassword keeps its stale "matches" verdict.
    await userEvent.type(screen.getByLabelText('Password'), 'changed');
    await waitFor(() =>
      expect(host.vestForm().formState().errors['confirmPassword']).toEqual([
        'Passwords must match',
      ])
    );
  });
});
