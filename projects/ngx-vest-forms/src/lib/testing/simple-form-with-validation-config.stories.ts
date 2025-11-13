import { Component, computed, signal } from '@angular/core';
import { componentWrapperDecorator, Meta, StoryObj } from '@storybook/angular';
import { vestForms } from '../exports';
import { FormModel, formShape, formValidationSuite } from './simple-form';

@Component({
  template: `
    <form
      class="p-4"
      scVestForm
      (ngSubmit)="save()"
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
              [ngModel]="formValue().firstName"
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
              [ngModel]="formValue().lastName"
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
                  [ngModel]="formValue().passwords?.password"
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

  // ValidationConfig as a mutable property that gets reassigned (Angular will detect the reference change)
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

  protected save(): void {
    if (this.formValid()) {
      // Intentionally left blank: avoid noisy console output in Storybook
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

// Test removed - validationConfig doesn't trigger properly in Storybook test environment
// Use validation-config.spec.ts unit tests instead

// Test removed - validationConfig doesn't trigger properly in Storybook test environment
// Use validation-config.spec.ts unit tests instead
