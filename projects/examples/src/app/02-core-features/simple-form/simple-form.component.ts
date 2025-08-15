import { Component, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgxFormCoreDirective,
  NgxFormModelDirective,
} from 'ngx-vest-forms/core';
import { createSimpleFormValidationSuite } from './simple-form.validations';

@Component({
  selector: 'ngx-simple-form',
  standalone: true,
  imports: [FormsModule, NgxFormCoreDirective, NgxFormModelDirective],
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
  protected readonly vestForm =
    viewChild.required<NgxFormCoreDirective>('vestForm');

  save(): void {
    const valid = this.vestForm()?.formState().valid ?? false;
    if (!valid) return;
    alert('Form submitted!');
  }
}
