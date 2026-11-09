import {
  Component,
  DebugElement,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgModel } from '@angular/forms';
import type {
  FormCheckboxControl,
  FormValueControl,
} from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { create, enforce, test as vestTest } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { NgxVestForms } from '../exports';
import { FormModelDirective } from './form-model.directive';

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
