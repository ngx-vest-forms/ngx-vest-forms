import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { enforce, only, staticSuite, test as vestTest, warn } from 'vest';
import { NgxVestForms } from '../exports';
import { FormControlStateDirective } from './form-control-state.directive';

@Component({
  imports: [FormsModule, FormControlStateDirective],
  template: `
    <div formControlState #state="formControlState">
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
      <div formControlState #state="formControlState">
        <input name="test" [ngModel]="formValue().test" />
        <span id="warning-only">{{ state.warningMessages().join(',') }}</span>
      </div>
    </form>
  `,
})
class WarningOnlyHostComponent {
  readonly formValue = signal<{ test?: string }>({});
  readonly suite = staticSuite(
    (model: { test?: string } = {}, field?: string) => {
      only(field);
      vestTest('test', 'Test warning', () => {
        warn();
        enforce(model.test ?? '').longerThan(3);
      });
    }
  );
}

describe('FormControlStateDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        WarningOnlyHostComponent,
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
    // Simulate user input by dispatching an input event
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
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
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // After validation completes, hasBeenValidated should be true
    expect(hasBeenValidatedEl.textContent).toBe('true');

    // Clear the field - hasBeenValidated should remain true
    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

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
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Should be true after validation runs
    expect(hasBeenValidatedEl.textContent).toBe('true');
  });

  it('should surface warning-only messages from fieldWarnings', async () => {
    const warningFixture = TestBed.createComponent(WarningOnlyHostComponent);
    warningFixture.detectChanges();
    await warningFixture.whenStable();

    const input: HTMLInputElement =
      warningFixture.nativeElement.querySelector('input');

    // Simulate user input
    input.value = 'a';
    input.dispatchEvent(new Event('input'));

    warningFixture.detectChanges();
    await warningFixture.whenStable();

    // Wait for async validation to complete (debounce + processing)
    await new Promise((resolve) => setTimeout(resolve, 200));
    warningFixture.detectChanges();

    const warningText =
      warningFixture.nativeElement.querySelector('#warning-only').textContent;
    expect(warningText).toContain('Test warning');
  });
});
