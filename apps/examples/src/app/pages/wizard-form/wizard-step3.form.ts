import {
  Component,
  computed,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import {
  FormDirective,
  NgxVestForms,
  type NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  type WizardStep,
  type WizardStep1Model,
  type WizardStep2Model,
  wizardStep3Contract,
  type WizardStep3Model,
} from '../../models/wizard-form.model';
import { WizardNavigationComponent } from '../../ui/wizard';

@Component({
  selector: 'ngx-wizard-step3-form',
  imports: [NgxVestForms, WizardNavigationComponent],
  templateUrl: './wizard-step3.form.html',
  providers: [provideFormContract(wizardStep3Contract)],
})
export class WizardStep3FormComponent {
  readonly step1Data = input.required<WizardStep1Model>();
  readonly step2Data = input.required<WizardStep2Model>();
  readonly data = model.required<WizardStep3Model>();
  readonly valid = model(false);
  readonly suite = input.required<NgxVestSuite<WizardStep3Model>>();
  readonly isSubmitting = input(false);

  readonly previous = output();
  readonly goToStep = output<WizardStep>();
  readonly stepSubmit = output<boolean>();
  readonly submitAll = output();

  protected readonly reviewSections = computed(() => {
    const firstName = this.step2Data().firstName || '';
    const lastName = this.step2Data().lastName || '';

    return [
      {
        id: 1 as const,
        title: 'Account Details',
        fieldLabel: 'Email',
        fieldValue: this.step1Data().email || '-',
      },
      {
        id: 2 as const,
        title: 'Profile Details',
        fieldLabel: 'Name',
        fieldValue: `${firstName} ${lastName}`.trim() || '-',
      },
    ];
  });

  /** The step's form, so the wizard can use the directive's own API. */
  readonly vestForm = viewChild.required(FormDirective<WizardStep3Model>);
}
