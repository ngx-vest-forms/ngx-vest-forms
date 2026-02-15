import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  FormDirective,
  NgxDeepRequired,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import {
  WizardStep1Model,
  WizardStep2Model,
  WizardStep3Model,
} from '../../models/wizard-form.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import {
  WizardNavigationComponent,
  WizardStepConfig,
  WizardStepsComponent,
} from '../../ui/wizard';

@Component({
  selector: 'ngx-wizard-form-body',
  imports: [
    NgxVestForms,
    AlertPanel,
    Card,
    WizardStepsComponent,
    WizardNavigationComponent,
  ],
  templateUrl: './wizard.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardFormBodyComponent {
  readonly steps = input.required<WizardStepConfig[]>();
  readonly currentStep = input.required<number>();
  readonly completedSteps = input<number[]>([]);

  readonly submitSuccess = input(false);
  readonly submitError = input<string | null>(null);
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

  readonly resetWizard = output();
  readonly goToStep = output<number>();
  readonly previousStep = output();
  readonly step1Submit = output();
  readonly step2Submit = output();
  readonly step3Submit = output();
  readonly submitAll = output();

  private readonly step1Form =
    viewChild<FormDirective<WizardStep1Model>>('step1Form');
  private readonly step2Form =
    viewChild<FormDirective<WizardStep2Model>>('step2Form');
  private readonly step3Form =
    viewChild<FormDirective<WizardStep3Model>>('step3Form');

  protected emitResetWizard(): void {
    this.resetWizard.emit();
  }

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
    this.step1Form()?.markAllAsTouched();
    this.step2Form()?.markAllAsTouched();
    this.step3Form()?.markAllAsTouched();
  }
}
