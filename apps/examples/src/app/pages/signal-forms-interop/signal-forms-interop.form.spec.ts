import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { NgModel } from '@angular/forms';
import { By } from '@angular/platform-browser';
import type { NgxSubmitSettledEvent } from 'ngx-vest-forms';
import { vi } from 'vitest';
import { ConsentSwitchComponent } from './consent-switch.component';
import { SeatStepperComponent } from './seat-stepper.component';
import { SignalFormsInteropFormBody } from './signal-forms-interop.form';
import type { SignalFormsInteropModel } from './signal-forms-interop.model';
import { signalFormsInteropSuite } from './signal-forms-interop.validations';

@Component({
  imports: [SignalFormsInteropFormBody],
  template: `
    <ngx-signal-forms-interop-form-body
      [formValue]="formValue()"
      [suite]="suite"
      (formValueChange)="formValue.set($event)"
      (submitted)="submitted.set($event)"
    />
  `,
})
class HostComponent {
  readonly suite = signalFormsInteropSuite;
  readonly formValue = signal<SignalFormsInteropModel>({});
  readonly submitted =
    signal<NgxSubmitSettledEvent<SignalFormsInteropModel> | null>(null);
  readonly body = viewChild.required(SignalFormsInteropFormBody);
}

describe('Signal Forms controls with ngModel in ngxVestForm', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let root: HTMLElement;

  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  /** Re-renders until the assertion passes (Vest runs and settles async). */
  const eventually = (assertion: () => void): Promise<void> =>
    vi.waitFor(async () => {
      await settle();
      assertion();
    });

  const seatsInput = (): HTMLInputElement =>
    root.querySelector<HTMLInputElement>('input#seats')!;
  const termsSwitch = (): HTMLButtonElement =>
    root.querySelector<HTMLButtonElement>('button#acceptTerms')!;
  const ngModelOf = (component: unknown): NgModel =>
    fixture.debugElement
      .query(By.directive(component as never))
      .injector.get(NgModel);
  const describedText = (element: HTMLElement): string =>
    (element.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => root.querySelector(`#${CSS.escape(id)}`)?.textContent ?? '')
      .join(' ');

  const submit = async (): Promise<void> => {
    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
  };

  beforeEach(async () => {
    signalFormsInteropSuite.reset();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    fixture.detectChanges();
    await settle();
  });

  it('uses the Signal Forms interop path, not a ControlValueAccessor', () => {
    expect(ngModelOf(SeatStepperComponent).valueAccessor).toBeNull();
    expect(ngModelOf(ConsentSwitchComponent).valueAccessor).toBeNull();
  });

  it('writes the control value into the form model', async () => {
    const input = seatsInput();
    input.value = '3';
    input.dispatchEvent(new Event('input'));
    termsSwitch().click();
    await settle();

    expect(host.formValue()).toEqual(
      expect.objectContaining({ seats: 3, acceptTerms: true })
    );
  });

  it('writes the model into the control (model-to-view)', async () => {
    host.formValue.set({ seats: 5, acceptTerms: true });
    await settle();

    expect(seatsInput().value).toBe('5');
    expect(termsSwitch().getAttribute('aria-checked')).toBe('true');
  });

  it('runs Vest and shows errors with ARIA on the inner input and the switch after submit', async () => {
    await submit();

    // The first Vest run of a Signal Forms control may still be pending at
    // submit time; submitSettled waits for it.
    await eventually(() => expect(host.submitted()?.valid).toBe(false));
    expect(seatsInput().getAttribute('aria-invalid')).toBe('true');
    expect(describedText(seatsInput())).toContain(
      'Choose how many seats you need'
    );
    // The hint id passed into the control survives the wrapper's merge.
    expect(seatsInput().getAttribute('aria-describedby')).toContain(
      'seats-hint'
    );
    expect(termsSwitch().getAttribute('aria-invalid')).toBe('true');
    expect(describedText(termsSwitch())).toContain(
      'Accept the booking terms to continue'
    );
  });

  it('validates the range rule from the suite', async () => {
    const input = seatsInput();
    input.value = '12';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await settle();

    expect(ngModelOf(SeatStepperComponent).control.touched).toBe(true);
    await eventually(() =>
      expect(describedText(seatsInput())).toContain(
        'Book between 1 and 8 seats'
      )
    );
  });

  it('marks the field touched on blur through the touch output and shows its error', async () => {
    const control = ngModelOf(ConsentSwitchComponent).control;
    expect(control.touched).toBe(false);
    expect(termsSwitch().hasAttribute('aria-invalid')).toBe(false);

    termsSwitch().focus();
    termsSwitch().dispatchEvent(new FocusEvent('blur'));
    termsSwitch().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await settle();

    expect(control.touched).toBe(true);
    await eventually(() =>
      expect(termsSwitch().getAttribute('aria-invalid')).toBe('true')
    );
  });

  it('propagates the disabled state from the control into the component', async () => {
    const control = ngModelOf(SeatStepperComponent).control;

    control.disable();
    await settle();
    expect(seatsInput().disabled).toBe(true);

    control.enable();
    await settle();
    expect(seatsInput().disabled).toBe(false);
  });

  it('disables the stepper through [disabled] on ngModel and keeps its value in the submitted value', async () => {
    const input = seatsInput();
    input.value = '12';
    input.dispatchEvent(new Event('input'));
    await settle();

    root.querySelector<HTMLInputElement>('#lockSeats')!.click();
    await settle();

    expect(ngModelOf(SeatStepperComponent).control.disabled).toBe(true);
    expect(seatsInput().disabled).toBe(true);

    termsSwitch().click();
    await submit();

    // The suite skips the locked field, so 12 (out of range) does not block
    // the submit. The value is still submitted: ngx-vest-forms builds the
    // form value from getRawValue(), which includes disabled controls.
    await eventually(() => expect(host.submitted()?.valid).toBe(true));
    expect(host.submitted()?.value).toEqual({
      seats: 12,
      lockSeats: true,
      acceptTerms: true,
    });
  });

  describe('typed seat counts', () => {
    const type = async (text: string): Promise<void> => {
      const input = seatsInput();
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await settle();
    };

    it('limits the input to two digits', async () => {
      expect(seatsInput().maxLength).toBe(2);

      // A paste can bypass maxlength in some paths; the handler trims too.
      await type('1234567890123456789012');

      expect(seatsInput().value).toBe('12');
      expect(host.formValue().seats).toBe(12);
    });

    it('shows the model value, not the typed text, after a leading zero', async () => {
      await type('5');
      await type('05');

      expect(host.formValue().seats).toBe(5);
      expect(seatsInput().value).toBe('5');
      expect(seatsInput().getAttribute('aria-valuenow')).toBe('5');
    });

    it('drops non-digits', async () => {
      await type('3a');

      expect(seatsInput().value).toBe('3');
      expect(host.formValue().seats).toBe(3);
    });
  });

  it('submits valid once both controls have valid values', async () => {
    const input = seatsInput();
    input.value = '2';
    input.dispatchEvent(new Event('input'));
    termsSwitch().click();
    await submit();

    await eventually(() => expect(host.submitted()?.valid).toBe(true));
    expect(host.submitted()?.value).toEqual(
      expect.objectContaining({ seats: 2, acceptTerms: true })
    );
  });
});
