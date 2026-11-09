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
import { ControlValueAccessor, NgControl, NgModel } from '@angular/forms';
import type {
  FormCheckboxControl,
  FormValueControl,
} from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { create, enforce, test as vestTest } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { NgxVestForms } from '../exports';
import { FormModelDirective } from './form-model.directive';
import { FormDirective, NgxSubmitSettledEvent } from './form.directive';

/**
 * Angular 22.2 binds `[ngModel]` on a Signal Forms custom control through
 * `setupCustomControl()`, which never attaches the validators collected from
 * `NG_VALIDATORS` / `NG_ASYNC_VALIDATORS`. These specs pin that
 * `FormModelDirective` attaches them itself, and only when Angular did not.
 */

/** A minimal Signal Forms `FormValueControl` (no ControlValueAccessor). */
@Component({
  selector: 'ngx-test-count-control',
  template: `
    <input
      data-testid="count"
      [value]="value() ?? ''"
      [disabled]="disabled()"
      (input)="onInput($event)"
      (blur)="touch.emit()"
    />
  `,
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

/** A minimal Signal Forms `FormCheckboxControl` (no ControlValueAccessor). */
@Component({
  selector: 'ngx-test-consent-control',
  template: `
    <button
      type="button"
      role="switch"
      data-testid="consent"
      aria-label="Consent"
      [attr.aria-checked]="checked()"
      (click)="checked.set(!checked())"
      (blur)="touch.emit()"
    ></button>
  `,
})
class ConsentControlComponent implements FormCheckboxControl {
  readonly checked = model(false);
  readonly disabled = input(false);
  readonly touch = output();
}

type Model = { count?: number | null; consent?: boolean; note?: string };

const suite = create((data: Model = {}) => {
  vestTest('count', 'Count must be between 1 and 5', () => {
    enforce(data.count).isNumber().isBetween(1, 5);
  });
  vestTest('consent', 'Consent is required', () => {
    enforce(data.consent).equals(true);
  });
  vestTest('note', 'Note is required', () => {
    enforce(data.note).isNotEmpty();
  });
});

@Component({
  imports: [NgxVestForms, CountControlComponent, ConsentControlComponent],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="model()"
      (formValueChange)="model.set($event)"
    >
      <ngx-test-count-control name="count" [ngModel]="model().count" />
      <ngx-test-consent-control name="consent" [ngModel]="model().consent" />
      <input data-testid="note" name="note" [ngModel]="model().note" />
    </form>
  `,
})
class HostComponent {
  readonly suite = suite;
  readonly model = signal<Model>({});
}

const errorsOf = (ngModel: NgModel): unknown =>
  ngModel.control.errors?.['errors'];

/**
 * How many times one revalidation of the control runs this field's
 * `FormModelDirective`: 1 when its validator is attached exactly once.
 * (`hasAsyncValidator` cannot tell, and `removeAsyncValidators` drops every
 * copy at once.)
 */
const vestRunsPerRevalidation = (debugElement: DebugElement): number => {
  const directive = debugElement.injector.get(FormModelDirective);
  const spy = vi.spyOn(directive, 'validate');
  try {
    debugElement.injector.get(NgModel).control.updateValueAndValidity();
    return spy.mock.calls.length;
  } finally {
    spy.mockRestore();
  }
};

describe('FormModelDirective with Signal Forms custom controls', () => {
  let fixture: ComponentFixture<HostComponent>;

  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const elementOf = (directive: unknown): DebugElement =>
    fixture.debugElement.query(By.directive(directive as never));

  const ngModelOf = (directive: unknown): NgModel =>
    elementOf(directive).injector.get(NgModel);

  const noteElement = (): DebugElement =>
    fixture.debugElement.query(By.css('[data-testid="note"]'));

  beforeEach(async () => {
    suite.reset();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await settle();
  });

  it('binds the Signal Forms interop path, not a ControlValueAccessor', () => {
    expect(ngModelOf(CountControlComponent).valueAccessor).toBeNull();
    expect(ngModelOf(ConsentControlComponent).valueAccessor).toBeNull();
  });

  it('attaches the Vest validator to FormValueControl and FormCheckboxControl hosts', () => {
    for (const ngModel of [
      ngModelOf(CountControlComponent),
      ngModelOf(ConsentControlComponent),
    ]) {
      const asyncValidator = ngModel.asyncValidator;
      expect(asyncValidator).not.toBeNull();
      if (asyncValidator) {
        expect(ngModel.control.hasAsyncValidator(asyncValidator)).toBe(true);
      }
    }
  });

  it('shows Vest errors for an invalid FormValueControl value and clears them for a valid one', async () => {
    const ngModel = ngModelOf(CountControlComponent);
    const countInput = fixture.nativeElement.querySelector(
      '[data-testid="count"]'
    ) as HTMLInputElement;

    countInput.value = '9';
    countInput.dispatchEvent(new Event('input'));
    await vi.waitFor(async () => {
      await settle();
      expect(errorsOf(ngModel)).toEqual(['Count must be between 1 and 5']);
    });
    expect(ngModel.control.invalid).toBe(true);

    countInput.value = '3';
    countInput.dispatchEvent(new Event('input'));
    await vi.waitFor(async () => {
      await settle();
      expect(ngModel.control.errors).toBeNull();
    });
    expect(fixture.componentInstance.model().count).toBe(3);
  });

  it('shows Vest errors for an invalid FormCheckboxControl value and clears them for a valid one', async () => {
    const ngModel = ngModelOf(ConsentControlComponent);

    await vi.waitFor(async () => {
      await settle();
      expect(errorsOf(ngModel)).toEqual(['Consent is required']);
    });

    (
      fixture.nativeElement.querySelector(
        '[data-testid="consent"]'
      ) as HTMLButtonElement
    ).click();
    await vi.waitFor(async () => {
      await settle();
      expect(ngModel.control.errors).toBeNull();
    });
    expect(fixture.componentInstance.model().consent).toBe(true);
  });

  it('attaches the validator to Signal Forms controls exactly once', () => {
    expect(vestRunsPerRevalidation(elementOf(CountControlComponent))).toBe(1);
    expect(vestRunsPerRevalidation(elementOf(ConsentControlComponent))).toBe(1);
  });

  it('leaves a native ngModel input with the validator Angular attached, exactly once', async () => {
    const ngModel = noteElement().injector.get(NgModel);
    expect(ngModel.valueAccessor).not.toBeNull();
    expect(vestRunsPerRevalidation(noteElement())).toBe(1);

    await vi.waitFor(async () => {
      await settle();
      expect(errorsOf(ngModel)).toEqual(['Note is required']);
    });
  });

  it('leaves a component that sets ngControl.valueAccessor itself with the validator attached once', async () => {
    @Component({
      selector: 'ngx-test-self-accessor',
      template: `<input
        data-testid="self-accessor"
        (input)="onChange($any($event.target).value)"
      />`,
    })
    class SelfAccessorComponent implements ControlValueAccessor {
      protected onChange: (value: string) => void = () => {
        // Replaced by registerOnChange.
      };

      constructor() {
        inject(NgControl, { self: true }).valueAccessor = this;
      }

      writeValue(): void {
        // The test never writes a model value into the view.
      }
      registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
      }
      registerOnTouched(): void {
        // Touch handling is not under test.
      }
    }

    @Component({
      imports: [NgxVestForms, SelfAccessorComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-self-accessor name="note" [ngModel]="model().note" />
        </form>
      `,
    })
    class SelfAccessorHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
    }

    const selfFixture = TestBed.createComponent(SelfAccessorHostComponent);
    selfFixture.detectChanges();
    const element = selfFixture.debugElement.query(
      By.directive(SelfAccessorComponent)
    );
    await vi.waitFor(async () => {
      await selfFixture.whenStable();
      expect(errorsOf(element.injector.get(NgModel))).toEqual([
        'Note is required',
      ]);
    });
    expect(vestRunsPerRevalidation(element)).toBe(1);
  });

  it('attaches sync validators on the same element too, such as required', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-count-control
            name="count"
            required
            [ngModel]="model().count"
          />
        </form>
      `,
    })
    class RequiredHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
    }

    const requiredFixture = TestBed.createComponent(RequiredHostComponent);
    requiredFixture.detectChanges();

    const ngModel = requiredFixture.debugElement
      .query(By.directive(CountControlComponent))
      .injector.get(NgModel);
    await vi.waitFor(async () => {
      await requiredFixture.whenStable();
      const validator = ngModel.validator;
      expect(validator).not.toBeNull();
      if (validator) {
        expect(ngModel.control.hasValidator(validator)).toBe(true);
      }
      expect(ngModel.control.errors?.['required']).toBe(true);
    });
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

const formDirectiveOf = (
  fixture: ComponentFixture<unknown>
): FormDirective<Model> =>
  fixture.debugElement
    .query(By.directive(FormDirective))
    .injector.get<FormDirective<Model>>(FormDirective);

describe('FormModelDirective with Signal Forms controls: status propagation', () => {
  beforeEach(() => {
    suite.reset();
  });

  it('reports the first Vest result of a form with only a Signal Forms control', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-count-control name="count" [ngModel]="model().count" />
        </form>
      `,
    })
    class OnlySignalHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
    }

    const fixture = TestBed.createComponent(OnlySignalHostComponent);
    fixture.detectChanges();
    const form = formDirectiveOf(fixture);

    await eventually(fixture, () => {
      expect(form.ngForm.form.status).toBe('INVALID');
      expect(form.status()).toBe('INVALID');
      expect(form.valid()).toBe(false);
    });
  });

  it('does not leave the form status PENDING next to a native input', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <input name="note" [ngModel]="model().note" />
          <ngx-test-count-control name="count" [ngModel]="model().count" />
        </form>
      `,
    })
    class MixedHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({ note: 'filled' });
    }

    const fixture = TestBed.createComponent(MixedHostComponent);
    fixture.detectChanges();
    const form = formDirectiveOf(fixture);

    await eventually(fixture, () => {
      expect(form.ngForm.form.status).toBe('INVALID');
      expect(form.status()).toBe('INVALID');
    });
  });

  it('reports a Signal Forms control added later through @if', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form
          ngxVestForm
          [suite]="suite"
          [formValue]="model()"
          (validChange)="validChanges.push($event)"
          (errorsChange)="errorsChanges.push($event)"
        >
          <input name="note" [ngModel]="model().note" />
          @if (show()) {
            <ngx-test-count-control name="count" [ngModel]="model().count" />
          }
        </form>
      `,
    })
    class ConditionalHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({ note: 'filled' });
      readonly show = signal(false);
      readonly validChanges: boolean[] = [];
      readonly errorsChanges: Record<string, string[]>[] = [];
    }

    const fixture = TestBed.createComponent(ConditionalHostComponent);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const form = formDirectiveOf(fixture);
    await eventually(fixture, () => {
      expect(form.valid()).toBe(true);
    });

    host.show.set(true);
    await eventually(fixture, () => {
      expect(form.valid()).toBe(false);
      expect(host.validChanges.at(-1)).toBe(false);
      expect(host.errorsChanges.at(-1)?.['count']).toEqual([
        'Count must be between 1 and 5',
      ]);
    });
  });

  it('shows the error of a Signal Forms control in a wrapper with errorDisplayMode="always"', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-control-wrapper errorDisplayMode="always">
            <ngx-test-count-control name="count" [ngModel]="model().count" />
          </ngx-control-wrapper>
        </form>
      `,
    })
    class WrapperHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
    }

    const fixture = TestBed.createComponent(WrapperHostComponent);
    fixture.detectChanges();

    await eventually(fixture, () => {
      expect(fixture.nativeElement.textContent).toContain(
        'Count must be between 1 and 5'
      );
    });
  });

  it('settles a submit made while the first Signal Forms validation runs', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form
          ngxVestForm
          [suite]="suite"
          [formValue]="model()"
          (submitSettled)="settled.push($event)"
        >
          <ngx-test-count-control name="count" [ngModel]="model().count" />
        </form>
      `,
    })
    class SubmitHostComponent {
      // An async Vest test keeps the first run pending long enough to submit
      // in the middle of it.
      readonly suite = create((data: Model = {}) => {
        vestTest('count', 'Count is required', async () => {
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });
          if (data.count === undefined || data.count === null) {
            throw new Error('missing');
          }
        });
      });
      readonly model = signal<Model>({});
      readonly settled: NgxSubmitSettledEvent<Model>[] = [];
    }

    const fixture = TestBed.createComponent(SubmitHostComponent);
    fixture.detectChanges();
    const form = formDirectiveOf(fixture);
    // Let NgForm register the control and the validator attach, then submit
    // while the first (async) Vest run is still pending.
    await vi.waitFor(() => {
      expect(form.ngForm.form.status).toBe('PENDING');
    });
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { cancelable: true }));

    await eventually(fixture, () => {
      expect(fixture.componentInstance.settled).toHaveLength(1);
      expect(fixture.componentInstance.settled[0]?.valid).toBe(false);
    });
  });
});

