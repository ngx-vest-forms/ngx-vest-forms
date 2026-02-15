import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  NgxDeepRequired,
  NgxValidationConfig,
  NgxVestSuite,
} from 'ngx-vest-forms';
import {
  WizardStep1Model,
  WizardStep2Model,
  WizardStep3Model,
} from '../../models/wizard-form.model';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardFormBodyComponent {
  readonly currentStep = input.required<number>();

  readonly isSubmitting = input(false);

  readonly step1Data = input.required<WizardStep1Model>();
  readonly step2Data = input.required<WizardStep2Model>();
  readonly step3Data = input.required<WizardStep3Model>();

  readonly step1Suite = input.required<NgxVestSuite<WizardStep1Model>>();
  readonly step2Suite = input.required<NgxVestSuite<WizardStep2Model>>();
  readonly step3Suite = input.required<NgxVestSuite<WizardStep3Model>>();

  readonly step1Shape = input.required<NgxDeepRequired<WizardStep1Model>>();
  readonly step2Shape = input.required<NgxDeepRequired<WizardStep2Model>>();
  readonly step3Shape = input.required<NgxDeepRequired<WizardStep3Model>>();

  readonly step1ValidationConfig =
    input.required<NgxValidationConfig<WizardStep1Model>>();
  readonly step2ValidationConfig =
    input.required<NgxValidationConfig<WizardStep2Model>>();

  readonly step1Valid = input(false);
  readonly step2Valid = input(false);
  readonly step3Valid = input(false);

  readonly step1DataChange = output<WizardStep1Model>();
  readonly step2DataChange = output<WizardStep2Model>();
  readonly step3DataChange = output<WizardStep3Model>();

  readonly step1ValidChange = output<boolean>();
  readonly step2ValidChange = output<boolean>();
  readonly step3ValidChange = output<boolean>();

  readonly step1ErrorsChange = output<Record<string, string[]>>();
  readonly step2ErrorsChange = output<Record<string, string[]>>();
  readonly step3ErrorsChange = output<Record<string, string[]>>();

  readonly goToStep = output<number>();
  readonly previousStep = output();
  readonly step1Submit = output();
  readonly step2Submit = output();
  readonly step3Submit = output();
  readonly submitAll = output();

  private readonly step1Form = viewChild(WizardStep1FormComponent);
  private readonly step2Form = viewChild(WizardStep2FormComponent);
  private readonly step3Form = viewChild(WizardStep3FormComponent);

  protected emitGoToStep(step: number): void {
    this.goToStep.emit(step);
  }

  protected emitPreviousStep(): void {
    this.previousStep.emit();
  }

  protected emitStep1Submit(): void {
    this.step1Submit.emit();
  }

  protected emitStep2Submit(): void {
    this.step2Submit.emit();
  }

  protected emitStep3Submit(): void {
    this.step3Submit.emit();
  }

  protected emitSubmitAll(): void {
    this.submitAll.emit();
  }

  markAllAsTouched(): void {
    switch (this.currentStep()) {
      case 1:
        this.step1Form()?.markAllAsTouched();
        break;
      case 2:
        this.step2Form()?.markAllAsTouched();
        break;
      default:
        this.step3Form()?.markAllAsTouched();
        break;
    }
  }
}
