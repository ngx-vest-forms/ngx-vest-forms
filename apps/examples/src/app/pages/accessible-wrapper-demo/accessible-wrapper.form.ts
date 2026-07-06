import { Component, input, output, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  FormErrorControlDirective,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  accessibleWrapperContract,
  AccessibleWrapperModel,
} from '../../models/accessible-wrapper.model';

@Component({
  selector: 'ngx-accessible-wrapper-form-body',
  imports: [NgxVestForms, FormErrorControlDirective],
  templateUrl: './accessible-wrapper.form.html',
  providers: [provideFormContract(accessibleWrapperContract)],
})
export class AccessibleWrapperFormBody {
  readonly formValue = input.required<AccessibleWrapperModel>();
  readonly suite = input.required<NgxVestSuite<AccessibleWrapperModel>>();

  readonly formValueChange = output<AccessibleWrapperModel>();
  readonly submitted = output();
  readonly resetRequested = output();
  readonly clearSearchRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<AccessibleWrapperModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: AccessibleWrapperModel): void {
    this.vestForm()?.resetForm(value);
  }
}
