import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { NgxVestForms } from '../exports';
import { FormModel, formShape, formValidationSuite } from './simple-form';

@Component({
  imports: [NgxVestForms, JsonPipe],
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
