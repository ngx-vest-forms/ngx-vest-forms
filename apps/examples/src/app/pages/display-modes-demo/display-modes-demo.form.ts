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
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  constructor() {
    afterNextRender(() => {
      // This demo intentionally shows display modes against an already-validated
      // form state so the differences are immediately visible on first render.
      this.vestForm()?.triggerFormValidation();
    });
  }

  submitProgrammatically(): void {
    const form = this.vestForm();
    if (!form) {
      return;
    }

    form.ngForm.onSubmit(new Event('submit'));
    form.markAllAsTouched();
    form.triggerFormValidation();
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
