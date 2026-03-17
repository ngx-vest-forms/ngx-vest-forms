import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { DisplayModesDemoModel } from '../../models/display-modes-demo.model';
import { Card } from '../../ui/card/card.component';

@Component({
  selector: 'ngx-display-modes-demo-form-body',
  imports: [NgxVestForms, Card],
  templateUrl: './display-modes-demo.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayModesDemoFormBody {
  readonly formValue = input.required<DisplayModesDemoModel>();
  readonly suite = input.required<NgxVestSuite<DisplayModesDemoModel>>();

  readonly formValueChange = output<DisplayModesDemoModel>();
  readonly submitted = output();

  private readonly vestForm =
    viewChild<FormDirective<DisplayModesDemoModel>>('vestForm');
  private readonly formFeedback = createFormFeedbackSignals(this.vestForm);

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = this.formFeedback.formState;

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = this.formFeedback.warnings;

  /** Field paths that have been validated (touched/blurred or submitted). */
  readonly validatedFields = this.formFeedback.validatedFields;

  /** True while async validation is in progress. */
  readonly pending = this.formFeedback.pending;

  constructor() {
    afterNextRender(() => {
      // This demo intentionally shows display modes against an already-validated
      // form state so the differences are immediately visible on first render.
      this.vestForm()?.triggerFormValidation();
    });
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
