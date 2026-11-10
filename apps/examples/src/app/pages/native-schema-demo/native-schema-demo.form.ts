import { Component, input, output, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  type NgxSubmitSettledEvent,
  NgxVestForms,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import {
  nativeSchemaDemoContract,
  type NativeSchemaDemoModel,
} from '../../models/native-schema-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';

@Component({
  selector: 'ngx-native-schema-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './native-schema-demo.form.html',
})
export class NativeSchemaDemoFormBody {
  readonly formValue = input.required<NativeSchemaDemoModel>();
  readonly suite = input.required<NgxVestSuite<NativeSchemaDemoModel>>();
  readonly formContract = nativeSchemaDemoContract;

  readonly formValueChange = output<NativeSchemaDemoModel>();
  readonly submitted = output<NgxSubmitSettledEvent<NativeSchemaDemoModel>>();

  private readonly vestForm = viewChild('vestForm', {
    read: FormDirective<NativeSchemaDemoModel>,
  });

  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onSubmitSettled(event: NgxSubmitSettledEvent<NativeSchemaDemoModel>): void {
    this.submitted.emit(event);
  }
}
