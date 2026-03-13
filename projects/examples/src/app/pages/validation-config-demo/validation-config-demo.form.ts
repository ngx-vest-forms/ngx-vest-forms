import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxDeepRequired,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { ValidationDemoModel } from '../../models/validation-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';

@Component({
  selector: 'ngx-validation-config-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './validation-config-demo.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationConfigDemoFormBody {
  readonly formValue = input.required<ValidationDemoModel>();
  readonly shape = input.required<NgxDeepRequired<ValidationDemoModel>>();
  readonly suite = input.required<NgxVestSuite<ValidationDemoModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<ValidationDemoModel>>();

  readonly formValueChange = output<ValidationDemoModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<ValidationDemoModel>>('vestForm');
  private readonly formFeedback = createFormFeedbackSignals(this.vestForm);

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = this.formFeedback.formState;

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = this.formFeedback.warnings;

  /** Field paths that have been validated (touched/blurred or submitted). */
  readonly validatedFields = this.formFeedback.validatedFields;

  /** True while async validation is in progress. */
  readonly pending = this.formFeedback.pending;

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: ValidationDemoModel): void {
    this.vestForm()?.resetForm(value);
  }
}
