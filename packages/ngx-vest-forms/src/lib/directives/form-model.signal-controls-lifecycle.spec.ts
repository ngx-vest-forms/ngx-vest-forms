import {
  Component,
  DebugElement,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AbstractControl,
  ControlValueAccessor,
  NgControl,
  NgForm,
  NgModel,
} from '@angular/forms';
import type { FormValueControl } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { create, enforce, test as vestTest } from 'vest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NgxVestForms } from '../exports';
import { FormModelDirective } from './form-model.directive';
import { FormDirective, NgxValidationConfig } from './form.directive';

/**
 * Lifecycle edge cases of the Signal Forms custom-control support in
 * `FormModelDirective`: which hosts get the check, where the control lives,
 * how the first result is surfaced, and what is cleaned up.
 */

type Model = { count?: number | null; note?: string };

/** A minimal Signal Forms `FormValueControl` (no ControlValueAccessor). */
@Component({
  selector: 'ngx-test-lc-count',
  template: `<input
    data-testid="count"
    [value]="value() ?? ''"
    (input)="onInput($event)"
    (blur)="touch.emit()"
  />`,
})
class CountControlComponent implements FormValueControl<number | null> {
  readonly value = model<number | null>(null);
  readonly disabled = input(false);
  readonly touch = output();

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.value.set(text === '' ? null : Number(text));
  }
}

/**
 * A `FormValueControl` that also assigns itself as the value accessor. With
 * `ngNoCva` on the host, Angular ignores the accessor and takes the
 * custom-control path.
 */
@Component({
  selector: 'ngx-test-lc-hybrid',
  template: `<input data-testid="hybrid" />`,
})
class HybridControlComponent
  implements FormValueControl<number | null>, ControlValueAccessor
{
  readonly value = model<number | null>(null);
  readonly touch = output();

  constructor() {
    inject(NgControl, { self: true }).valueAccessor = this;
  }

  writeValue(): void {
    // Unused: Angular binds the value model on the custom-control path.
  }
  registerOnChange(): void {
    // Unused on the custom-control path.
  }
  registerOnTouched(): void {
    // Unused on the custom-control path.
  }
}

/** A child component whose `ngModel` has no parent ControlContainer. */
@Component({
  selector: 'ngx-test-lc-child',
  imports: [NgxVestForms, CountControlComponent],
  template: `<ngx-test-lc-count name="count" required [ngModel]="null" />`,
})
class ChildWithoutContainerComponent {}

const runs: string[] = [];

/** How often each field's test body ran. */
const runCounts = (): Record<string, number> => ({
  count: runs.filter((field) => field === 'count').length,
  note: runs.filter((field) => field === 'note').length,
});

const suite = create((data: Model = {}) => {
  vestTest('count', 'Count must be between 1 and 5', () => {
    runs.push('count');
    enforce(data.count).isNumber().isBetween(1, 5);
  });
  vestTest('note', 'Note is required', () => {
    runs.push('note');
    enforce(data.note).isNotEmpty();
  });
});

/** Re-renders until the assertion passes (Vest runs and settles async). */
const eventually = (
  fixture: ComponentFixture<unknown>,
  assertion: () => void
): Promise<void> =>
  vi.waitFor(async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    assertion();
  });

const formOf = (fixture: ComponentFixture<unknown>): FormDirective<Model> =>
  fixture.debugElement
    .query(By.directive(FormDirective))
    .injector.get<FormDirective<Model>>(FormDirective);

const byTestId = (
  fixture: ComponentFixture<unknown>,
  id: string
): DebugElement => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));

const hasOwnAsyncValidator = (element: DebugElement): boolean => {
  const ngModel = element.injector.get(NgModel);
  const asyncValidator = ngModel.asyncValidator;
  return (
    asyncValidator !== null && ngModel.control.hasAsyncValidator(asyncValidator)
  );
};

/** How often one revalidation of `control` runs the directive on `element`. */
const runsOn = (
  directive: FormModelDirective,
  control: AbstractControl
): number => {
  const spy = vi.spyOn(directive, 'validate');
  try {
    control.updateValueAndValidity({ emitEvent: false });
    return spy.mock.calls.length;
  } finally {
    spy.mockRestore();
  }
};

const settleCooldown = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 700);
  });