describe('FormModelDirective with Signal Forms controls: validator changes', () => {
  const emptySuite = create(() => {
    // No Vest tests: only Angular's required validator decides.
  });

  it('revalidates when a bound [required] toggles', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-count-control
            name="count"
            [required]="required()"
            [ngModel]="model().count"
          />
        </form>
      `,
    })
    class ToggleRequiredHostComponent {
      readonly suite = emptySuite;
      readonly model = signal<Model>({});
      readonly required = signal(false);
    }

    const fixture = TestBed.createComponent(ToggleRequiredHostComponent);
    fixture.detectChanges();
    const ngModel = fixture.debugElement
      .query(By.directive(CountControlComponent))
      .injector.get(NgModel);
    await eventually(fixture, () => {
      expect(ngModel.control.valid).toBe(true);
    });

    fixture.componentInstance.required.set(true);
    await eventually(fixture, () => {
      expect(ngModel.control.errors?.['required']).toBe(true);
    });

    fixture.componentInstance.required.set(false);
    await eventually(fixture, () => {
      expect(ngModel.control.valid).toBe(true);
    });
  });

  it('does not treat required on a FormCheckboxControl as "must be checked" (documented)', async () => {
    @Component({
      imports: [NgxVestForms, ConsentControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-consent-control
            name="consent"
            required
            [ngModel]="model().consent"
          />
        </form>
      `,
    })
    class RequiredCheckboxHostComponent {
      readonly suite = emptySuite;
      readonly model = signal<Model>({ consent: false });
    }

    const fixture = TestBed.createComponent(RequiredCheckboxHostComponent);
    fixture.detectChanges();
    const ngModel = fixture.debugElement
      .query(By.directive(ConsentControlComponent))
      .injector.get(NgModel);
    await eventually(fixture, () => {
      const validator = ngModel.validator;
      expect(validator && ngModel.control.hasValidator(validator)).toBe(true);
      expect(ngModel.control.value).toBe(false);
      expect(ngModel.control.valid).toBe(true);
    });
  });
});

