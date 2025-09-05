import {
  ChangeDetectionStrategy,
  Component,
  computed,
  isDevMode,
  signal,
  viewChild,
} from '@angular/core';
import {
  NgxFormDirective,
  NgxFormErrorDisplayDirective,
  ngxVestForms,
} from 'ngx-vest-forms/core';
import {
  UserFormModel,
  userValidationSuite,
} from './basic-validation.validations';

/**
 * Extracted form component for the Basic Validation example.
 * Demonstrates clean form HTML with semantic classes and manual error handling.
 */
@Component({
  selector: 'ngx-basic-validation-form',
  imports: [ngxVestForms, NgxFormErrorDisplayDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
      (ngSubmit)="onSubmit()"
      class="form-container"
      aria-labelledby="basicValidationHeading"
    >
      <!-- Full Name Field -->
      <div
        class="form-field"
        ngxFormErrorDisplay
        #nameDisplay="formErrorDisplay"
      >
        <label class="form-label" for="name"> Full Name * </label>
        <input
          class="form-input"
          id="name"
          name="name"
          type="text"
          [ngModel]="model().name"
          placeholder="Enter your full name"
          [attr.aria-invalid]="nameDisplay.shouldShowErrors() ? 'true' : null"
          [attr.aria-describedby]="
            'name-hint ' + (nameDisplay.shouldShowErrors() ? 'name-errors' : '')
          "
          autocomplete="name"
        />
        <div class="form-hint" id="name-hint">
          Enter your full name (2-50 characters)
        </div>
        @if (nameDisplay.shouldShowErrors() && nameDisplay.errors().length) {
          <div class="form-error" id="name-errors" role="alert">
            {{ nameDisplay.errors()[0] }}
          </div>
        }
      </div>

      <!-- Email Field -->
      <div
        class="form-field"
        ngxFormErrorDisplay
        #emailDisplay="formErrorDisplay"
      >
        <label class="form-label" for="email"> Email Address * </label>
        <input
          class="form-input"
          id="email"
          name="email"
          type="email"
          [ngModel]="model().email"
          placeholder="you@example.com"
          [attr.aria-invalid]="emailDisplay.shouldShowErrors() ? 'true' : null"
          [attr.aria-describedby]="
            'email-hint ' +
            (emailDisplay.shouldShowErrors() ? 'email-errors' : '')
          "
          autocomplete="email"
        />
        <div class="form-hint" id="email-hint">
          We'll use this to contact you about your application
        </div>
        @if (emailDisplay.shouldShowErrors() && emailDisplay.errors().length) {
          <div class="form-error" id="email-errors" role="alert">
            {{ emailDisplay.errors()[0] }}
          </div>
        }
      </div>

      <!-- Age Field -->
      <div
        class="form-field"
        ngxFormErrorDisplay
        #ageDisplay="formErrorDisplay"
      >
        <label class="form-label" for="age"> Age * </label>
        <input
          class="form-input"
          id="age"
          name="age"
          type="number"
          [ngModel]="model().age"
          placeholder="Your age"
          [attr.aria-invalid]="ageDisplay.shouldShowErrors() ? 'true' : null"
          [attr.aria-describedby]="
            'age-hint ' + (ageDisplay.shouldShowErrors() ? 'age-errors' : '')
          "
        />
        <div class="form-hint" id="age-hint">
          Must be between 18 and 120 years old
        </div>
        @if (ageDisplay.shouldShowErrors() && ageDisplay.errors().length) {
          <div class="form-error" id="age-errors" role="alert">
            {{ ageDisplay.errors()[0] }}
          </div>
        }
      </div>

      <!-- Role Selection Field -->
      <div
        class="form-field"
        ngxFormErrorDisplay
        #roleDisplay="formErrorDisplay"
      >
        <label class="form-label" for="role"> Role * </label>
        <select
          class="form-select"
          id="role"
          name="role"
          [ngModel]="model().role"
          [attr.aria-invalid]="roleDisplay.shouldShowErrors() ? 'true' : null"
          [attr.aria-describedby]="
            'role-hint ' + (roleDisplay.shouldShowErrors() ? 'role-errors' : '')
          "
        >
          <option value="">Select a role</option>
          <option value="Junior Developer">Junior Developer</option>
          <option value="Mid-level Developer">Mid-level Developer</option>
          <option value="Senior Developer">Senior Developer</option>
          <option value="Team Lead">Team Lead</option>
        </select>
        <div class="form-hint" id="role-hint">
          Select the role that best matches your experience level
        </div>
        @if (roleDisplay.shouldShowErrors() && roleDisplay.errors().length) {
          <div class="form-error" id="role-errors" role="alert">
            {{ roleDisplay.errors()[0] }}
          </div>
        }
      </div>

      <!-- Conditional Bio Field (Senior/Lead only) -->
      @if (
        model().role === 'Senior Developer' || model().role === 'Team Lead'
      ) {
        <div
          class="form-field"
          ngxFormErrorDisplay
          #bioDisplay="formErrorDisplay"
        >
          <label class="form-label" for="bio"> Professional Bio * </label>
          <textarea
            class="form-input"
            id="bio"
            name="bio"
            rows="4"
            [ngModel]="model().bio"
            placeholder="Describe your leadership experience and technical expertise"
            [attr.aria-invalid]="bioDisplay.shouldShowErrors() ? 'true' : null"
            [attr.aria-describedby]="
              'bio-hint bio-counter ' +
              (bioDisplay.shouldShowErrors() ? 'bio-errors' : '')
            "
          ></textarea>
          <div class="mt-1 flex items-center justify-between">
            <div class="form-hint" id="bio-hint">
              Describe your leadership experience and technical expertise
            </div>
            <span
              id="bio-counter"
              class="text-xs text-gray-500 dark:text-gray-400"
              [class.text-red-600]="(model().bio?.length || 0) > 500"
              [class.dark:text-red-400]="(model().bio?.length || 0) > 500"
            >
              {{ model().bio?.length || 0 }}/500
            </span>
          </div>
          @if (bioDisplay.shouldShowErrors() && bioDisplay.errors().length) {
            <div class="form-error" id="bio-errors" role="alert">
              {{ bioDisplay.errors()[0] }}
            </div>
          }
        </div>
      }

      <!-- Terms Agreement -->
      <div
        class="form-field"
        ngxFormErrorDisplay
        #termsDisplay="formErrorDisplay"
      >
        <div class="flex items-start gap-3">
          <input
            class="mt-1"
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            [ngModel]="model().agreeToTerms"
            [attr.aria-invalid]="
              termsDisplay.shouldShowErrors() ? 'true' : null
            "
            [attr.aria-describedby]="
              termsDisplay.shouldShowErrors() ? 'terms-errors' : null
            "
          />
          <label class="form-label text-sm" for="agreeToTerms">
            I agree to the
            <a
              href="#"
              class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              terms and conditions
            </a>
            *
          </label>
        </div>
        @if (termsDisplay.shouldShowErrors() && termsDisplay.errors().length) {
          <div class="form-error" id="terms-errors" role="alert">
            {{ termsDisplay.errors()[0] }}
          </div>
        }
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          class="btn-primary"
          type="submit"
          [disabled]="
            !vestForm.formState().valid ||
            vestForm.formState().pending ||
            isSubmitting()
          "
        >
          @if (vestForm.formState().pending) {
            Validating...
          } @else if (isSubmitting()) {
            Submitting...
          } @else {
            Submit Application
          }
        </button>
        <button
          class="btn-secondary"
          type="button"
          (click)="resetForm()"
          [disabled]="isSubmitting()"
        >
          Reset Form
        </button>
      </div>

      <!-- Success Message -->
      @if (showSuccess()) {
        <div
          class="mt-4 rounded-lg border border-green-200 bg-green-50 p-4"
          role="alert"
          aria-live="polite"
        >
          <div class="flex">
            <div class="text-green-400 dark:text-green-300">
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3
                class="text-sm font-medium text-green-800 dark:text-green-200"
              >
                Success!
              </h3>
              <div class="mt-2 text-sm text-green-700 dark:text-green-300">
                Your application has been submitted successfully.
              </div>
            </div>
          </div>
        </div>
      }
    </form>
  `,
})
export class BasicValidationFormComponent {
  protected readonly model = signal<UserFormModel>({
    name: '',
    email: '',
    age: 0,
    role: '',
    bio: '',
    agreeToTerms: false,
  });

  protected readonly suite = userValidationSuite;
  protected readonly isSubmitting = signal(false);
  protected readonly showSuccess = signal(false);
  protected readonly vestFormRef =
    viewChild.required<NgxFormDirective>('vestForm');
  readonly formState = computed(() => this.vestFormRef().formState());

  protected onSubmit(): void {
    const formData = this.model();
    if (isDevMode()) {
      console.group('🚀 Basic Validation Form Submission');
      console.log('📋 Form Data:', formData);
      console.log('✅ Validation State: Valid');
      console.groupEnd();
    }

    this.isSubmitting.set(true);
    setTimeout(() => {
      this.showSuccess.set(true);
      this.isSubmitting.set(false);
      setTimeout(() => this.showSuccess.set(false), 5000);
    }, 1200);

    // Parent can access state via viewChild of this component if needed.
  }

  protected resetForm(): void {
    this.model.set({
      name: '',
      email: '',
      age: 0,
      role: '',
      bio: '',
      agreeToTerms: false,
    });
    this.showSuccess.set(false);
    this.isSubmitting.set(false);
    if (isDevMode()) {
      console.log('🔄 Form reset to initial state');
    }
  }
}
