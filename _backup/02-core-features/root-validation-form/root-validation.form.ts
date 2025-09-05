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
    <h2>Root Validation (submit mode)</h2>
    <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
      Submit mode runs cross-field checks only after the first submit. Use this
      for expensive or form-wide rules. For interactive checks, see the Live
      Mode example.
    </p>
    <form
      ngxVestForm
      formLevelValidation
      [formLevelSuite]="suite"
      [(formValue)]="model"
      #form="ngxVestForm"
      (ngSubmit)="onSubmit()"
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

      <button type="submit">Submit</button>
    </form>
  `,
})
export class RootValidationFormComponent {
  readonly model = signal({ password: '', confirmPassword: '' });
  readonly suite: NgxVestSuite<Record<string, unknown>> =
    createTestValidationSuite;

  onSubmit() {
    // no-op
  }
}
