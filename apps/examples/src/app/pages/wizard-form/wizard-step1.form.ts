import { Component, input, model, output, viewChild } from '@angular/core';
import {
  FormDirective,
  type NgxValidationConfig,
  NgxVestForms,
  type NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  wizardStep1Contract,
  type WizardStep1Model,
} from '../../models/wizard-form.model';
import { WizardNavigationComponent } from '../../ui/wizard';

@Component({
  selector: 'ngx-wizard-step1-form',
  imports: [NgxVestForms, WizardNavigationComponent],
  templateUrl: './wizard-step1.form.html',
  providers: [provideFormContract(wizardStep1Contract)],
})
export class WizardStep1FormComponent {
  readonly data = model.required<WizardStep1Model>();
  readonly valid = model(false);
  readonly suite = input.required<NgxVestSuite<WizardStep1Model>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<WizardStep1Model>>();

  readonly stepSubmit = output<boolean>();

  /** The step's form, so the wizard can use the directive's own API. */
  readonly vestForm = viewChild.required(FormDirective<WizardStep1Model>);
}
