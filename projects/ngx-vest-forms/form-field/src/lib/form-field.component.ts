import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type Signal,
} from '@angular/core';
import { NgxFormErrorComponent, type VestField } from 'ngx-vest-forms/core';

/**
 * Control wrapper component that combines form controls with automatic error display.
 *
 * ## Features
 *
 * - **Content Projection**: Wraps label + input together for consistent layout
 * - **Automatic Error Display**: No need to manually add `<ngx-form-error>`
 * - **Layout Consistency**: Standardized spacing via CSS custom properties
 * - **Accessibility**: Proper structure with semantic HTML
 * - **Optional Field**: Works with or without validation (field input is optional)
 * - **Themeable**: CSS custom properties with dark mode support
 *
 * ## Usage
 *
 * ### Basic Example
 *
 * ```typescript
 * import { Component, signal } from '@angular/core';
 * import { createVestForm } from 'ngx-vest-forms/core';
 * import { NgxVestFormField } from 'ngx-vest-forms/form-field';
 * import { contactValidations } from './contact.validations';
 *
 * @Component({
 *   selector: 'app-contact-form',
 *   imports: [NgxVestFormField],
 *   template: `
 *     <form (submit)="save()">
 *       <ngx-vest-form-field [field]="form.emailField()">
 *         <label for="email">Email *</label>
 *         <input
 *           id="email"
 *           type="email"
 *           [value]="form.email() ?? ''"
 *           (input)="form.setEmail($event)"
 *         />
 *       </ngx-vest-form-field>
 *
 *       <ngx-vest-form-field [field]="form.messageField()">
 *         <label for="message">Message</label>
 *         <textarea
 *           id="message"
 *           [value]="form.message() ?? ''"
 *           (input)="form.setMessage($event)"
 *         ></textarea>
 *       </ngx-vest-form-field>
 *
 *       <button type="submit" [disabled]="form.pending()">Submit</button>
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
 *     const result = await this.form.submit();
 *     if (result.valid) {
 *       console.log('Valid:', result.data);
 *     }
 *   };
 * }
 * ```
 *
 * ### Without Validation (Optional Field)
 *
 * ```typescript
 * /// No validation needed - just layout consistency
 * // Use signal-based binding, NOT [(ngModel)]
 * import { signal } from '@angular/core';
 * const name = signal('');
 * <ngx-vest-form-field>
 *   <label for="name">Name</label>
 *   <input id="name" type="text" [value]="name()" (input)="name.set($event)" />
 * </ngx-vest-form-field>
 * ```
 *
 * ### Custom Styling
 *
 * ```css
 * /// Override layout spacing
 * :root {
 *   --ngx-vest-form-field-gap: 0.75rem;
 *   --ngx-vest-form-field-margin: 1.5rem;
 *   --ngx-vest-form-field-content-gap: 0.5rem;
 * }
 *
 * /// Custom label styles
 * ngx-vest-form-field label {
 *   font-weight: 600;
 *   color: var(--label-color);
 * }
 * ```
 *
 * ## Comparison with Manual Approach
 *
 * **Before (Manual):**
 * ```html
 * <div class="form-field">
 *   <label for="email">Email</label>
 *   <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
 *   <ngx-form-error [field]="form.emailField()" />
 * </div>
 * ```
 *
 * **After (With Wrapper):**
 * ```html
 * <ngx-vest-form-field [field]="form.emailField()">
 *   <label for="email">Email</label>
 *   <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
 * </ngx-vest-form-field>
 * ```
 *
 * ## Benefits
 *
 * - ✅ **Less Boilerplate**: No need to manually add error display
 * - ✅ **Consistent Layout**: Same spacing across all form fields
 * - ✅ **Flexible**: Works with any form control (input, select, textarea)
 * - ✅ **Accessible**: Maintains proper label/input associations
 * - ✅ **Optional**: Field input is optional - works without validation
 *
 * @see {@link NgxFormErrorComponent} - Error display component (used internally)
 */
@Component({
  selector: 'ngx-vest-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxFormErrorComponent],
  template: `
    <div class="ngx-vest-form-field">
      <!-- Label + Input + Custom Content (projected by user) -->
      <div class="ngx-vest-form-field__content">
        <ng-content />
      </div>

      <!-- Auto-error display (only if field provided) -->
      @if (field()) {
        <ngx-form-error [field]="field()!" />
      }
    </div>
  `,
  styles: `
    /**
     * CSS Custom Properties (Public API)
     *
     * All properties prefixed with --ngx-vest-form-field-* to avoid naming conflicts.
     */

    /* Spacing */
    @property --ngx-vest-form-field-gap {
      syntax: '<length>';
      inherits: true;
      initial-value: 0.5rem;
    }

    @property --ngx-vest-form-field-margin {
      syntax: '<length>';
      inherits: true;
      initial-value: 1rem;
    }

    @property --ngx-vest-form-field-content-gap {
      syntax: '<length>';
      inherits: true;
      initial-value: 0.25rem;
    }

    /**
     * Component Styles
     */

    :host {
      display: block;
    }

    .ngx-vest-form-field {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-vest-form-field-gap);
      margin-bottom: var(--ngx-vest-form-field-margin);
    }

    .ngx-vest-form-field__content {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-vest-form-field-content-gap);
    }

    /**
     * Reduced Motion Support
     */
    @media (prefers-reduced-motion: reduce) {
      .ngx-vest-form-field {
        transition: none;
      }
    }
  `,
})
export class NgxVestFormField {
  /**
   * Optional field object from Enhanced Proxy API containing validation state.
   *
   * When provided, automatically displays errors/warnings via NgxFormErrorComponent.
   * When omitted, wrapper only provides layout without validation display.
   *
   * Pass the field object directly from your form:
   * `[field]="form.emailField()"`
   *
   * @example With Validation
   * ```html
   * <ngx-vest-form-field [field]="form.emailField()">
   *   <label for="email">Email</label>
   *   <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
   * </ngx-vest-form-field>
   * ```
   *
   * @example Without Validation
   * ```html
   * <!-- Use signal-based binding, NOT [(ngModel)] -->
   * <ngx-vest-form-field>
   *   <label for="name">Name</label>
   *   <input id="name" type="text" [value]="name()" (input)="name.set($event)" />
   * </ngx-vest-form-field>
   * ```
   */
  field = input<VestField<unknown>>();

  /**
   * Computed signal indicating if field has validation configured.
   * Used internally to determine whether to show error component.
   */
  protected readonly hasField: Signal<boolean> = computed(
    () => this.field() !== undefined,
  );
}