describe('FormModelDirective with Signal Forms controls: lifecycle', () => {
  beforeEach(() => {
    suite.reset();
    runs.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches validators to a self-assigned accessor host that opts out with ngNoCva', async () => {
    @Component({
      imports: [NgxVestForms, HybridControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-lc-hybrid
            data-testid="host"
            ngNoCva
            name="count"
            [ngModel]="model().count"
          />
        </form>
      `,
    })
    class HybridHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
    }

    const fixture = TestBed.createComponent(HybridHostComponent);
    fixture.detectChanges();
    await eventually(fixture, () => {
      expect(hasOwnAsyncValidator(byTestId(fixture, 'host'))).toBe(true);
      expect(formOf(fixture).status()).toBe('INVALID');
    });
  });

  it('attaches validators when the ngModel has no parent container', async () => {
    @Component({
      imports: [NgxVestForms, ChildWithoutContainerComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-lc-child />
        </form>
      `,
    })
    class ChildHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
    }

    // Angular warns (NG01354) that this ngModel cannot reach the parent form.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      // Asserted below.
    });
    const fixture = TestBed.createComponent(ChildHostComponent);
    fixture.detectChanges();
    const element = fixture.debugElement.query(
      By.directive(CountControlComponent)
    );
    await eventually(fixture, () => {
      expect(element.injector.get(NgModel).formDirective).toBeNull();
      expect(hasOwnAsyncValidator(element)).toBe(true);
      expect(element.injector.get(NgModel).control.errors?.['required']).toBe(
        true
      );
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('NG01354'));
  });

  it('attaches validators to a control registered in a nested ng-form', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ng-form>
            <ngx-test-lc-count
              data-testid="nested"
              name="count"
              required
              [ngModel]="model().count"
            />
          </ng-form>
        </form>
      `,
    })
    class NestedFormHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
    }

    const fixture = TestBed.createComponent(NestedFormHostComponent);
    fixture.detectChanges();
    const element = byTestId(fixture, 'nested');
    await eventually(fixture, () => {
      expect(hasOwnAsyncValidator(element)).toBe(true);
      expect(element.injector.get(NgModel).control.errors?.['required']).toBe(
        true
      );
    });
  });

  it('logs NGX-108 in dev mode when the control never registers', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      // Asserted below.
    });

    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-lc-count name="count" [ngModel]="model().count" />
        </form>
      `,
    })
    class NeverRegisteredHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
    }

    const fixture = TestBed.createComponent(NeverRegisteredHostComponent);
    // Before any microtask runs, make the form report no control at any path.
    const ngForm = fixture.debugElement
      .query(By.directive(NgForm))
      .injector.get(NgForm);
    vi.spyOn(ngForm.form, 'get').mockReturnValue(null);
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[NGX-108]'));
    });
  });

  it('runs each field once on load when a Signal Forms control triggers validationConfig, like a native trigger', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form
          ngxVestForm
          [suite]="suite"
          [formValue]="model()"
          [validationConfig]="config"
        >
          <ngx-test-lc-count name="count" [ngModel]="model().count" />
          <input name="note" [ngModel]="model().note" />
        </form>
      `,
    })
    class SignalTriggerHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
      readonly config: NgxValidationConfig<Model> = { count: ['note'] };
    }

    @Component({
      imports: [NgxVestForms],
      template: `
        <form
          ngxVestForm
          [suite]="suite"
          [formValue]="model()"
          [validationConfig]="config"
        >
          <input name="count" type="number" [ngModel]="model().count" />
          <input name="note" [ngModel]="model().note" />
        </form>
      `,
    })
    class NativeTriggerHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
      readonly config: NgxValidationConfig<Model> = { count: ['note'] };
    }

    const signalFixture = TestBed.createComponent(SignalTriggerHostComponent);
    signalFixture.detectChanges();
    const valueEvents: unknown[] = [];
    formOf(signalFixture).ngForm.form.valueChanges.subscribe((value) =>
      valueEvents.push(value)
    );
    await eventually(signalFixture, () => {
      expect(formOf(signalFixture).status()).toBe('INVALID');
    });
    await settleCooldown();
    await signalFixture.whenStable();
    const signalRuns = runCounts();
    const signalValueEvents = valueEvents.length;

    suite.reset();
    runs.length = 0;
    valueEvents.length = 0;
    const nativeFixture = TestBed.createComponent(NativeTriggerHostComponent);
    nativeFixture.detectChanges();
    formOf(nativeFixture).ngForm.form.valueChanges.subscribe((value) =>
      valueEvents.push(value)
    );
    await eventually(nativeFixture, () => {
      expect(formOf(nativeFixture).status()).toBe('INVALID');
    });
    await settleCooldown();
    await nativeFixture.whenStable();

    expect(signalRuns).toEqual({ count: 1, note: 1 });
    expect(signalRuns).toEqual(runCounts());
    expect(signalValueEvents).toBe(valueEvents.length);
  });

  it('emits no valueChanges on the control when the validator is attached', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-lc-count name="count" [ngModel]="model().count" />
          <input name="note" [ngModel]="model().note" />
        </form>
      `,
    })
    class ValueEventsHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({ count: 2, note: 'filled' });
    }

    const fixture = TestBed.createComponent(ValueEventsHostComponent);
    fixture.detectChanges();
    const countControl = fixture.debugElement
      .query(By.directive(CountControlComponent))
      .injector.get(NgModel).control;
    const noteControl = fixture.debugElement
      .query(By.css('input[name="note"]'))
      .injector.get(NgModel).control;
    let countEvents = 0;
    let noteEvents = 0;
    countControl.valueChanges.subscribe(() => countEvents++);
    noteControl.valueChanges.subscribe(() => noteEvents++);

    await eventually(fixture, () => {
      expect(formOf(fixture).status()).toBe('VALID');
    });

    // Both get the one emitting setValue NgModel runs after setup.
    expect(countEvents).toBe(noteEvents);
  });

  it('removes what it attached when it moves to a shared control or is destroyed', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-lc-count
            data-testid="first"
            name="count"
            [ngModel]="model().count"
          />
          @if (showSecond()) {
            <ngx-test-lc-count
              data-testid="second"
              [name]="secondName()"
              [ngModel]="model().count"
            />
          }
        </form>
      `,
    })
    class SharedHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
      readonly secondName = signal('other');
      readonly showSecond = signal(true);
    }

    // Destroying the second NgModel removes the shared control from the form
    // (Angular's behaviour), so revalidating it afterwards logs NGX-104.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      // Asserted below.
    });
    const fixture = TestBed.createComponent(SharedHostComponent);
    fixture.detectChanges();
    const first = byTestId(fixture, 'first');
    const second = byTestId(fixture, 'second');
    const sharedControl = first.injector.get(NgModel).control;
    await eventually(fixture, () => {
      expect(hasOwnAsyncValidator(second)).toBe(true);
    });

    const ownControl = second.injector.get(NgModel).control;
    const firstDirective = first.injector.get(FormModelDirective);
    const secondDirective = second.injector.get(FormModelDirective);

    fixture.componentInstance.secondName.set('count');
    await eventually(fixture, () => {
      expect(second.injector.get(NgModel).control).toBe(sharedControl);
      expect(runsOn(secondDirective, sharedControl)).toBe(1);
    });
    // Moved off its own control: what it added there is gone.
    expect(runsOn(secondDirective, ownControl)).toBe(0);
    expect(runsOn(firstDirective, sharedControl)).toBe(1);

    // Renaming again (Angular keeps the shared control) adds nothing twice.
    fixture.componentInstance.secondName.set('again');
    await eventually(fixture, () => {
      expect(runsOn(secondDirective, sharedControl)).toBe(1);
    });

    // Destroyed while attached to the first control: nothing of it remains.
    fixture.componentInstance.showSecond.set(false);
    await eventually(fixture, () => {
      expect(byTestId(fixture, 'second')).toBeNull();
      expect(runsOn(secondDirective, sharedControl)).toBe(0);
    });
    expect(runsOn(firstDirective, sharedControl)).toBe(1);
    for (const [message] of warn.mock.calls) {
      expect(String(message)).toContain('[NGX-104]');
    }
  });

  it('updates the form status after a rename onto a field with a failing test', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-lc-count [name]="name()" [ngModel]="model().count" />
        </form>
      `,
    })
    class RenameHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
      readonly name = signal('other');
    }

    const fixture = TestBed.createComponent(RenameHostComponent);
    fixture.detectChanges();
    await eventually(fixture, () => {
      expect(formOf(fixture).status()).toBe('VALID');
    });

    fixture.componentInstance.name.set('count');
    await eventually(fixture, () => {
      expect(formOf(fixture).status()).toBe('INVALID');
    });
  });
});
