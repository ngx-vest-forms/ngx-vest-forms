import { Component, input, output, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  type NgxSubmitSettledEvent,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  validationDemoContract,
  ValidationDemoModel,
} from '../../models/validation-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';

@Component({
  selector: 'ngx-validation-config-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './validation-config-demo.form.html',
  providers: [provideFormContract(validationDemoContract)],
})
export class ValidationConfigDemoFormBody {
  readonly formValue = input.required<ValidationDemoModel>();
  readonly suite = input.required<NgxVestSuite<ValidationDemoModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<ValidationDemoModel>>();

  readonly formValueChange = output<ValidationDemoModel>();
  readonly submitted = output<NgxSubmitSettledEvent<ValidationDemoModel>>();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<ValidationDemoModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onSubmitSettled(
    event: NgxSubmitSettledEvent<ValidationDemoModel>
  ): void {
    this.submitted.emit(event);
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: ValidationDemoModel): void {
    this.vestForm()?.resetForm(value);
  }
}
