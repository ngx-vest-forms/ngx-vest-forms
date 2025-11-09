import { Component, computed, signal } from '@angular/core';
import { componentWrapperDecorator, Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { vestForms } from '../exports';
import {
  FormModel,
  formShape,
  formValidationSuite,
  selectors,
} from './simple-form';

@Component({
  template: `
    <form
      class="p-4"
      scVestForm
      (ngSubmit)="onSubmit()"
      [formValue]="formValue()"
      validateRootForm
      [formShape]="shape"
      [validationConfig]="validationConfig"
      [suite]="suite"
      (validChange)="formValid.set($event)"
      (errorsChange)="errors.set($event)"
      (formValueChange)="setFormValue($event)"
    >
      <fieldset>
        <div
          class="w-full"
          sc-control-wrapper
          data-testid="sc-control-wrapper__first-name"
        >
          <label>
            <span>First name</span>
            <input
              placeholder="Type your first name"
              data-testid="input__first-name"
              type="text"
              [ngModel]="vm.formValue.firstName"
              name="firstName"
            />
          </label>
        </div>
        <div
          class="w-full"
          sc-control-wrapper
          data-testid="sc-control-wrapper__last-name"
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
          sc-control-wrapper
          data-testid="sc-control-wrapper__passwords"
          ngModelGroup="passwords"
        >
          <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div
              class="w-full"
              sc-control-wrapper
              data-testid="sc-control-wrapper__password"
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
              sc-control-wrapper
              data-testid="sc-control-wrapper__confirm-password"
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
        <button
          data-testid="btn__toggle-validation-config"
          (click)="toggle()"
          type="button"
        >
          Toggle validation config
        </button>
        <button data-testid="btn__submit" type="submit">Submit</button>
      </fieldset>
    </form>
  `,
  imports: [vestForms],
})
export class FormDirectiveDemoComponent {
  protected readonly formValue = signal<FormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly shape = formShape;
  protected readonly suite = formValidationSuite;
  protected validationConfig: any = {
    firstName: ['lastName'],
    'passwords.password': ['passwords.confirmPassword'],
  };
  private readonly viewModel = computed(() => {
    return {
      formValue: this.formValue(),
      errors: this.errors(),
      formValid: this.formValid(),
    };
  });

  protected toggle(): void {
    if (this.validationConfig['passwords.password']) {
      this.validationConfig = { firstName: ['lastName'] };
    } else {
      this.validationConfig = {
        firstName: ['lastName'],
        'passwords.password': ['passwords.confirmPassword'],
      };
    }
  }

  protected get vm() {
    return this.viewModel();
  }

  protected setFormValue(v: FormModel): void {
    this.formValue.set(v);
  }

  protected onSubmit(): void {
    if (this.formValid()) {
      console.log(this.formValue());
    }
  }
}

const meta: Meta<FormDirectiveDemoComponent> = {
  title: 'simple form with validation config',
  component: FormDirectiveDemoComponent,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
};

export default meta;
export const Primary: StoryObj = {
  decorators: [componentWrapperDecorator(FormDirectiveDemoComponent)],
};

export const ShouldRetriggerByValidationConfig: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(selectors.btnSubmit));
    await expect(
      canvas.getByTestId(selectors.scControlWrapperFirstName)
    ).toHaveTextContent('First name is required');
    await expect(
      canvas.getByTestId(selectors.scControlWrapperLastName)
    ).toHaveTextContent('Last name is required');
    await expect(
      canvas.getByTestId(selectors.scControlWrapperPassword)
    ).toHaveTextContent('Password is required');
    await expect(
      canvas.getByTestId(selectors.scControlWrapperConfirmPassword)
    ).not.toHaveTextContent('Confirm password is required');
    await userEvent.click(canvas.getByTestId(selectors.inputConfirmPassword));
    await canvas.getByTestId(selectors.inputConfirmPassword).blur();
    await userEvent.type(canvas.getByTestId(selectors.inputPassword), 'f');

    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperConfirmPassword)
      ).toHaveTextContent('Confirm password is required');
    });
    await userEvent.clear(canvas.getByTestId(selectors.inputPassword));
    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperConfirmPassword)
      ).not.toHaveTextContent('Confirm password is required');
    });
  },
};

export const ShouldReactToDynamicValidationConfig: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(selectors.btnSubmit));
    await expect(
      canvas.getByTestId(selectors.scControlWrapperFirstName)
    ).toHaveTextContent('First name is required');
    await expect(
      canvas.getByTestId(selectors.scControlWrapperLastName)
    ).toHaveTextContent('Last name is required');
    await expect(
      canvas.getByTestId(selectors.scControlWrapperPassword)
    ).toHaveTextContent('Password is required');
    await expect(
      canvas.getByTestId(selectors.scControlWrapperConfirmPassword)
    ).not.toHaveTextContent('Confirm password is required');
    await userEvent.click(canvas.getByTestId(selectors.inputConfirmPassword));
    await canvas.getByTestId(selectors.inputConfirmPassword).blur();
    await userEvent.type(canvas.getByTestId(selectors.inputPassword), 'f');

    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperConfirmPassword)
      ).toHaveTextContent('Confirm password is required');
    });
    await userEvent.clear(canvas.getByTestId(selectors.inputPassword));
    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperConfirmPassword)
      ).not.toHaveTextContent('Confirm password is required');
    });
    await userEvent.click(
      canvas.getByTestId(selectors.btnToggleValidationConfig)
    );
    await userEvent.type(canvas.getByTestId(selectors.inputPassword), 'f');
    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperConfirmPassword)
      ).not.toHaveTextContent('Confirm password is required');
    });
    await userEvent.clear(canvas.getByTestId(selectors.inputPassword));
    await userEvent.click(
      canvas.getByTestId(selectors.btnToggleValidationConfig)
    );
    await userEvent.type(canvas.getByTestId(selectors.inputPassword), 'f');
    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperConfirmPassword)
      ).toHaveTextContent('Confirm password is required');
    });
  },
};
