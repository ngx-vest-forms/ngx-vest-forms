import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { NgxVestForms } from '../exports';
import { type FormModel, formValidationSuite, selectors } from './simple-form';

@Component({
  template: `
    <form
      class="p-4"
      ngxVestForm
      [formValue]="formValue()"
      [validationConfig]="validationConfig"
      [suite]="suite"
      (formValueChange)="setFormValue($event)"
    >
      <div
        class="sm:col-span-2"
        ngxControlWrapper
        data-testid="ngx-control-wrapper__passwords"
        ngModelGroup="passwords"
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
                [ngModel]="formValue().passwords?.password"
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
                [ngModel]="formValue().passwords?.confirmPassword"
                name="confirmPassword"
              />
            </label>
          </div>
        </div>
      </div>
      <button
        data-testid="btn__toggle-validation-config"
        (click)="toggle()"
        type="button"
      >
        Toggle validation config
      </button>
    </form>
  `,
  imports: [NgxVestForms],
})
class ValidationConfigStoryTestComponent {
  protected readonly formValue = signal<FormModel>({});
  protected readonly suite = formValidationSuite;

  protected validationConfig: Record<string, string[]> = {
    'passwords.password': ['passwords.confirmPassword'],
  };

  protected toggle(): void {
    this.validationConfig = this.validationConfig['passwords.password']
      ? {}
      : {
          'passwords.password': ['passwords.confirmPassword'],
        };
  }

  protected setFormValue(value: FormModel): void {
    this.formValue.set(value);
  }
}

describe('simple-form-with-validation-config stories', () => {
  beforeEach(() => {
    formValidationSuite.reset?.();
  });

  it('updates cross-field revalidation when the component swaps validationConfig references', async () => {
    await render(ValidationConfigStoryTestComponent);
    const whenStable = () => TestBed.inject(ApplicationRef).whenStable();

    await whenStable();

    const elements = {
      passwordInput: screen.getByTestId(
        selectors.inputPassword
      ) as HTMLInputElement,
      confirmPasswordInput: screen.getByTestId(
        selectors.inputConfirmPassword
      ) as HTMLInputElement,
      confirmPasswordWrapper: screen.getByTestId(
        selectors.ngxControlWrapperConfirmPassword
      ),
      toggleButton: screen.getByTestId(selectors.btnToggleValidationConfig),
    };

    await userEvent.click(elements.confirmPasswordInput);
    await userEvent.tab();
    await whenStable();

    await userEvent.click(elements.toggleButton);
    await whenStable();
    await userEvent.clear(elements.passwordInput);
    await userEvent.type(elements.passwordInput, 'f');

    // The confirm error is absent before and after, so first wait for the
    // password validation itself to settle (required -> valid).
    await expect
      .poll(() => elements.passwordInput.classList.contains('ng-valid'))
      .toBe(true);
    await whenStable();
    expect(elements.confirmPasswordWrapper).not.toHaveTextContent(
      'Confirm password is required'
    );

    await userEvent.click(elements.toggleButton);
    await whenStable();
    await userEvent.clear(elements.passwordInput);
    await userEvent.type(elements.passwordInput, 'fg');

    await waitFor(() => {
      expect(elements.confirmPasswordWrapper).toHaveTextContent(
        'Confirm password is required'
      );
    });
  });
});
