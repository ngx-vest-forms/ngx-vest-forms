import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type Signal,
} from '@angular/core';
import type { VestField } from '../vest-form.types';

/**
 * Reusable form error and warning display component with zero-configuration API.
 *
 * ## Features
 *
 * - **Single Input API**: Pass the entire field object from Enhanced Proxy (`form.emailField()`)
 * - **WCAG 2.2 Level AA Compliant**: Automatic ARIA live regions, proper role attributes
 * - **Errors + Warnings**: Displays blocking errors (assertive) and non-blocking warnings (polite)
 * - **CSS Custom Properties**: Fully themeable with `--ngx-vest-forms-*` properties
 * - **Dark Mode Support**: Respects `prefers-color-scheme` with semantic color tokens
 * - **Zero Boilerplate**: Eliminates 15+ lines of repetitive template code per field
 *
 * ## Usage
 *
 * ### Basic Example
 *
 * ```typescript
 * import { Component, signal } from '@angular/core';
 * import { createVestForm } from 'ngx-vest-forms/core';
 * import { NgxFormErrorComponent } from 'ngx-vest-forms/core';
 * import { contactValidations } from './contact.validations';
 *
 * @Component({
 *   selector: 'app-contact-form',
 *   imports: [NgxFormErrorComponent],
 *   template: `
 *     <form (ngSubmit)="save()">
 *       <label for="email">Email *</label>
 *       <input
 *         id="email"
 *         type="email"
 *         [value]="form.email() ?? ''"
 *         (input)="form.setEmail($event)"
 *         (blur)="form.touchEmail()"
 *         [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
 *         [attr.aria-describedby]="form.emailShowErrors() ? 'email-error' : null"
 *       />
 *       <ngx-form-error [field]="form.emailField()" />
 *     </form>
 *   `,
 * })
 * export class ContactFormComponent {
 *   protected readonly form = createVestForm(
 *     contactValidations,
 *     signal({ email: '', message: '' })
 *   );
 *
 *   protected save = async () => {
 *     try {
 *       await this.form.submit();
 *       console.log('Valid:', this.form.model());
 *     } catch (error) {
 *       console.log('Invalid:', this.form.errors());
 *     }
 *   };
 * }
 * ```
 *
 * ### Custom Styling
 *
 * ```css
 * /// Override error colors
 * :root {
 *   --ngx-vest-forms-error-color: #dc2626;
 *   --ngx-vest-forms-warning-color: #f59e0b;
 *   --ngx-vest-forms-error-bg: #fef2f2;
 *   --ngx-vest-forms-warning-bg: #fffbeb;
 * }
 *
 * /// Dark mode
 * @media (prefers-color-scheme: dark) {
 *   :root {
 *     --ngx-vest-forms-error-color: #fca5a5;
 *     --ngx-vest-forms-warning-color: #fcd34d;
 *   }
 * }
 * ```
 *
 * ## Accessibility
 *
 * - **Errors**: Use `role="alert"` with `aria-live="assertive"` for immediate announcement
 * - **Warnings**: Use `role="status"` with `aria-live="polite"` for non-intrusive guidance
 * - **ARIA Atomic**: Set to `true` so entire message is read, not just changes
 * - **IDs**: Auto-generated from field name for `aria-describedby` association
 * - **Focus Management**: Errors appear/disappear without stealing focus
 *
 * @see https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19 - ARIA19: Using ARIA role=alert
 * @see https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22 - ARIA22: Using role=status
 */
