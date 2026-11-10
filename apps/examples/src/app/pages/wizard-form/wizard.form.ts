import {
  Component,
  computed,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  type NgxValidationConfig,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import type {
  WizardStep,
  WizardStep1Model,
  WizardStep2Model,
  WizardStep3Model,
} from './wizard-form.model';
import { WizardStep1FormComponent } from './wizard-step1.form';
import { WizardStep2FormComponent } from './wizard-step2.form';
import { WizardStep3FormComponent } from './wizard-step3.form';

@Component({
  selector: 'ngx-wizard-form-body',
  imports: [
    WizardStep1FormComponent,
    WizardStep2FormComponent,
    WizardStep3FormComponent,
  ],
  templateUrl: './wizard.form.html',
})
export class WizardFormBodyComponent {
  readonly currentStep = input.required<WizardStep>();

  readonly isSubmitting = input(false);

  readonly step1Data = model.required<WizardStep1Model>();
  readonly step2Data = model.required<WizardStep2Model>();
  readonly step3Data = model.required<WizardStep3Model>();

  readonly step1Valid = model(false);
  readonly step2Valid = model(false);
  readonly step3Valid = model(false);

  readonly step1Suite = input.required<NgxVestSuite<WizardStep1Model>>();
  readonly step2Suite = input.required<NgxVestSuite<WizardStep2Model>>();
  readonly step3Suite = input.required<NgxVestSuite<WizardStep3Model>>();

  readonly step1ValidationConfig =
    input.required<NgxValidationConfig<WizardStep1Model>>();
  readonly step2ValidationConfig =
    input.required<NgxValidationConfig<WizardStep2Model>>();

  readonly goToStep = output<WizardStep>();
  readonly previousStep = output();
  readonly step1Submit = output<boolean>();
  readonly step2Submit = output<boolean>();
  readonly step3Submit = output<boolean>();
  readonly submitAll = output();

  private readonly step1Form = viewChild(WizardStep1FormComponent);
  private readonly step2Form = viewChild(WizardStep2FormComponent);
  private readonly step3Form = viewChild(WizardStep3FormComponent);

  /**
   * The rendered step's `FormDirective`. Only one step is rendered at a
   * time, so at most one of the queries resolves.
   */
  readonly currentForm = computed(
    () =>
      this.step1Form()?.vestForm() ??
      this.step2Form()?.vestForm() ??
      this.step3Form()?.vestForm()
  );

  /** Errors, pending state and validated fields of the rendered step. */
  readonly feedback = createFormFeedbackSignals(this.currentForm);
}
