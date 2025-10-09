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
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import {
  formFieldShowcaseValidations,
  type FormFieldShowcaseModel,
} from './form-field-showcase.validations';

/**
 * Form Field Showcase - Demonstrates NgxVestFormField Component
 *
 * This example showcases the NgxVestFormField wrapper component which combines:
 * - **Automatic Error Display**: No need to manually add `<ngx-form-error>`
 * - **Consistent Layout**: Standardized spacing via CSS custom properties
 * - **Accessibility**: Proper structure with semantic HTML
 * - **Multiple Field Types**: Works with all form controls
 *
 * 🎯 Key Features Demonstrated:
 * - NgxVestFormField wrapper for cleaner markup
 * - Automatic error display (no manual error components needed)
 * - Various input types (text, email, url, number, textarea, select, checkbox)
 * - Consistent spacing and layout
 * - Error display mode integration
 *
 * 📚 Compare with fundamentals/basic-validation to see the difference:
 * - Basic Validation: Manual error display with `<ngx-form-error>`
 * - Form Field Showcase: Automatic error display via wrapper
 *
 * @example
 * ```html
 * <ngx-form-field-showcase [errorDisplayMode]="on-touch" />
 * ```
 */
@Component({
  selector: 'ngx-form-field-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms, NgxVestFormField],
  templateUrl: './form-field-showcase.html',
})
export class FormFieldShowcase {
  /**
   * Error display mode input - controls when errors are shown
   */
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /**
   * Form model signal with default values
   */
  protected readonly model = signal<FormFieldShowcaseModel>({
    name: '',
    email: '',
    website: '',
    age: 0,
    bio: '',
    country: '',
    agreeToTerms: false,
  });

  /**
   * Create form instance with validation suite and error strategy
   * Exposed as public for debugger access
   *
   * ⚠️ IMPORTANT: Pass the signal itself (this.errorDisplayMode), NOT the value (this.errorDisplayMode())
   * This allows the form to react to error strategy changes automatically.
   */
  readonly form = createVestForm(this.model, {
    suite: formFieldShowcaseValidations,
    errorStrategy: this.errorDisplayMode,
    enhancedFieldSignals: true, // ✅ Enable camelCase field accessors
  });

  /**
   * Form submission handler
   */
  protected async save(): Promise<void> {
    const result = await this.form.submit();

    if (result.valid) {
      console.log('✅ Form is valid! Data:', result.data);
      alert('Form submitted successfully! Check console for data.');
    } else {
      console.log('❌ Form has errors:', result.errors);
      alert('Form has validation errors. Please check the fields.');
    }
  }

  /**
   * Reset form to initial values
   */
  protected resetForm(): void {
    this.form.reset();
  }

  /**
   * Available countries for the select dropdown
   */
  protected readonly countries = [
    { value: '', label: 'Select a country...' },
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'nl', label: 'Netherlands' },
  ];
}
