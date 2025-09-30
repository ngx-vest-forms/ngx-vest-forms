import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { asDebuggerForm } from '../../ui/debugger/debugger';
import {
  UserFormModel,
  userValidationSuite,
} from './basic-validation.validations';

/**
 * Modern Basic Validation Form using Vest.js-first approach
 */
@Component({
  selector: 'ngx-basic-validation-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (ngSubmit)="onSubmit()" class="form-container">
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
        />
        @if (form.nameShowErrors() && form.nameErrors().length) {
          <div class="form-error" role="alert">
            {{ form.nameErrors()[0] }}
          </div>
        }
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
        />
        @if (form.emailShowErrors() && form.emailErrors().length) {
          <div class="form-error" role="alert">
            {{ form.emailErrors()[0] }}
          </div>
        }
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
        />
        @if (form.ageShowErrors() && form.ageErrors().length) {
          <div class="form-error" role="alert">
            {{ form.ageErrors()[0] }}
          </div>
        }
      </div>

      <!-- Role Field -->
      <div class="form-field">
        <label class="form-label" for="role">Role *</label>
        <select
          id="role"
          class="form-input"
          [value]="form.role()"
          (change)="form.setRole($event)"
        >
          <option value="">Select a role...</option>
          <option value="Junior Developer">Junior Developer</option>
          <option value="Mid-level Developer">Mid-level Developer</option>
          <option value="Senior Developer">Senior Developer</option>
          <option value="Team Lead">Team Lead</option>
        </select>
        @if (form.roleShowErrors() && form.roleErrors().length) {
          <div class="form-error" role="alert">
            {{ form.roleErrors()[0] }}
          </div>
        }
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
          ></textarea>
          @if (form.bioShowErrors() && form.bioErrors().length) {
            <div class="form-error" role="alert">
              {{ form.bioErrors()[0] }}
            </div>
          }
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
          />
          <label class="form-checkbox-label" for="agreeToTerms">
            I agree to the terms and conditions *
          </label>
        </div>
        @if (
          form.agreeToTermsShowErrors() && form.agreeToTermsErrors().length
        ) {
          <div class="form-error" role="alert">
            {{ form.agreeToTermsErrors()[0] }}
          </div>
        }
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          class="btn-primary"
          type="submit"
          [disabled]="!form.valid() || form.submitting()"
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
  );

  protected readonly debugForm = asDebuggerForm(this.form);

  readonly formState = () => this.form;
  readonly debugFormState = () => this.debugForm;

  async onSubmit() {
    try {
      const validData = await this.form.submit();
      console.log('✅ Form submitted successfully:', validData);
    } catch (error) {
      console.error('❌ Form submission failed:', error);
    }
  }

  protected resetForm(): void {
    this.form.reset();
    console.log('🔄 Form reset to initial state');
  }
}
