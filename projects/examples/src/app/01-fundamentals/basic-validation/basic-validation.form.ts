import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import {
  createVestForm,
  NgxVestForms,
  type ErrorDisplayStrategy,
} from 'ngx-vest-forms';
import { asDebuggerForm } from '../../ui/debugger/debugger';
import {
  UserFormModel,
  userValidationSuite,
} from './basic-validation.validations';

/**
 * Modern Basic Validation Form using Vest.js-first approach with Auto-ARIA
 */
@Component({
  selector: 'ngx-basic-validation-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form
      [ngxVestForm]="form"
      (submit)="save($event)"
      class="form-container"
      novalidate
    >
      <!-- Name Field -->
      <div class="form-field">
        <label class="form-label" for="name">Full Name *</label>
        <input
          id="name"
          class="form-input"
          type="text"
          [value]="form.name()"
          (input)="form.setName($event)"
          placeholder="Enter your full name"
          aria-required="true"
        />
        <ngx-form-error [field]="form.nameField()" />
      </div>

      <!-- Email Field -->
      <div class="form-field">
        <label class="form-label" for="email">Email Address *</label>
        <input
          id="email"
          class="form-input"
          type="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
          placeholder="you@example.com"
          aria-required="true"
        />
        <ngx-form-error [field]="form.emailField()" />
      </div>

      <!-- Age Field -->
      <div class="form-field">
        <label class="form-label" for="age">Age *</label>
        <input
          id="age"
          class="form-input"
          type="number"
          [value]="form.age()"
          (input)="form.setAge($event)"
          min="18"
          max="120"
          aria-required="true"
        />
        <ngx-form-error [field]="form.ageField()" />
      </div>

      <!-- Role Field -->
      <div class="form-field">
        <label class="form-label" for="role">Role *</label>
        <select
          id="role"
          class="form-input"
          [value]="form.role()"
          (change)="form.setRole($event)"
          aria-required="true"
        >
          <option value="">Select a role...</option>
          <option value="Junior Developer">Junior Developer</option>
          <option value="Mid-level Developer">Mid-level Developer</option>
          <option value="Senior Developer">Senior Developer</option>
          <option value="Team Lead">Team Lead</option>
        </select>
        <ngx-form-error [field]="form.roleField()" />
      </div>

      <!-- Bio Field (conditional) -->
      @if (form.role() === 'Senior Developer' || form.role() === 'Team Lead') {
        <div class="form-field">
          <label class="form-label" for="bio">Bio *</label>
          <textarea
            id="bio"
            class="form-input"
            rows="4"
            [value]="form.bio() || ''"
            (input)="form.setBio($event)"
            placeholder="Tell us about your experience..."
            aria-required="true"
          ></textarea>
          <ngx-form-error [field]="form.bioField()" />
        </div>
      }

      <!-- Terms Agreement -->
      <div class="form-field">
        <div class="flex items-start">
          <input
            id="agreeToTerms"
            class="form-checkbox"
            type="checkbox"
            [checked]="form.agreeToTerms()"
            (change)="form.setAgreeToTerms($event)"
            aria-required="true"
          />
          <label class="form-checkbox-label" for="agreeToTerms">
            I agree to the terms and conditions *
          </label>
        </div>
        <ngx-form-error [field]="form.agreeToTermsField()" />
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          class="btn-primary"
          type="submit"
          [disabled]="form.pending() || form.submitting()"
        >
          @if (form.submitting()) {
            Submitting...
          } @else {
            Submit Application
          }
        </button>

        <button class="btn-secondary" type="button" (click)="resetForm()">
          Reset Form
        </button>
      </div>

      <!-- Debug Info -->
      <details class="debug-info">
        <summary>Debug Information</summary>
        <div class="debug-content">
          <div><strong>Form Valid:</strong> {{ form.valid() }}</div>
          <div><strong>Form Pending:</strong> {{ form.pending() }}</div>
          <div><strong>Submitting:</strong> {{ form.submitting() }}</div>
        </div>
      </details>
    </form>
  `,
})
export class BasicValidationFormComponent {
  // Input for dynamic error display strategy
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  // Create form with reactive error strategy (library now supports Signal<ErrorDisplayStrategy>)
  protected readonly form = createVestForm(
    userValidationSuite,
    signal<UserFormModel>({
      name: '',
      email: '',
      age: 0,
      role: '',
      bio: '',
      agreeToTerms: false,
    }),
    { errorStrategy: this.errorDisplayMode }, // ✅ Pass signal directly - strategy changes reactively!
  );

  protected readonly debugForm = asDebuggerForm(this.form);

  readonly formState = () => this.form;
  readonly debugFormState = () => this.debugForm;

  async save(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    const result = await this.form.submit();

    if (result.valid) {
      console.log('✅ Form submitted successfully:', result.data);
    } else {
      console.log('❌ Form has validation errors:', result.errors);
    }
  }

  protected resetForm(): void {
    this.form.reset();
    console.log('🔄 Form reset to initial state');
  }
}
