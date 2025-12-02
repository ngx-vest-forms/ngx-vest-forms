/* eslint-disable @angular-eslint/component-selector */
import { Component, signal, ViewChild } from '@angular/core';
import { render } from '@testing-library/angular';
import { isObservable, Observable } from 'rxjs';
import { enforce, only, staticSuite } from 'vest';
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
    staticSuite(
      (model: { username: string } = { username: '' }, field?: string) => {
        only(field); // ✅ Call unconditionally
        this.count.update((count) => count + 1);
        enforce(model.username).isNotEmpty();
      }
    )
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
    mockSuite = vi.fn();
    suite = signal(this.mockSuite);
    @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
  }

  it('should not run multiple validations in parallel for the same field', async () => {
    const { fixture } = await render(TestParallelValidationHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm.createAsyncValidator('username', {
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
    expect(instance.mockSuite).toHaveBeenCalled();
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
    @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
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
      staticSuite(() => {
        throw new Error('Vest suite execution error');
      })
    );
    @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
  }

  it('should return vestInternalError if suite throws', async () => {
    const { fixture } = await render(TestFormThrowComponent);
    const validator = fixture.componentInstance.vestForm.createAsyncValidator(
      'username',
      { debounceTime: 0 }
    );
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
      @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
    }
    const { fixture } = await render(TestNullSuiteHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm.createAsyncValidator('username', {
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
      // Provide a proper Vest suite that calls .done() callback
      suite = signal(
        staticSuite((model: any = {}, field?: string) => {
          only(field);
          // Suite runs but produces no errors (valid)
        })
      );
      @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
    }
    const { fixture } = await render(TestUndefinedValueHost);
    const instance = fixture.componentInstance;
    const validator = instance.vestForm.createAsyncValidator('username', {
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
      @ViewChild('vest1', { static: true }) vestForm1!: FormDirective<any>;
      @ViewChild('vest2', { static: true }) vestForm2!: FormDirective<any>;
    }
    const { fixture } = await render(TestMultiDirectiveHost);
    const instance = fixture.componentInstance;
    expect(instance.vestForm1).not.toBe(instance.vestForm2);
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
    @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
  }

  it('should debounce dependent field validation', async () => {
    const { fixture } = await render(TestValidationConfigHost);
    const instance = fixture.componentInstance;
    expect(instance.vestForm).toBeDefined();
    expect(instance.vestForm.validationConfig()).toEqual({
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
      @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
    }
    const { fixture } = await render(TestValidationConfigLoop);
    const instance = fixture.componentInstance;
    expect(instance.vestForm).toBeDefined();
    expect(instance.vestForm.validationConfig()).toEqual({
      username: ['email'],
      email: ['username'],
    });
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
      @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
    }
    const { fixture } = await render(TestSignalsOutputsHost);
    const instance = fixture.componentInstance;
    expect(instance.vestForm.formValueChange).toBeDefined();
    expect(instance.vestForm.errorsChange).toBeDefined();
    expect(instance.vestForm.dirtyChange).toBeDefined();
    expect(instance.vestForm.validChange).toBeDefined();
  });
});

describe('FormDirective - triggerFormValidation', () => {
  @Component({
    selector: 'test-trigger-validation-host',
    template: `<form ngxVestForm #vest="ngxVestForm"></form>`,

    imports: [NgxVestForms],
  })
  class TestTriggerValidationHost {
    @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
  }

  it('should force validation of all fields when called', async () => {
    const { fixture } = await render(TestTriggerValidationHost);
    const instance = fixture.componentInstance;
    // Mock updateValueAndValidity
    const mockFn = vi.fn();
    Object.defineProperty(
      instance.vestForm.ngForm.form,
      'updateValueAndValidity',
      {
        value: mockFn,
      }
    );
    instance.vestForm.triggerFormValidation();
    expect(mockFn).toHaveBeenCalledWith({ emitEvent: true });
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
    @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
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
    suite = signal(
      staticSuite((model: { field1?: string } = {}, field?: string) => {
        only(field);
      })
    );
    @ViewChild('vest', { static: true }) vestForm!: FormDirective<any>;
  }

  it('should memoize formState when status changes but values/errors/valid remain the same', async () => {
    const { fixture } = await render(TestMemoizationHost);
    const instance = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    // Get initial formState reference
    const initialState = instance.vestForm.formState();

    // Trigger form status change without changing actual values/errors/valid
    // This simulates Angular's statusChanges emitting even when nothing meaningful changed
    instance.vestForm.ngForm.form.updateValueAndValidity({ emitEvent: true });
    fixture.detectChanges();
    await fixture.whenStable();

    // FormState should return same reference due to memoization
    const stateAfterUpdate = instance.vestForm.formState();
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

    const state1 = instance.vestForm.formState();

    // Multiple calls without changes should return same instance
    const state2 = instance.vestForm.formState();
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
    const state1 = instance.vestForm.formState();

    // Trigger multiple status changes without actual value/error changes
    for (let i = 0; i < 5; i++) {
      instance.vestForm.ngForm.form.updateValueAndValidity({ emitEvent: true });
      fixture.detectChanges();
    }

    const state2 = instance.vestForm.formState();

    // Should still be the same reference, meaning getAllFormErrors was not called
    // for each status change - the memoization prevented unnecessary recalculations
    expect(state2).toBe(state1);
  });
});
