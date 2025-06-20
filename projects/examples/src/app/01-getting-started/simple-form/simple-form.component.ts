import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { createSimpleFormValidationSuite } from './simple-form.validations';

@Component({
  selector: 'ngx-simple-form',
  standalone: true,
  imports: [ngxVestForms],
  templateUrl: './simple-form.component.html',
  styleUrl: './simple-form.component.scss',
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
   * Called on form submit. The form directive handles validation and error display.
   */
  save(): void {
    alert('Form submitted!');
  }
}
