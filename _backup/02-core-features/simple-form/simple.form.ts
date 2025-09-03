import {
  ChangeDetectionStrategy,
  Component,
  isDevMode,
  signal,
  viewChild,
} from '@angular/core';
import { NgxFormDirective, ngxVestForms } from 'ngx-vest-forms/core';
import { DevelopmentPanelComponent } from '../../ui/dev-panel/dev-panel.component';
import { FormFieldComponent } from '../../ui/form-field/form-field.component';
import { IntroCardComponent } from '../../ui/intro-card/intro-card.component';
import { createSimpleFormValidationSuite } from './simple-form.validations';

@Component({
  selector: 'ngx-simple-form',
  imports: [
    ngxVestForms,
    IntroCardComponent,
    FormFieldComponent,
    DevelopmentPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-intro-card
      title="Overview"
      subtitle="Demonstrates a basic form with validation"
    >
      <p class="mb-2 text-sm leading-relaxed">
        Shows the recommended v2 bindings (<code>[ngModel]</code> one-way,
        <code>[(formValue)]</code> sync) and accessible error display.
      </p>
      <ul class="ms-5 list-disc text-sm text-gray-600 dark:text-gray-300">
        <li>One required email field</li>
        <li>Multiple validation messages aggregated</li>
        <li>Submit disabled until valid</li>
      </ul>
    </ngx-intro-card>

    <form
      ngxVestForm
      #vestForm="ngxVestForm"
      [vestSuite]="suite"
      [(formValue)]="formValue"
      (ngSubmit)="save()"
      novalidate
      autocomplete="off"
      class="ngx-form-compact"
    >
      <ngx-form-field
        id="email"
        name="email"
        label="Email Address"
        helper="Please enter a valid email address."
        [required]="true"
        [errors]="vestForm.formState().errors['email'] || null"
      >
        <input
          class="ngx-input"
          id="email"
          name="email"
          type="email"
          [ngModel]="formValue().email"
          required
          autocomplete="email"
          [attr.aria-invalid]="
            (vestForm.formState().errors['email']?.length || 0) > 0
              ? 'true'
              : null
          "
          [attr.aria-describedby]="
            'email-help ' +
            ((vestForm.formState().errors['email']?.length || 0) > 0
              ? 'email-errors'
              : '')
          "
        />
      </ngx-form-field>

      <button
        type="submit"
        class="ngx-btn-primary"
        [disabled]="!vestForm.formState().valid || vestForm.formState().pending"
      >
        {{ vestForm.formState().pending ? 'Validating…' : 'Submit Form' }}
      </button>

      <ngx-dev-panel [state]="vestForm.formState()" />
    </form>
  `,
})
export class SimpleFormComponent {
  /**
   * Signal holding the form value. Used for two-way binding with [(formValue)].
   */
  protected readonly formValue = signal({ email: '' });

  /**
   * Vest validation suite for the form.
   */
  protected readonly suite = createSimpleFormValidationSuite();

  /**
   * Template reference to the vest form directive
   */
  protected readonly vestForm =
    viewChild.required<NgxFormDirective>('vestForm');

  /**
   * Called on form submit. The form directive handles validation and error display.
   */
  save(): void {
    const valid = this.vestForm()?.formState().valid ?? false;

    if (!valid) {
      if (isDevMode()) {
        console.log('Form is invalid, cannot submit');
      }
      return;
    }

    if (isDevMode()) {
      console.log('Form submitted with data:', this.formValue());
    }

    alert('Form submitted successfully!');
  }
}
