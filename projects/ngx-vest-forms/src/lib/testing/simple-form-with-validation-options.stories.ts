import { componentWrapperDecorator, Meta, StoryObj } from '@storybook/angular';
import { Component, computed, signal } from '@angular/core';
import { vestForms } from '../exports';
import { userEvent, within, expect } from 'storybook/test';
import {
  FormModel,
  formShape,
  formValidationSuite,
  selectors,
} from './simple-form';
import { JsonPipe } from '@angular/common';

@Component({
  template: `
    <form
      class="p-4"
      scVestForm
      (ngSubmit)="onSubmit()"
      [formValue]="formValue()"
      [validateRootForm]="true"
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
              [validationOptions]="{ debounceTime: 500 }"
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
          [validationOptions]="{ debounceTime: 900 }"
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
        <button data-testid="btn__submit" type="submit">Submit</button>
      </fieldset>
      <pre data-testId="pre__form-errors">
        {{ vm.errors | json }}
      </pre
      >
    </form>
  `,
  imports: [vestForms, JsonPipe],
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

  protected onSubmit(): void {
    if (this.formValid()) {
      console.log(this.formValue());
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
      canvas.getByTestId(selectors.scControlWrapperFirstName)
    ).not.toHaveTextContent('First name is required');

    setTimeout(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperFirstName)
      ).toHaveTextContent('First name is required');
    }, 550);
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
        canvas.getByTestId(selectors.scControlWrapperPasswords)
      ).not.toHaveTextContent('Passwords do not match');

      setTimeout(() => {
        expect(
          canvas.getByTestId(selectors.scControlWrapperPasswords)
        ).toHaveTextContent('Passwords do not match');
      }, 1000);
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

    await expect(
      JSON.stringify(
        JSON.parse(canvas.getByTestId(selectors.preFormErrors).innerHTML)
      )
    ).toEqual(JSON.stringify({}));

    const expectedErrors = {
      rootForm: ['Brecht his pass is not 1234'],
    };

    setTimeout(() => {
      expect(
        JSON.stringify(
          JSON.parse(canvas.getByTestId(selectors.preFormErrors).innerHTML)
        )
      ).toEqual(JSON.stringify(expectedErrors));
    }, 550);
  },
};
