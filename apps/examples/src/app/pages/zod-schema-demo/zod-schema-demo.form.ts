import { Component, input, output, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import {
  zodSchemaDemoContract,
  ZodSchemaDemoModel,
} from '../../models/zod-schema-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';

@Component({
  selector: 'ngx-zod-schema-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './zod-schema-demo.form.html',
})
export class ZodSchemaDemoFormBody {
  readonly formValue = input.required<ZodSchemaDemoModel>();
  readonly suite = input.required<NgxVestSuite<ZodSchemaDemoModel>>();
  readonly formContract = zodSchemaDemoContract;

  readonly formValueChange = output<ZodSchemaDemoModel>();
  readonly submitted = output();

  private readonly vestForm = viewChild('vestForm', {
    read: FormDirective<ZodSchemaDemoModel>,
  });

  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
