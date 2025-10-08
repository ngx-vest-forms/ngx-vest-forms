import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import {
  createVestForm,
  type ErrorDisplayStrategy,
  NgxVestForms,
} from 'ngx-vest-forms';
import { asDebuggerForm } from '../../ui/debugger/debugger';
import { NestedFormModel } from './example-form-nested.model';
import { nestedValidationSuite } from './example-form-nested.validations';

@Component({
  selector: 'ngx-example-form-nested',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  templateUrl: './example-form-nested.html',
})
export class ExampleFormNested {
  // Accept error display mode from parent (with default)
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  protected readonly form = createVestForm(
    signal<NestedFormModel>({
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        age: undefined,
        gender: undefined,
        experienceLevel: 5, // Default to mid-level
      },
      addressInfo: {
        street: '',
        city: '',
        zipCode: '',
        country: '',
      },
      preferences: {
        newsletter: false,
        notifications: false,
      },
    }),
    {
      suite: nestedValidationSuite,
      errorStrategy: this.errorDisplayMode, // ✅ Pass signal directly - strategy changes reactively!
    },
  );

  readonly debugForm = asDebuggerForm(this.form);

  protected async save(): Promise<void> {
    const result = await this.form.submit();

    if (result.valid) {
      console.log('✅ Nested form validation passed - ready to submit', {
        data: result.data,
      });
    } else {
      console.log('❌ Nested form validation failed', {
        errors: result.errors,
      });
    }
  }

  protected resetForm(): void {
    this.form.reset();
  }
}
