import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import {
  MinimalFormModel,
  minimalFormValidationSuite,
} from './minimal-form.validations';

/**
 * Modern Minimal Form using Vest.js-first approach
 *
 * Key improvements in V2:
 * - Direct createVestForm() usage instead of directive
 * - Enhanced Field Signals API via Proxy (form.email(), form.emailValid())
 * - Native HTML [value] and (input) bindings
 * - No directive dependencies - pure Vest.js + Angular signals
 * - Better TypeScript support and performance
 */
@Component({
  selector: 'ngx-minimal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      (ngSubmit)="onSubmit()"
      class="form-container"
      [attr.aria-busy]="form.pending()"
    >
      <div class="form-field">
        <label class="form-label" for="email"> Email Address </label>

        <input
          id="email"
          class="form-input"
          type="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
          placeholder="you@example.com"
          [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
          [attr.aria-describedby]="
            form.emailShowErrors() ? 'email-error' : null
          "
          autocomplete="email"
        />

        @if (form.emailShowErrors() && form.emailErrors().length) {
          <div class="form-error" id="email-error" role="alert">
            {{ form.emailErrors()[0] }}
          </div>
        }
      </div>

      <div class="form-actions">
        <button
          class="btn-primary"
          type="submit"
          [disabled]="!form.valid() || form.pending() || form.submitting()"
        >
          @if (form.submitting()) {
            Submitting...
          } @else {
            Submit
          }
        </button>
      </div>
    </form>
  `,
})
export class MinimalForm {
  // Create form instance using new Vest.js-first approach
  protected readonly form = createVestForm(
    minimalFormValidationSuite,
    signal<MinimalFormModel>({ email: '' }),
  );

  /**
   * Reactive form state accessor for parent components
   *
   * Provides direct access to the enhanced form instance with all
   * validation state and field operations available via Enhanced Field Signals API.
   *
   * @example
   * ```typescript
   * // In parent component template:
   * <ngx-minimal-form #form />
   * <div>Form is valid: {{ form.formState().valid() }}</div>
   * <div>Email value: {{ form.formState().email() }}</div>
   *
   * // In parent component class:
   * formComponent = viewChild.required<MinimalForm>('form');
   * isFormReady = computed(() =>
   *   this.formComponent().formState().valid() &&
   *   !this.formComponent().formState().pending()
   * );
   * ```
   *
   * @returns The enhanced form instance with all validation and field APIs
   */
  readonly formState = () => this.form;

  // Form submission handler with async support
  async onSubmit() {
    try {
      const validData = await this.form.submit();
      console.log('✅ Form submitted successfully:', validData);

      // Here you would typically send to API
      // await this.apiService.createUser(validData);
    } catch (error) {
      console.error('❌ Form submission failed:', error);
      // Handle validation errors or API errors
    }
  }
}
