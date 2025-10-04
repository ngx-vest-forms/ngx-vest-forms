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
} from 'ngx-vest-forms/core';
import { asDebuggerForm } from '../../ui/debugger/debugger';
import {
  MinimalFormModel,
  minimalFormValidationSuite,
} from './minimal-form.validations';

/**
 * Modern Minimal Form using Vest.js-first approach with Auto-ARIA
 *
 * Key improvements in V2:
 * - Direct createVestForm() usage instead of directive
 * - Enhanced Field Signals API via Proxy (form.email(), form.emailValid())
 * - Native HTML [value] and (input) bindings
 * - NgxVestForms bundle for automatic ARIA attributes and touch detection
 * - Better TypeScript support and performance
 */
@Component({
  selector: 'ngx-minimal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form
      (submit)="onSubmit($event)"
      class="form-container"
      novalidate
      [attr.aria-busy]="form.pending() || form.submitting() ? 'true' : null"
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
          aria-required="true"
          autocomplete="email"
        />

        <ngx-form-error [field]="form.emailField()" />
      </div>

      <div class="form-actions">
        <button
          class="btn-primary"
          type="submit"
          [disabled]="form.pending() || form.submitting()"
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
  // Input for dynamic error display strategy
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  // Create form with reactive error strategy (library now supports Signal<ErrorDisplayStrategy>)
  protected readonly form = createVestForm(
    minimalFormValidationSuite,
    signal<MinimalFormModel>({ email: '' }),
    {
      errorStrategy: this.errorDisplayMode, // ✅ Pass signal directly - strategy changes reactively!
    },
  );

  // Debugger form for development tools
  protected readonly debugForm = asDebuggerForm(this.form);

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

  /**
   * Debug form accessor for debugger components
   *
   * @returns The form instance typed for the debugger component
   */
  readonly debugFormState = () => this.debugForm;

  // Form submission handler with async support
  async onSubmit(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    try {
      const validData = await this.form.submit();
      console.log('✅ Form submitted successfully:', validData);

      // Here you would typically send to API
      // await this.apiService.createUser(validData);
    } catch (error) {
      console.log('DEBUG: minimal form submit caught error');
      console.error('❌ Form submission failed:', error);
      // Handle validation errors or API errors
    }
  }
}
