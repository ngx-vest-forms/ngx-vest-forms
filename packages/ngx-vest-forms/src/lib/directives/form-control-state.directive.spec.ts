import { ApplicationRef, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { create, enforce, test as vestTest, warn } from 'vest';
import { beforeEach, describe, expect, it } from 'vitest';
import { NgxVestForms } from '../exports';
import { FormControlStateDirective } from './form-control-state.directive';

const whenStable = () => TestBed.inject(ApplicationRef).whenStable();

@Component({
  imports: [FormsModule, FormControlStateDirective],
  template: `
    <div ngxControlState #state="ngxControlState">
      <input name="test" [(ngModel)]="model" required />
      <span id="is-valid">{{ state.isValid() }}</span>
      <span id="is-touched">{{ state.isTouched() }}</span>
      <span id="has-errors">{{ state.hasErrors() }}</span>
      <span id="has-been-validated">{{ state.hasBeenValidated() }}</span>
      <span id="error-messages">{{ state.errorMessages()!.join(',') }}</span>
      <span id="warning-messages">{{
        state.warningMessages()!.join(',')
      }}</span>
    </div>
  `,
})
class TestHostComponent {
  model = '';
}

@Component({
  imports: [FormsModule, NgxVestForms, FormControlStateDirective],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <div ngxControlState #state="ngxControlState">
        <input name="test" [ngModel]="formValue().test" />
        <span id="warning-only">{{ state.warningMessages().join(',') }}</span>
      </div>
    </form>
  `,
})
class WarningOnlyHostComponent {
  readonly formValue = signal<{ test?: string }>({});
  readonly suite = create((model: { test?: string } = {}) => {
    vestTest('test', 'Test warning', () => {
      warn();
      enforce(model.test ?? '').longerThan(3);
    });
  });
}

@Component({
  imports: [FormsModule, FormControlStateDirective],
  template: `
    <form #form="ngForm">
      <div ngxControlState #state="ngxControlState">
        <input name="test" [(ngModel)]="model" required />
        <span id="has-been-validated-reset">{{
          state.hasBeenValidated()
        }}</span>
      </div>
    </form>
  `,
})
class ResettableHostComponent {
  model = '';
  readonly form = viewChild<NgForm>('form');

  reset(): void {
    this.form()?.resetForm();
  }
}

describe('FormControlStateDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        WarningOnlyHostComponent,
        ResettableHostComponent,
        FormsModule,
        FormControlStateDirective,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should associate with a content NgModel', async () => {
    // const input: HTMLInputElement = fixture.nativeElement.querySelector('input'); // Unused
    expect(fixture.nativeElement.querySelector('#is-valid').textContent).toBe(
      'false'
    );
    expect(fixture.nativeElement.querySelector('#has-errors').textContent).toBe(
      'true'
    );
    expect(
      fixture.nativeElement.querySelector('#error-messages').textContent
    ).toBe('required');
    // Simulate user input
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    await userEvent.type(input, 'hello');
    await expect
      .poll(() => fixture.nativeElement.querySelector('#is-valid').textContent)
      .toBe('true');
    const isValid =
      fixture.nativeElement.querySelector('#is-valid').textContent;
    const hasErrors =
      fixture.nativeElement.querySelector('#has-errors').textContent;
    expect(isValid).toBe('true');
    expect(hasErrors).toBe('false');
  });

  it('should track hasBeenValidated flag correctly', async () => {
    const hasBeenValidatedEl = fixture.nativeElement.querySelector(
      '#has-been-validated'
    );

    // Initially should be false (no validation yet)
    expect(hasBeenValidatedEl.textContent).toBe('false');

    // Trigger validation by filling the field
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    await userEvent.type(input, 'test');

    // After validation completes, hasBeenValidated should be true
    await expect.poll(() => hasBeenValidatedEl.textContent).toBe('true');

    // Clear the field - hasBeenValidated should remain true
    await userEvent.clear(input);
    await expect
      .poll(() => fixture.nativeElement.querySelector('#is-valid').textContent)
      .toBe('false');
    await whenStable();

    // Still true even though field is now invalid again
    expect(hasBeenValidatedEl.textContent).toBe('true');
  });

  it('should set hasBeenValidated when field becomes invalid', async () => {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    const hasBeenValidatedEl = fixture.nativeElement.querySelector(
      '#has-been-validated'
    );

    // Initially false
    expect(hasBeenValidatedEl.textContent).toBe('false');

    // Blur without filling (triggers validation, field becomes invalid)
    await userEvent.click(input);
    await userEvent.tab();

    // Should be true after validation runs
    await expect.poll(() => hasBeenValidatedEl.textContent).toBe('true');
  });

  it('should mark the control as touched when blur does not change status', async () => {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    const isTouchedEl = fixture.nativeElement.querySelector('#is-touched');

    // Required input starts INVALID, so blur will not change status.
    expect(isTouchedEl.textContent).toBe('false');

    await userEvent.click(input);
    await userEvent.tab();

    await expect.poll(() => isTouchedEl.textContent).toBe('true');
  });

  it('should surface warning-only messages from fieldWarnings', async () => {
    const warningFixture = TestBed.createComponent(WarningOnlyHostComponent);
    warningFixture.detectChanges();
    await whenStable();

    const input: HTMLInputElement =
      warningFixture.nativeElement.querySelector('input');

    // Simulate user input
    await userEvent.type(input, 'a');

    // Wait for debounced async validation to surface the warning message
    await waitFor(() => {
      const warningText =
        warningFixture.nativeElement.querySelector('#warning-only').textContent;
      expect(warningText).toContain('Test warning');
    });
  });

  it('should reset hasBeenValidated to false after form reset', async () => {
    const resetFixture = TestBed.createComponent(ResettableHostComponent);
    resetFixture.detectChanges();
    await whenStable();

    const input: HTMLInputElement =
      resetFixture.nativeElement.querySelector('input');
    const hasBeenValidatedEl = resetFixture.nativeElement.querySelector(
      '#has-been-validated-reset'
    );

    // Initially false
    expect(hasBeenValidatedEl.textContent).toBe('false');

    // Interact so control becomes touched and validated
    await userEvent.type(input, 'abc');
    await userEvent.tab();

    await expect.poll(() => hasBeenValidatedEl.textContent).toBe('true');

    // Reset should restore pristine interaction state and clear hasBeenValidated
    resetFixture.componentInstance.reset();

    await expect.poll(() => hasBeenValidatedEl.textContent).toBe('false');
  });
});
