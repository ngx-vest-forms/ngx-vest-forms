import { Component, isDevMode, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgxFormCoreDirective,
  NgxFormModelDirective,
} from 'ngx-vest-forms/core';
import { createRegistrationValidationSuite } from './registration-form.validations';

type RegistrationForm = {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};

@Component({
  selector: 'ngx-registration-form',
  imports: [FormsModule, NgxFormCoreDirective, NgxFormModelDirective],
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss',
})
export class RegistrationFormComponent {
  /**
   * Signal holding the form value. Used for two-way binding with [(formValue)].
   */
  protected readonly formValue = signal<RegistrationForm>({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  /**
   * Vest validation suite for the registration form.
   * Includes cross-field validation for password confirmation.
   */
  protected readonly suite = createRegistrationValidationSuite();

  /**
   * Called on form submit. Shows different behavior for valid vs invalid forms.
   */
  protected onSubmit(): void {
    const formData = this.formValue();
    if (
      formData.agreeToTerms &&
      formData.password === formData.confirmPassword
    ) {
      alert(`Registration successful! Welcome ${formData.email}`);
      if (isDevMode()) {
        console.log('Registration data:', formData);
      }
    }
  }
}