describe('FormModelDirective with Signal Forms controls: name changes', () => {
  beforeEach(() => {
    suite.reset();
  });

  it('keeps Vest validation attached after the control is renamed', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-count-control [name]="name()" [ngModel]="model().count" />
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
    const element = fixture.debugElement.query(
      By.directive(CountControlComponent)
    );
    const ngModel = element.injector.get(NgModel);
    await eventually(fixture, () => {
      expect(ngModel.control.errors).toBeNull();
    });

    fixture.componentInstance.name.set('count');
    await eventually(fixture, () => {
      expect(errorsOf(ngModel)).toEqual(['Count must be between 1 and 5']);
    });
    expect(vestRunsPerRevalidation(element)).toBe(1);
  });

  it('attaches its validator when renamed onto an already registered name', async () => {
    @Component({
      imports: [NgxVestForms, CountControlComponent],
      template: `
        <form ngxVestForm [suite]="suite" [formValue]="model()">
          <ngx-test-count-control
            data-testid="first"
            name="count"
            [ngModel]="model().count"
          />
          <ngx-test-count-control
            data-testid="second"
            [name]="secondName()"
            [ngModel]="model().count"
          />
        </form>
      `,
    })
    class SharedNameHostComponent {
      readonly suite = suite;
      readonly model = signal<Model>({});
      readonly secondName = signal('other');
    }

    const fixture = TestBed.createComponent(SharedNameHostComponent);
    fixture.detectChanges();
    const second = fixture.debugElement.query(By.css('[data-testid="second"]'));
    const secondNgModel = second.injector.get(NgModel);
    await eventually(fixture, () => {
      expect(secondNgModel.control.errors).toBeNull();
    });
    const controlBefore = secondNgModel.control;

    fixture.componentInstance.secondName.set('count');
    // Angular points the second NgModel at the first one's control, as it does
    // for a ControlValueAccessor; the second directive's validator must be
    // attached to that control too.
    await eventually(fixture, () => {
      expect(secondNgModel.control).not.toBe(controlBefore);
      expect(vestRunsPerRevalidation(second)).toBe(1);
    });
  });
});

