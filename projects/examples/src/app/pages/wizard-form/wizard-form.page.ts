import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { createValidationConfig } from 'ngx-vest-forms';
import {
  WizardStep1Model,
  wizardStep1Shape,
  WizardStep2Model,
  wizardStep2Shape,
  WizardStep3Model,
  wizardStep3Shape,
} from '../../models/wizard-form.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { StatusBadge } from '../../ui/status-badge/status-badge.component';
import { WizardStepConfig, WizardStepsComponent } from '../../ui/wizard';
import { WizardFormBodyComponent } from './wizard.form';
import {
  wizardStep1Suite,
  wizardStep2Suite,
  wizardStep3Suite,
} from './wizard.validations';

@Component({
  selector: 'ngx-wizard-form-page',
  imports: [
    Card,
    FormPageLayout,
    FormStateCardComponent,
    AlertPanel,
    PageTitle,
    StatusBadge,
    WizardStepsComponent,
    WizardFormBodyComponent,
  ],
  templateUrl: './wizard-form.page.html',
  styleUrl: './wizard-form.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardFormPageComponent {
  protected readonly currentStep = signal(1);
  protected readonly completedSteps = signal<number[]>([]);

  protected readonly steps: WizardStepConfig[] = [
    { id: 1, title: 'Account', description: 'Email & Password' },
    { id: 2, title: 'Profile', description: 'Personal Information' },
    { id: 3, title: 'Review', description: 'Confirm & Submit' },
  ];

  protected readonly step1Data = signal<WizardStep1Model>({});
  protected readonly step2Data = signal<WizardStep2Model>({
    subscribeNewsletter: false,
  });
  protected readonly step3Data = signal<WizardStep3Model>({
    acceptTerms: false,
    acceptPrivacy: false,
  });

  protected readonly step1Suite = wizardStep1Suite;
  protected readonly step2Suite = wizardStep2Suite;
  protected readonly step3Suite = wizardStep3Suite;

  protected readonly step1Shape = wizardStep1Shape;
  protected readonly step2Shape = wizardStep2Shape;
  protected readonly step3Shape = wizardStep3Shape;

  protected readonly step1ValidationConfig =
    createValidationConfig<WizardStep1Model>()
      .bidirectional('email', 'confirmEmail')
      .bidirectional('password', 'confirmPassword')
      .build();

  protected readonly step2ValidationConfig = computed(() => {
    const builder = createValidationConfig<WizardStep2Model>();

    if (this.step2Data().subscribeNewsletter) {
      builder.bidirectional('subscribeNewsletter', 'newsletterFrequency');
    }

    return builder.build();
  });

  private readonly formBody = viewChild(WizardFormBodyComponent);

  protected readonly step1Valid = signal(false);
  protected readonly step2Valid = signal(false);
  protected readonly step3Valid = signal(false);

  protected readonly step1Errors = signal<Record<string, string[]>>({});
  protected readonly step2Errors = signal<Record<string, string[]>>({});
  protected readonly step3Errors = signal<Record<string, string[]>>({});

  protected readonly allFormsValid = computed(
    () => this.step1Valid() && this.step2Valid() && this.step3Valid()
  );

  protected readonly currentStepData = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return this.step1Data();
      case 2:
        return this.step2Data();
      default:
        return this.step3Data();
    }
  });

  protected readonly currentStepErrors = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return this.step1Errors();
      case 2:
        return this.step2Errors();
      default:
        return this.step3Errors();
    }
  });

  protected readonly currentStepValidatedFields = computed(
    () => this.formBody()?.currentStepValidatedFields() ?? []
  );

  protected readonly currentStepPending = computed(
    () => this.formBody()?.currentStepPending() ?? false
  );

  protected readonly wizardInfo = computed(() => [
    `Viewing Step ${this.currentStep()} model and feedback.`,
  ]);

  protected readonly stepStatusRows = computed(() => [
    { id: 1, label: 'Step 1: Account', valid: this.step1Valid() },
    { id: 2, label: 'Step 2: Profile', valid: this.step2Valid() },
    { id: 3, label: 'Step 3: Confirm', valid: this.step3Valid() },
  ]);

  protected readonly currentStepTitle = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return 'Step 1: Account Setup';
      case 2:
        return 'Step 2: Profile Information';
      default:
        return 'Step 3: Review & Confirm';
    }
  });

  protected readonly isFirstStep = computed(() => this.currentStep() === 1);
  protected readonly isLastStep = computed(() => this.currentStep() === 3);

  protected readonly canProceed = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return this.step1Valid();
      case 2:
        return this.step2Valid();
      case 3:
        return this.step3Valid();
      default:
        return false;
    }
  });

  protected readonly isSubmitting = signal(false);
  protected readonly submitSuccess = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected goToStep(step: number): void {
    if (step >= 1 && step <= 3) {
      this.currentStep.set(step);
    }
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  protected nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update((s) => s + 1);
    }
  }

  protected onStep1Submit(): void {
    if (this.step1Valid()) {
      this.completedSteps.update((steps) =>
        steps.includes(1) ? steps : [...steps, 1]
      );
      this.nextStep();
    }
  }

  protected onStep2Submit(): void {
    if (this.step2Valid()) {
      this.completedSteps.update((steps) =>
        steps.includes(2) ? steps : [...steps, 2]
      );
      this.nextStep();
    }
  }

  protected onStep3Submit(): void {
    if (this.step3Valid()) {
      this.completedSteps.update((steps) =>
        steps.includes(3) ? steps : [...steps, 3]
      );
    }
  }

  protected async submitAll(): Promise<void> {
    this.formBody()?.markAllAsTouched();

    if (!this.allFormsValid()) {
      this.submitError.set(
        'Please complete all steps before submitting. Check each step for errors.'
      );

      if (!this.step1Valid()) {
        this.goToStep(1);
      } else if (!this.step2Valid()) {
        this.goToStep(2);
      } else if (!this.step3Valid()) {
        this.goToStep(3);
      }
      return;
    }

    this.submitError.set(null);
    this.isSubmitting.set(true);

    try {
      const completeData = {
        step1: this.step1Data(),
        step2: this.step2Data(),
        step3: this.step3Data(),
      };

      await this.simulateApiSubmit(completeData);
      this.submitSuccess.set(true);
    } catch (error) {
      this.submitError.set(
        error instanceof Error ? error.message : 'Submission failed'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async simulateApiSubmit(_data: unknown): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  protected resetWizard(): void {
    this.step1Data.set({});
    this.step2Data.set({ subscribeNewsletter: false });
    this.step3Data.set({ acceptTerms: false, acceptPrivacy: false });
    this.completedSteps.set([]);
    this.currentStep.set(1);
    this.submitSuccess.set(false);
    this.submitError.set(null);
  }
}
