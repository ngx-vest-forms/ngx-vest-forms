import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createVestForm, NgxVestForms } from 'ngx-vest-forms';
import { asDebuggerForm, Debugger } from '../../ui/debugger/debugger';
import { FormModel } from './example-form-simple.model';
import { validationSuite } from './example-form-simple.validation';

@Component({
  selector: 'ngx-example-form-simple',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Debugger, NgxVestForms],
  templateUrl: './example-form-simple.html',
})
export class ExampleFormSimple {
  protected readonly form = createVestForm(
    validationSuite,
    signal<FormModel>({
      email: '',
      verifyEmail: '',
    }),
  );

  protected readonly debugForm = asDebuggerForm(this.form);

  readonly formState = () => this.form;

  async save() {
    const result = await this.form.submit();

    if (result.valid) {
      console.log('✅ Form validation passed - ready to submit', result.data);
    } else {
      console.error('❌ Form validation failed', result.errors);
    }
  }

  protected resetForm(): void {
    this.form.reset();
  }
}
