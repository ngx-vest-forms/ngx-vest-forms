import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  SubmissionPatternsModel,
  submissionPatternsShape,
} from '../../models/submission-patterns.model';

@Component({
  selector: 'ngx-submission-patterns-form-body',
  imports: [NgxVestForms],
  templateUrl: './submission-patterns.form.html',
  providers: [
    provideFormContract(submissionPatternsShape),
    {
      provide: NGX_ERROR_DISPLAY_MODE_TOKEN,
      useValue: 'on-submit',
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmissionPatternsFormBody {
  readonly formValue = input.required<SubmissionPatternsModel>();
  readonly suite = input.required<NgxVestSuite<SubmissionPatternsModel>>();
  readonly submitting = input(false);

  readonly formValueChange = output<SubmissionPatternsModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<SubmissionPatternsModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  clearSubmittedState(): void {
    this.vestForm()?.clearSubmittedState();
  }

  focusFirstInvalidControl(): void {
    this.vestForm()?.focusFirstInvalidControl();
  }

  resetFormState(value: SubmissionPatternsModel): void {
    this.vestForm()?.resetForm(value);
  }
}
