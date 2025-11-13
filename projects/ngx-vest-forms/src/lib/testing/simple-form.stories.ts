import { JsonPipe } from '@angular/common';
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
  imports: [vestForms, JsonPipe],
  template: `
    <form
      class="p-4"
      ngxVestForm
      (ngSubmit)="save()"
      [formValue]="formValue()"
      ngxValidateRootForm
      [formShape]="shape"
      [suite]="suite"
      (dirtyChange)="formDirty.set($event)"
      (validChange)="formValid.set($event)"
      (errorsChange)="errors.set($event)"
      (formValueChange)="setFormValue($event)"
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
      <pre data-testId="pre__form-value">
        {{ vm.formValue | json }}
      </pre
      >
      <pre data-testId="pre__form-errors">
        {{ vm.errors | json }}
      </pre
      >
      <pre data-testId="pre__form-valid">{{ vm.formValid }}</pre>
      <pre data-testId="pre__form-dirty">{{ vm.formDirty }}</pre>
    </form>
  `,
})
export class FormDirectiveDemoComponent {
  protected readonly formValue = signal<FormModel>({});
  protected readonly formValid = signal<boolean | null>(null);
  protected readonly formDirty = signal<boolean | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly shape = formShape;
  protected readonly suite = formValidationSuite;
  private readonly viewModel = computed(() => {
    return {
      formValue: this.formValue(),
      errors: this.errors(),
      formValid: this.formValid(),
      formDirty: this.formDirty(),
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
  title: 'simple form',
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

export const ShouldShowErrorsOnSubmit: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(selectors.btnSubmit));
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperFirstName)
    ).toHaveTextContent('First name is required');
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperLastName)
    ).toHaveTextContent('Last name is required');
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperPassword)
    ).toHaveTextContent('Password is required');
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperConfirmPassword)
    ).not.toHaveTextContent('Confirm password is required');
  },
};

export const ShouldHideErrorsWhenValid: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(selectors.btnSubmit));

    await userEvent.type(canvas.getByTestId(selectors.inputFirstName), 'first');
    await userEvent.type(canvas.getByTestId(selectors.inputLastName), 'last');
    await userEvent.type(canvas.getByTestId(selectors.inputPassword), 'pass');
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperFirstName)
    ).not.toHaveTextContent('First name is required');
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperLastName)
    ).not.toHaveTextContent('Last name is required');
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperPassword)
    ).not.toHaveTextContent('Password is required');
  },
};
export const ShouldShowErrorsOnBlur: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(selectors.inputFirstName));
    canvas.getByTestId(selectors.inputFirstName).blur();
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperFirstName)
    ).toHaveTextContent('First name is required');

    await userEvent.click(canvas.getByTestId(selectors.inputLastName));
    canvas.getByTestId(selectors.inputLastName).blur();
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperLastName)
    ).toHaveTextContent('Last name is required');

    await userEvent.click(canvas.getByTestId(selectors.inputPassword));
    canvas.getByTestId(selectors.inputPassword).blur();
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperPassword)
    ).toHaveTextContent('Password is required');
  },
};

export const ShouldValidateOnGroups: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByTestId(selectors.inputPassword), 'first');
    await userEvent.type(
      canvas.getByTestId(selectors.inputConfirmPassword),
      'second'
    );
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperPasswords)
    ).toHaveTextContent('Passwords do not match');
    await expect(
      canvas.getByTestId(selectors.ngxControlWrapperPasswords)
    ).toHaveClass('ngx-control-wrapper--invalid');
  },
};

export const ShouldHaveCorrectStatussesAndFormValueInitially: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId(selectors.preFormValid)).toHaveTextContent(
        'false'
      );
      expect(canvas.getByTestId(selectors.preFormDirty)).toHaveTextContent(
        'false'
      );
      const expectedContent = {
        passwords: {
          password: null,
          confirmPassword: null,
        },
      };
      expect(
        JSON.stringify(
          JSON.parse(canvas.getByTestId(selectors.preFormValue).innerHTML)
        )
      ).toEqual(JSON.stringify(expectedContent));
      const expectedErrors = {
        firstName: ['First name is required'],
        lastName: ['Last name is required'],
        'passwords.password': ['Password is required'],
      };
      expect(
        JSON.stringify(
          JSON.parse(canvas.getByTestId(selectors.preFormErrors).innerHTML)
        )
      ).toEqual(JSON.stringify(expectedErrors));
    });
  },
};

export const ShouldHaveCorrectStatussesAndOnFormUpdate: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByTestId(selectors.inputFirstName), 'f');
    await waitFor(() => {
      expect(canvas.getByTestId(selectors.preFormValid)).toHaveTextContent(
        'false'
      );
      expect(canvas.getByTestId(selectors.preFormDirty)).toHaveTextContent(
        'true'
      );
      const expectedContent = {
        firstName: 'f',
        passwords: {
          password: null,
          confirmPassword: null,
        },
      };
      expect(
        JSON.stringify(
          JSON.parse(canvas.getByTestId(selectors.preFormValue).innerHTML)
        )
      ).toEqual(JSON.stringify(expectedContent));
      const expectedErrors = {
        lastName: ['Last name is required'],
        'passwords.password': ['Password is required'],
      };
      expect(
        JSON.stringify(
          JSON.parse(canvas.getByTestId(selectors.preFormErrors).innerHTML)
        )
      ).toEqual(JSON.stringify(expectedErrors));
    });
    await userEvent.type(canvas.getByTestId(selectors.inputLastName), 'l');
    await userEvent.type(canvas.getByTestId(selectors.inputPassword), 'p');
    await userEvent.type(
      canvas.getByTestId(selectors.inputConfirmPassword),
      'p'
    );
    await waitFor(() => {
      expect(canvas.getByTestId(selectors.preFormValid)).toHaveTextContent(
        'true'
      );
      expect(canvas.getByTestId(selectors.preFormDirty)).toHaveTextContent(
        'true'
      );
      const expectedContent = {
        firstName: 'f',
        lastName: 'l',
        passwords: {
          password: 'p',
          confirmPassword: 'p',
        },
      };
      expect(
        JSON.stringify(
          JSON.parse(canvas.getByTestId(selectors.preFormValue).innerHTML)
        )
      ).toEqual(JSON.stringify(expectedContent));
      expect(
        JSON.stringify(
          JSON.parse(canvas.getByTestId(selectors.preFormErrors).innerHTML)
        )
      ).toEqual(JSON.stringify({}));
    });
  },
};

export const ShouldValidateOnRootForm: StoryObj = {
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
