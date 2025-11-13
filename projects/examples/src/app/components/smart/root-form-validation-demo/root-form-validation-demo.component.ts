import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { enforce, only, staticSuite, test } from 'vest';
import { NgxDeepPartial, ROOT_FORM, vestForms } from 'ngx-vest-forms';

/**
 * Model for the password form demonstrating validateRootForm
 */
type PasswordFormModel = NgxDeepPartial<{
  password: string;
  confirmPassword: string;
}>;

/**
 * Validation suite with field-level and root form validations
 */
const passwordValidationSuite = staticSuite(
  (model: PasswordFormModel, field?: string) => {
    only(field); // CRITICAL: Call unconditionally

    // Field-level validations
    test('password', 'Password is required', () => {
      enforce(model.password).isNotBlank();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(model.password).longerThanOrEquals(8);
    });

    test('confirmPassword', 'Confirm password is required', () => {
      enforce(model.confirmPassword).isNotBlank();
    });

    // Root form validation - cross-field rule
    test(ROOT_FORM, 'Passwords must match', () => {
      // Only validate if both fields have values
      if (model.password && model.confirmPassword) {
        enforce(model.confirmPassword).equals(model.password);
      }
    });
  }
);

/**
 * Example component demonstrating validateRootForm directive usage
 *
 * This component shows:
 * 1. How to properly import vestForms (includes ValidateRootFormDirective)
 * 2. How to use validateRootForm in the template
 * 3. How to define ROOT_FORM validations in Vest suite
 * 4. How to display form-level errors
 * 5. Difference between 'submit' and 'live' validation modes
 */
@Component({
  selector: 'app-root-form-validation-demo',
  standalone: true,
  imports: [vestForms, JsonPipe], // ✅ CRITICAL: Import vestForms array
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './root-form-validation-demo.component.html',
  styleUrls: ['./root-form-validation-demo.component.scss'],
})
export class RootFormValidationDemoComponent {
  // Expose ROOT_FORM constant for template
  protected readonly ROOT_FORM = ROOT_FORM;

  // Form state
  protected readonly formValue = signal<PasswordFormModel>({});
  protected readonly errors = signal<Record<string, string[]>>({});
  protected readonly suite = passwordValidationSuite;

  // Validation mode - switch between 'submit' and 'live'
  protected readonly validationMode = signal<'submit' | 'live'>('submit');

  /**
   * Toggle validation mode between 'submit' and 'live'
   */
  protected toggleValidationMode(): void {
    this.validationMode.update((mode) =>
      mode === 'submit' ? 'live' : 'submit'
    );
  }

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    console.log('Form submitted:', this.formValue());
    console.log('Form errors:', this.errors());

    // Check if form has any errors
    if (Object.keys(this.errors()).length === 0) {
      alert('Form is valid! Check console for submitted values.');
    } else {
      alert('Form has validation errors. Please fix them and try again.');
    }
  }
}
