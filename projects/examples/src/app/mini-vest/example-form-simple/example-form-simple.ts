import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { Debugger, asDebuggerForm } from '../../ui/debugger/debugger';
import { FormModel } from './example-form-simple.model';
import { validationSuite } from './example-form.-simplevalidation';

@Component({
  selector: 'ngx-example-form-simple',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Debugger],
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

  async onSubmit() {
    try {
      const result = await this.form.submit();
      console.log('✅ Form validation passed - ready to submit', result);
    } catch (error) {
      console.error('❌ Form validation failed', error);
    }
  }

  protected resetForm(): void {
    this.form.reset();
  }
}
