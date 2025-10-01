import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { asDebuggerForm } from '../../ui/debugger/debugger';
import { NestedFormModel } from './example-form-nested.model';
import { nestedValidationSuite } from './example-form-nested.validations';

@Component({
  selector: 'ngx-example-form-nested',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './example-form-nested.html',
})
export class ExampleFormNested {
  protected readonly form = createVestForm(
    nestedValidationSuite,
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
      errorStrategy: 'immediate', // Show all validation errors immediately for demo purposes
    },
  );

  readonly debugForm = asDebuggerForm(this.form);

  protected async onSubmit(): Promise<void> {
    try {
      const result = await this.form.submit();
      console.log('✅ Nested form validation passed - ready to submit', {
        result,
      });
    } catch (error) {
      console.log('❌ Nested form validation failed', {
        errors: this.form.errors(),
        error,
      });
    }
  }

  protected resetForm(): void {
    this.form.reset();
  }
}
