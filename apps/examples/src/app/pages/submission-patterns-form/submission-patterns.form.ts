import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  getAllFormErrors,
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  NgxFormErrorsByPath,
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
  private readonly formElement =
    viewChild<ElementRef<HTMLFormElement>>('formElement');

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  clearSubmittedState(): void {
    this.vestForm()?.clearSubmittedState();
  }

  /** A one-off copy of every error, which later edits do not change. */
  errorSnapshot(): NgxFormErrorsByPath {
    return getAllFormErrors(this.vestForm()?.ngForm.form);
  }

  /** Focuses the control bound to `field`, for the blocked-submit summary. */
  focusField(field: string): void {
    this.formElement()
      ?.nativeElement.querySelector<HTMLElement>(
        `[name="${CSS.escape(field)}"]`
      )
      ?.focus();
  }

  focusFirstInvalidControl(): void {
    this.vestForm()?.focusFirstInvalidControl();
  }

  resetFormState(value: SubmissionPatternsModel): void {
    this.vestForm()?.resetForm(value);
  }
}
