import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { NgxVestForms } from '../exports';
import { provideFormContract } from '../tokens/form-contract.token';
import {
  createFormValidationSuite,
  formContract,
  type FormModel,
  selectors,
} from './simple-form';

@Component({
  imports: [NgxVestForms, JsonPipe],
  providers: [provideFormContract(formContract)],
  template: `
    <form
      class="p-4"
      ngxVestForm
      (ngSubmit)="save()"
      [formValue]="formValue()"
      ngxValidateRootForm
      [suite]="suite"
      (validChange)="formValid.set($event)"
      (errorsChange)="errors.set($event)"
      (formValueChange)="setFormValue($event)"
      [validationOptions]="{ debounceTime: 500 }"
    >
      <fieldset>
        <div
          class="w-full"
          ngxControlWrapper
          data-testid="ngx-control-wrapper__first-name"
        >
          <label>
            <span>First name</span>
            <input
              placeholder="Type your first name"
              data-testid="input__first-name"
              type="text"
              [ngModel]="vm.formValue.firstName"
              name="firstName"
              [validationOptions]="{ debounceTime: 500 }"
            />
          </label>
        </div>
        <div
          class="w-full"
          ngxControlWrapper
          data-testid="ngx-control-wrapper__last-name"
        >
          <label>
            <span>Last name</span>
            <input
              placeholder="Type your last name"
              data-testid="input__last-name"
              type="text"
              [ngModel]="vm.formValue.lastName"
              name="lastName"
            />
          </label>
        </div>
        <div
          class="sm:col-span-2"
          ngxControlWrapper
          data-testid="ngx-control-wrapper__passwords"
          ngModelGroup="passwords"
          [validationOptions]="{ debounceTime: 900 }"
        >
          <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div
              class="w-full"
              ngxControlWrapper
              data-testid="ngx-control-wrapper__password"
            >
              <label>
                <span>Password</span>
                <input
                  placeholder="Type password"
                  type="password"
                  data-testid="input__password"
                  [ngModel]="vm.formValue.passwords?.password"
                  name="password"
                />
              </label>
            </div>
            <div
              class="w-full"
              ngxControlWrapper
              data-testid="ngx-control-wrapper__confirm-password"
            >
              <label>
                <span>Confirm</span>
                <input
                  placeholder="Confirm password"
                  type="password"
                  data-testid="input__confirm-password"
                  [ngModel]="vm.formValue.passwords?.confirmPassword"
                  name="confirmPassword"
                />
              </label>
            </div>
          </div>
        </div>
        <button data-testid="btn__submit" type="submit">Submit</button>
      </fieldset>
      <pre data-testId="pre__form-errors">
        {{ vm.errors | json }}
      </pre>
    </form>
  `,
})
class FormDirectiveDemoComponent {
  protected readonly formValue = signal<FormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string[]>>({});
  protected readonly suite = createFormValidationSuite();
  private readonly viewModel = computed(() => ({
    formValue: this.formValue(),
    errors: this.errors(),
    formValid: this.formValid(),
  }));

  protected get vm() {
    return this.viewModel();
  }

  protected setFormValue(v: FormModel): void {
    this.formValue.set(v);
  }

  protected save(): void {
    // Intentionally left blank: avoid noisy console output in tests
  }
}

describe('simple-form-with-validation-options stories', () => {
  it('shows the first name Error after the control debounce', async () => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });

    const { fixture } = await render(FormDirectiveDemoComponent);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByRole('textbox', { name: 'First name' });
    const wrapper = screen.getByTestId(selectors.ngxControlWrapperFirstName);

    await user.type(input, 'Ada');
    await vi.advanceTimersByTimeAsync(500);

    await user.clear(input);
    await user.tab();
    await vi.advanceTimersByTimeAsync(499);
    fixture.detectChanges();
    expect(wrapper).not.toHaveTextContent('First name is required');

    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(wrapper).toHaveTextContent('First name is required');
  });

  it('shows the password mismatch Error after the group debounce', async () => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });

    const { fixture } = await render(FormDirectiveDemoComponent);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const wrapper = screen.getByTestId(selectors.ngxControlWrapperPasswords);

    await user.type(screen.getByLabelText('Password'), 'first');
    await user.type(screen.getByLabelText('Confirm'), 'second');
    await user.tab();
    await vi.advanceTimersByTimeAsync(899);
    fixture.detectChanges();
    expect(wrapper).not.toHaveTextContent('Passwords do not match');

    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(wrapper).toHaveTextContent('Passwords do not match');
  });

  it('shows the Root Form Error after submit', async () => {
    await render(FormDirectiveDemoComponent);

    await userEvent.type(
      screen.getByTestId(selectors.inputFirstName),
      'Brecht'
    );
    await userEvent.type(
      screen.getByTestId(selectors.inputLastName),
      'Billiet'
    );
    await userEvent.type(screen.getByTestId(selectors.inputPassword), '1234');
    await userEvent.click(screen.getByTestId(selectors.btnSubmit));

    await waitFor(
      () => {
        const errorsText = screen
          .getByTestId(selectors.preFormErrors)
          .textContent?.trim();
        const errors = errorsText ? JSON.parse(errorsText) : {};
        expect(errors.rootForm).toEqual(['Brecht his pass is not 1234']);
      },
      { timeout: 5000 }
    );
  });
});
