import { Component, isDevMode, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxFormCoreDirective } from 'ngx-vest-forms/core';
import { DevelopmentPanelComponent } from '../../ui/dev-panel/dev-panel.component';
import { FormFieldComponent } from '../../ui/form-field/form-field.component';
import { IntroCardComponent } from '../../ui/intro-card/intro-card.component';
import { createRegistrationValidationSuite } from './registration-form.validations';

type RegistrationForm = {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};

@Component({
  selector: 'ngx-registration-form',
  imports: [
    FormsModule,
    NgxFormCoreDirective,
    IntroCardComponent,
    FormFieldComponent,
    DevelopmentPanelComponent,
  ],
  template: `
    <ngx-intro-card
      title="Overview"
      subtitle="Password confirmation & checkbox handling"
    >
      <p class="mb-2 text-sm leading-relaxed">
        Demonstrates cross-field validation for password confirmation and a
        required terms checkbox.
      </p>
      <ul class="ms-5 list-disc text-sm text-gray-600 dark:text-gray-300">
        <li>Separate field + cross-field validations</li>
        <li>Accessible error regions per control</li>
        <li>One-way model binding pattern</li>
      </ul>
    </ngx-intro-card>

    <form
      ngxVestFormCore
      [vestSuite]="suite"
      [(formValue)]="formValue"
      (ngSubmit)="onSubmit()"
      #vestForm="ngxVestFormCore"
      novalidate
      autocomplete="off"
      class="max-w-lg space-y-6"
    >
      <ngx-form-field
        id="email"
        name="email"
        label="Email Address"
        helper="We'll never share your email."
        [errors]="vestForm.formState().errors['email'] || null"
        [required]="true"
      >
        <input
          class="nv-input"
          id="email"
          name="email"
          type="email"
          autocomplete="email"
          [ngModel]="formValue().email"
          required
        />
      </ngx-form-field>

      <ngx-form-field
        id="password"
        name="password"
        label="Password"
        helper="Min 8 chars, uppercase & number"
        [errors]="vestForm.formState().errors['password'] || null"
        [required]="true"
      >
        <input
          class="nv-input"
          id="password"
          name="password"
          type="password"
          autocomplete="new-password"
          [ngModel]="formValue().password"
          required
        />
      </ngx-form-field>

      <ngx-form-field
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm Password"
        [errors]="vestForm.formState().errors['confirmPassword'] || null"
        [required]="true"
      >
        <input
          class="nv-input"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autocomplete="new-password"
          [ngModel]="formValue().confirmPassword"
          required
        />
      </ngx-form-field>

      <ngx-form-field
        id="agreeToTerms"
        name="agreeToTerms"
        label="Terms & Conditions"
        [errors]="vestForm.formState().errors['agreeToTerms'] || null"
      >
        <div class="flex items-start gap-3 py-1">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            class="nv-input"
            [ngModel]="formValue().agreeToTerms"
            aria-describedby="terms-help"
          />
          <div class="text-sm leading-snug" id="terms-help">
            I agree to the
            <a href="#" class="text-[var(--color-accent)] underline">Terms</a>
            and
            <a href="#" class="text-[var(--color-accent)] underline"
              >Privacy Policy</a
            >
          </div>
        </div>
      </ngx-form-field>

      <button
        type="submit"
        class="nv-btn"
        [disabled]="!vestForm.formState().valid"
      >
        Register
      </button>

      <ngx-dev-panel [state]="vestForm.formState()" />
    </form>
  `,
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
