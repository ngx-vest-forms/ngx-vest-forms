import {
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxFieldBlurEvent,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { AutoSaveDemoModel } from '../../models/auto-save-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';

@Component({
  selector: 'ngx-auto-save-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './auto-save-demo.form.html',
})
export class AutoSaveDemoFormBody {
  readonly formValue = input.required<AutoSaveDemoModel>();
  readonly suite = input.required<NgxVestSuite<AutoSaveDemoModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<AutoSaveDemoModel>>();

  readonly formValueChange = output<AutoSaveDemoModel>();
  readonly submitted = output();
  readonly resetRequested = output();
  readonly fieldBlurred = output<NgxFieldBlurEvent<AutoSaveDemoModel>>();

  private readonly vestForm =
    viewChild<FormDirective<AutoSaveDemoModel>>('vestForm');

  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: AutoSaveDemoModel): void {
    this.vestForm()?.resetForm(value);
  }
}
