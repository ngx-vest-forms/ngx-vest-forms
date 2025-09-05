import { JsonPipe } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ngxVestForms } from '../../../exports';
import { NgxFormDirective } from '../../form.directive';
import { NgxValidationOptions } from '../../validation-options';
import { asyncValidationSuite } from '../validations/async-validation.validations';

@Component({
  imports: [ngxVestForms, FormsModule, JsonPipe],
  template: `
    <form
      ngxVestForm
      [vestSuite]="asyncVestSuite"
      [(formValue)]="formValue"
      [validationOptions]="validationOptions"
      #vestForm="ngxVestForm"
    >
      <label for="username">Username</label>
      <input
        id="username"
        name="username"
        [ngModel]="formValue().username"
        placeholder="Enter username"
      />

      <div data-testid="form-pending">{{ vestForm.formState().pending }}</div>
      <div data-testid="form-status">{{ vestForm.formState().status }}</div>
      <div data-testid="form-errors">
        {{ vestForm.formState().errors | json }}
      </div>
    </form>
  `,
})
export class AsyncValidationComponent {
  readonly vestForm = viewChild<NgxFormDirective>('vestForm');

  formValue = signal({ username: '' });
  validationOptions: NgxValidationOptions = { debounceTime: 100 }; // Realistic debounce for testing

  // Use the extracted async validation suite
  asyncVestSuite = asyncValidationSuite;
}