describe('FormModelDirective with Signal Forms controls: value events on attach', () => {
  beforeEach(() => {
    suite.reset();
  });

  @Component({
    imports: [NgxVestForms, CountControlComponent],
    template: `
      <form
        ngxVestForm
        [suite]="suite"
        [formValue]="model()"
        (formValueChange)="valueChanges.push($event)"
      >
        <ngx-test-count-control name="count" [ngModel]="model().count" />
      </form>
    `,
  })
  class SignalValueEventsHostComponent {
    readonly suite = suite;
    readonly model = signal<Model>({ count: 2 });
    readonly valueChanges: Model[] = [];
  }

  @Component({
    imports: [NgxVestForms],
    template: `
      <form
        ngxVestForm
        [suite]="suite"
        [formValue]="model()"
        (formValueChange)="valueChanges.push($event)"
      >
        <input name="note" [ngModel]="model().note" />
      </form>
    `,
  })
  class NativeValueEventsHostComponent {
    readonly suite = suite;
    readonly model = signal<Model>({ note: 'filled' });
    readonly valueChanges: Model[] = [];
  }

  it('emits formValueChange once for the initial value, like a native input', async () => {
    const signalFixture = TestBed.createComponent(
      SignalValueEventsHostComponent
    );
    signalFixture.detectChanges();
    const signalNgModel = signalFixture.debugElement
      .query(By.directive(CountControlComponent))
      .injector.get(NgModel);
    // Wait until the attach has run and its first Vest result has landed.
    await eventually(signalFixture, () => {
      const asyncValidator = signalNgModel.asyncValidator;
      expect(
        asyncValidator &&
          signalNgModel.control.hasAsyncValidator(asyncValidator)
      ).toBe(true);
      expect(formDirectiveOf(signalFixture).status()).toBe('VALID');
    });

    const nativeFixture = TestBed.createComponent(
      NativeValueEventsHostComponent
    );
    nativeFixture.detectChanges();
    await eventually(nativeFixture, () => {
      expect(formDirectiveOf(nativeFixture).status()).toBe('VALID');
    });

    // A native input reports the initial value once (the emitting setValue
    // NgModel runs after setup). The attach announces only the status, so the
    // Signal Forms control reports it once too.
    expect(nativeFixture.componentInstance.valueChanges).toEqual([
      { note: 'filled' },
    ]);
    expect(signalFixture.componentInstance.valueChanges).toEqual([
      { count: 2 },
    ]);
  });
});
