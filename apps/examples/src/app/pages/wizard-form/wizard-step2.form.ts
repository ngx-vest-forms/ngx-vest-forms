import { Component, input, model, output, viewChild } from '@angular/core';
import {
  FormDirective,
  type NgxValidationConfig,
  NgxVestForms,
  type NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  wizardStep2Contract,
  type WizardStep2Model,
} from '../../models/wizard-form.model';
import { WizardNavigationComponent } from '../../ui/wizard';

@Component({
  selector: 'ngx-wizard-step2-form',
  imports: [NgxVestForms, WizardNavigationComponent],
  templateUrl: './wizard-step2.form.html',
  providers: [provideFormContract(wizardStep2Contract)],
})
export class WizardStep2FormComponent {
  readonly data = model.required<WizardStep2Model>();
  readonly valid = model(false);
  readonly suite = input.required<NgxVestSuite<WizardStep2Model>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<WizardStep2Model>>();

  readonly previous = output();
  readonly stepSubmit = output<boolean>();

  /** The step's form, so the wizard can use the directive's own API. */
  readonly vestForm = viewChild.required(FormDirective<WizardStep2Model>);
}
