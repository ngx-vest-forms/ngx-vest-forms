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
  MinimalFormModel,
  minimalFormValidationSuite,
} from './minimal-form.validations';

/**
 * Modern Minimal Form using Vest.js-first approach
 *
 * Key improvements in V2:
 * - Direct createVestForm() usage
 * - Enhanced Field Signals API via Proxy (form.email(), form.emailValid())
 * - Native HTML [value] and (input) bindings
 * - NgxVestForms bundle for automatic ARIA and touch detection
 * - [ngxVestForm] directive for all auto-enhancements
 * - Better TypeScript support and performance
 */
@Component({
  selector: 'ngx-minimal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form
      [ngxVestForm]="form"
      (submit)="save($event)"
      class="form-container"
      novalidate
    >
      <!-- Unsaved Changes Indicator (v2.0 dirty() API) -->
      @if (form.dirty()) {
        <div
          class="mb-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 dark:border-amber-400 dark:bg-amber-900/20"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-center gap-2">
            <span class="text-amber-600 dark:text-amber-400">⚠️</span>
            <span
              class="text-sm font-medium text-amber-800 dark:text-amber-300"
            >
              Unsaved changes
            </span>
          </div>
        </div>
      }

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
    signal<MinimalFormModel>({ email: '' }),
    {
      suite: minimalFormValidationSuite,
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
   * /// In parent component template:
   * <ngx-minimal-form #form />
   * <div>Form is valid: {{ form.formState().valid() }}</div>
   * <div>Email value: {{ form.formState().email() }}</div>
   *
   * /// In parent component class:
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
  async save(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    // V2: submit() returns SubmitResult instead of throwing
    const result = await this.form.submit();

    if (result.valid) {
      console.log('✅ Form submitted successfully:', result.data);
      // Here you would typically send to API
      // await this.apiService.createUser(result.data);
    } else {
      console.log('❌ Form validation failed:', result.errors);
      // Errors are already displayed via NgxFormErrorComponent
    }
  }
}
