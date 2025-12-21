import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { componentWrapperDecorator, Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NgxVestForms } from '../exports';
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
      ngxVestForm
      (ngSubmit)="save()"
      [formValue]="formValue()"
      ngxValidateRootForm
      [formShape]="shape"
      [suite]="suite"
      (validChange)="formValid.set($event)"
      (errorsChange)="errors.set($event)"
      (formValueChange)="setFormValue($event)"
      [validationOptions]="{ debounceTime: 500 }"
    >
      <fieldset>
        <div
          class="w-full"
          ngx-control-wrapper
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
          ngx-control-wrapper
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
          ngx-control-wrapper
          data-testid="ngx-control-wrapper__passwords"
          ngModelGroup="passwords"
          [validationOptions]="{ debounceTime: 900 }"
        >
          <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div
              class="w-full"
              ngx-control-wrapper
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
              ngx-control-wrapper
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
      </pre
      >
    </form>
  `,
  imports: [NgxVestForms, JsonPipe],
})
export class FormDirectiveDemoComponent {
  protected readonly formValue = signal<FormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly shape = formShape;
  protected readonly suite = formValidationSuite;
  private readonly viewModel = computed(() => {
    return {
      formValue: this.formValue(),
      errors: this.errors(),
      formValid: this.formValid(),
    };
  });

  protected get vm() {
    return this.viewModel();
  }

  protected setFormValue(v: FormModel): void {
    this.formValue.set(v);
  }

  protected save(): void {
    if (this.formValid()) {
      // Intentionally left blank: avoid noisy console output in Storybook
    }
  }
}

const meta: Meta<FormDirectiveDemoComponent> = {
  title: 'simple form with validation options',
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

export const ShouldShowFirstnameRequiredAfterDelayForNgModel: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(selectors.inputFirstName));
    canvas.getByTestId(selectors.inputFirstName).blur();

    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperFirstName)
    ).not.toHaveTextContent('First name is required');

    await waitFor(
      () =>
        expect(
          canvas.getByTestId(selectors.ngxControlWrapperFirstName)
        ).toHaveTextContent('First name is required'),
      { timeout: 600 }
    );
  },
};

export const ShouldShowPasswordConfirmationAfterDelayForNgModelGroup: StoryObj =
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.type(
        canvas.getByTestId(selectors.inputPassword),
        'first'
      );
      await userEvent.type(
        canvas.getByTestId(selectors.inputConfirmPassword),
        'second',
        { delay: 500 }
      );
      await userEvent.click(canvas.getByTestId(selectors.inputConfirmPassword));
      await canvas.getByTestId(selectors.inputConfirmPassword).blur();

      await expect(
        canvas.getByTestId(selectors.ngxControlWrapperPasswords)
      ).not.toHaveTextContent('Passwords do not match');

      await waitFor(
        () =>
          expect(
            canvas.getByTestId(selectors.ngxControlWrapperPasswords)
          ).toHaveTextContent('Passwords do not match'),
        { timeout: 1100 }
      );
    },
  };

export const ShouldValidateOnRootFormAfterDelay: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByTestId(selectors.inputFirstName),
      'Brecht'
    );
    await userEvent.type(
      canvas.getByTestId(selectors.inputLastName),
      'Billiet'
    );
    await userEvent.type(canvas.getByTestId(selectors.inputPassword), '1234');
    // Submit form to trigger root form validation
    await userEvent.click(canvas.getByTestId(selectors.btnSubmit));
    await waitFor(
      () => {
        const errorsText = canvas
          .getByTestId(selectors.preFormErrors)
          .textContent?.trim();
        const errors = errorsText ? JSON.parse(errorsText) : {};
        expect(errors).toEqual({ rootForm: ['Brecht his pass is not 1234'] });
      },
      { timeout: 2000 }
    );
  },
};
