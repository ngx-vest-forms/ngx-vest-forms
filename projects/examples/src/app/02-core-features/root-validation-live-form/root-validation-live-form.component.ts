import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgxFormDirective,
  NgxFormLevelValidationDirective,
  NgxVestSuite,
} from 'ngx-vest-forms/core';
import { createTestValidationSuite } from '../../../../../../projects/ngx-vest-forms/core/src/lib/directives/form-level-validation-test.validations';

@Component({
  standalone: true,
  imports: [FormsModule, NgxFormDirective, NgxFormLevelValidationDirective],
  template: `
    <h2>Cross-field Validation (live mode)</h2>
    <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
      Live mode runs cross-field checks on value changes. Use for lightweight or
      UX-critical rules that should react immediately.
    </p>
    <form
      ngxVestForm
      formLevelValidation
      [formLevelValidationMode]="'live'"
      [formLevelSuite]="suite"
      [(formValue)]="model"
      #form="ngxVestForm"
    >
      <label>
        Password
        <input name="password" [ngModel]="model().password" />
      </label>
      <label>
        Confirm Password
        <input name="confirmPassword" [ngModel]="model().confirmPassword" />
      </label>

      @if (form.formState().root?.errors?.length) {
        <div class="error" role="alert">
          {{ form.formState().root?.errors?.[0] }}
        </div>
      }
    </form>
  `,
})
export class RootValidationLiveFormComponent {
  readonly model = signal({ password: '', confirmPassword: '' });
  readonly suite: NgxVestSuite<Record<string, unknown>> =
    createTestValidationSuite;
}
