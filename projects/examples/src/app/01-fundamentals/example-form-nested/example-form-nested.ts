import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { Debugger, asDebuggerForm } from '../../ui/debugger/debugger';
import { NestedFormModel } from './example-form-nested.model';
import { nestedValidationSuite } from './example-form-nested.validations';

@Component({
  selector: 'ngx-example-form-nested',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Debugger],
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
  );

  protected readonly debugForm = asDebuggerForm(this.form);

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