@Component({
  selector: 'ngx-form-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Blocking Errors (ARIA role="alert" for assertive announcement) -->
    @if (showErrors() && hasErrors()) {
      <div
        [id]="errorId()"
        class="ngx-form-error__container ngx-form-error__container--error"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        @for (error of errors(); track error) {
          <p class="ngx-form-error__message ngx-form-error__message--error">
            {{ error }}
          </p>
        }
      </div>
    }

    <!-- Non-blocking Warnings (ARIA role="status" for polite announcement) -->
    @if (showWarnings() && hasWarnings()) {
      <div
        [id]="warningId()"
        class="ngx-form-error__container ngx-form-error__container--warning"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @for (warning of warnings(); track warning) {
          <p class="ngx-form-error__message ngx-form-error__message--warning">
            {{ warning }}
          </p>
        }
      </div>
    }
  `,
  styles: `
    /**
     * CSS Custom Properties (Public API)
     *
     * All properties prefixed with --ngx-vest-forms-* to avoid naming conflicts.
     * Uses @property for type-safe CSS variables with fallbacks for browsers
     * that don't support @property (Firefox < 128).
     */

    /* Error Colors */
    @property --ngx-vest-forms-error-color {
      syntax: '<color>';
      inherits: true;
      initial-value: #dc2626;
    }

    @property --ngx-vest-forms-error-bg {
      syntax: '<color>';
      inherits: true;
      initial-value: #fef2f2;
    }

    @property --ngx-vest-forms-error-border {
      syntax: '<color>';
      inherits: true;
      initial-value: #fca5a5;
    }

    /* Warning Colors */
    @property --ngx-vest-forms-warning-color {
      syntax: '<color>';
      inherits: true;
      initial-value: #f59e0b;
    }

    @property --ngx-vest-forms-warning-bg {
      syntax: '<color>';
      inherits: true;
      initial-value: #fffbeb;
    }

    @property --ngx-vest-forms-warning-border {
      syntax: '<color>';
      inherits: true;
      initial-value: #fcd34d;
    }

    /* Spacing */
    @property --ngx-vest-forms-spacing {
      syntax: '<length>';
      inherits: true;
      initial-value: 0.5rem;
    }

    @property --ngx-vest-forms-gap {
      syntax: '<length>';
      inherits: true;
      initial-value: 0.25rem;
    }

    /* Typography */
    @property --ngx-vest-forms-font-size {
      syntax: '<length>';
      inherits: true;
      initial-value: 0.875rem;
    }

    @property --ngx-vest-forms-line-height {
      syntax: '<number>';
      inherits: true;
      initial-value: 1.5;
    }

    /* Border */
    @property --ngx-vest-forms-border-width {
      syntax: '<length>';
      inherits: true;
      initial-value: 1px;
    }

    @property --ngx-vest-forms-border-radius {
      syntax: '<length>';
      inherits: true;
      initial-value: 0.375rem;
    }

    /**
     * Dark Mode Support
     *
     * Respects user's color scheme preference with semantic color adjustments.
     */
    @media (prefers-color-scheme: dark) {
      :host {
        --ngx-vest-forms-error-color: #fca5a5;
        --ngx-vest-forms-error-bg: #7f1d1d;
        --ngx-vest-forms-error-border: #991b1b;

        --ngx-vest-forms-warning-color: #fcd34d;
        --ngx-vest-forms-warning-bg: #78350f;
        --ngx-vest-forms-warning-border: #92400e;
      }
    }

    /**
     * Component Styles
     */

    :host {
      display: block;
      margin-top: var(--ngx-vest-forms-spacing);
    }

    .ngx-form-error__container {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-vest-forms-gap);
      padding: var(--ngx-vest-forms-spacing);
      border-width: var(--ngx-vest-forms-border-width);
      border-style: solid;
      border-radius: var(--ngx-vest-forms-border-radius);
      font-size: var(--ngx-vest-forms-font-size);
      line-height: var(--ngx-vest-forms-line-height);
    }

    .ngx-form-error__container--error {
      color: var(--ngx-vest-forms-error-color);
      background-color: var(--ngx-vest-forms-error-bg);
      border-color: var(--ngx-vest-forms-error-border);
    }

    .ngx-form-error__container--warning {
      color: var(--ngx-vest-forms-warning-color);
      background-color: var(--ngx-vest-forms-warning-bg);
      border-color: var(--ngx-vest-forms-warning-border);
    }

    .ngx-form-error__message {
      margin: 0;
    }

    /**
     * Reduced Motion Support
     *
     * Respects user's motion preferences by disabling animations.
     */
    @media (prefers-reduced-motion: reduce) {
      .ngx-form-error__container {
        transition: none;
      }
    }

    /**
     * High Contrast Mode Support
     *
     * Ensures sufficient contrast in Windows High Contrast Mode.
     */
    @media (prefers-contrast: high) {
      .ngx-form-error__container {
        border-width: 2px;
      }
    }
  `,
})
export class NgxFormErrorComponent {
  /**
   * Field object from Enhanced Proxy API containing all validation state.
   *
   * Pass the field object directly from your form:
   * `[field]="form.emailField()"`
   *
   * This provides:
   * - `validation.errors`: Blocking error messages
   * - `validation.warnings`: Non-blocking warning messages
   * - `showErrors`: Whether to display errors (based on error strategy)
   * - `showWarnings`: Whether to display warnings
   * - `fieldName`: Field path for generating ARIA IDs
   */
  field = input.required<VestField<unknown>>();

  /**
   * Computed signals derived from field object
   */

  /** Blocking error messages that prevent form submission */
  protected readonly errors: Signal<string[]> = computed(
    () => this.field().validation().errors,
  );

  /** Non-blocking warning messages for user guidance */
  protected readonly warnings: Signal<string[]> = computed(
    () => this.field().validation().warnings,
  );

  /** Whether errors should be displayed (respects error strategy) */
  protected readonly showErrors: Signal<boolean> = computed(() =>
    this.field().showErrors(),
  );

  /** Whether warnings should be displayed */
  protected readonly showWarnings: Signal<boolean> = computed(() =>
    this.field().showWarnings(),
  );

  /** Whether the field has any blocking errors */
  protected readonly hasErrors: Signal<boolean> = computed(
    () => this.errors().length > 0,
  );

  /** Whether the field has any non-blocking warnings */
  protected readonly hasWarnings: Signal<boolean> = computed(
    () => this.warnings().length > 0,
  );

  /**
   * Auto-generated ARIA ID for error container.
   * Used in input's aria-describedby attribute.
   */
  protected readonly errorId: Signal<string> = computed(
    () => `${this.field().fieldName}-error`,
  );

  /**
   * Auto-generated ARIA ID for warning container.
   * Used in input's aria-describedby attribute (if warnings are shown).
   */
  protected readonly warningId: Signal<string> = computed(
    () => `${this.field().fieldName}-warning`,
  );
}
