import { JsonPipe } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  NgxRuntimeSchema,
  SchemaDefinition,
} from 'ngx-vest-forms/schemas';
import { NgxSchemaValidationDirective } from 'ngx-vest-forms/schemas';
import { ngxVestForms } from '../../../exports';
import { NgxVestSuite } from '../../../utils/validation-suite';
import { NgxFormDirective } from '../../form.directive';
import { NgxValidationOptions } from '../../validation-options';
import { testFormValidations } from '../validations/test-form.validations';

type TestFormModel = {
  email: string;
  password: string;
};

@Component({
  imports: [ngxVestForms, FormsModule, JsonPipe, NgxSchemaValidationDirective],
  template: `
    <form
      ngxVestForm
      [vestSuite]="vestSuite()"
      [(formValue)]="formValue"
      [validationOptions]="validationOptions()"
      [validationConfig]="validationConfig()"
      [formSchema]="formSchema()"
      #vestForm="ngxVestForm"
    >
      <label for="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        [ngModel]="formValue().email"
        placeholder="Enter email"
      />

      <label for="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        [ngModel]="formValue().password"
        placeholder="Enter password"
      />

      <button type="submit">Submit</button>

      <!-- Display form state for testing -->
      <div data-testid="form-status">{{ vestForm.formState().status }}</div>
      <div data-testid="form-valid">{{ vestForm.formState().valid }}</div>
      <div data-testid="form-dirty">{{ vestForm.formState().dirty }}</div>
      <div data-testid="form-pending">{{ vestForm.formState().pending }}</div>
      <div data-testid="form-errors">
        {{ vestForm.formState().errors | json }}
      </div>
      <div data-testid="form-field-errors">
        {{ vestForm.formState().errors | json }}
      </div>
      <div data-testid="form-field-warnings">
        {{ vestForm.formState().warnings | json }}
      </div>
    </form>
  `,
})
export class TestFormComponent {
  readonly vestForm = viewChild<NgxFormDirective<TestFormModel>>('vestForm');
  formValue = signal<TestFormModel>({
    email: '',
    password: '',
  });

  validationOptions = signal<NgxValidationOptions>({ debounceTime: 50 }); // Reduced for testing
  validationConfig = signal<Record<string, string[]> | null>(null);

  vestSuite = signal(testFormValidations as NgxVestSuite<TestFormModel>);
  // Optional schema for submit-time validation tests
  // Accept either a standard SchemaDefinition or a runtime schema with safeParse
  formSchema = signal<
    SchemaDefinition | NgxRuntimeSchema<TestFormModel> | null
  >(null);
}
