import {
  afterNextRender,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  type FormDirective,
  type NgxSubmitSettledEvent,
  NgxVestForms,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import type { DisplayModesDemoModel } from '../../models/display-modes-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';

@Component({
  selector: 'ngx-display-modes-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './display-modes-demo.form.html',
})
export class DisplayModesDemoFormBody {
  readonly formValue = input.required<DisplayModesDemoModel>();
  readonly suite = input.required<NgxVestSuite<DisplayModesDemoModel>>();

  readonly formValueChange = output<DisplayModesDemoModel>();
  readonly submitted = output<NgxSubmitSettledEvent<DisplayModesDemoModel>>();

  private readonly vestForm =
    viewChild<FormDirective<DisplayModesDemoModel>>('vestForm');
  private readonly formElement = viewChild('vestForm', {
    read: ElementRef<HTMLFormElement>,
  });
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  constructor() {
    afterNextRender(() => {
      // This demo intentionally shows display modes against an already-validated
      // form state so the differences are immediately visible on first render.
      this.vestForm()?.triggerFormValidation();
    });
  }

  submitProgrammatically(): void {
    // A real submit event goes through NgForm and the ngx-vest-forms submit
    // pipeline, like a click on a submit button.
    this.formElement()?.nativeElement.requestSubmit();
  }

  protected onSubmitSettled(
    event: NgxSubmitSettledEvent<DisplayModesDemoModel>
  ): void {
    this.submitted.emit(event);
  }
}
