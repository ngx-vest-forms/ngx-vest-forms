import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  createValidationConfig,
  FormDirective,
  NgxVestForms,
} from 'ngx-vest-forms';
import {
  WizardStep1Model,
  WizardStep2Model,
  WizardStep3Model,
  wizardStep1Shape,
  wizardStep2Shape,
  wizardStep3Shape,
} from '../../../models/wizard-form.model';
import {
  wizardStep1Suite,
  wizardStep2Suite,
  wizardStep3Suite,
} from '../../../validations/wizard.validations';
import { CardComponent } from '../../ui/card/card.component';
import {
  WizardNavigationComponent,
  WizardStepConfig,
  WizardStepsComponent,
} from '../../ui/wizard';

/**
 * Multi-Form Wizard Example
 *
 * Demonstrates:
 * - Multiple forms on one page (3-step wizard)
 * - Bidirectional validation (email ↔ confirmEmail, password ↔ confirmPassword)
 * - Conditional validation (newsletter → frequency)
 * - Per-step validation on blur
 * - Per-step submit saves data to store
 * - Final submit validates ALL forms using markAllAsTouched()
 */
@Component({
  selector: 'ngx-wizard-form',
  imports: [
    NgxVestForms,
    JsonPipe,
    CardComponent,
    WizardStepsComponent,
    WizardNavigationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wizard-form.component.html',
  styleUrl: './wizard-form.component.scss',
})
export class WizardFormComponent {
  // ========== Wizard State ==========
  protected readonly currentStep = signal(1);
  protected readonly completedSteps = signal<number[]>([]);

  // ========== Step Configuration ==========
  protected readonly steps: WizardStepConfig[] = [
    { id: 1, title: 'Account', description: 'Email & Password' },
    { id: 2, title: 'Profile', description: 'Personal Information' },
    { id: 3, title: 'Review', description: 'Confirm & Submit' },
  ];

  // ========== Form Data (persisted across steps) ==========
  protected readonly step1Data = signal<WizardStep1Model>({});
  protected readonly step2Data = signal<WizardStep2Model>({
    subscribeNewsletter: false,
  });
  protected readonly step3Data = signal<WizardStep3Model>({
    acceptTerms: false,
    acceptPrivacy: false,
  });

  // ========== Validation Suites & Shapes ==========
  protected readonly step1Suite = wizardStep1Suite;
  protected readonly step2Suite = wizardStep2Suite;
  protected readonly step3Suite = wizardStep3Suite;

  protected readonly step1Shape = wizardStep1Shape;
  protected readonly step2Shape = wizardStep2Shape;
  protected readonly step3Shape = wizardStep3Shape;

  // ========== Validation Configs (bidirectional) ==========
  protected readonly step1ValidationConfig =
    createValidationConfig<WizardStep1Model>()
      .bidirectional('email', 'confirmEmail')
      .bidirectional('password', 'confirmPassword')
      .build();

  protected readonly step2ValidationConfig = computed(() => {
    const builder = createValidationConfig<WizardStep2Model>();

    // Only add newsletter dependency when checkbox is checked
    if (this.step2Data().subscribeNewsletter) {
      builder.whenChanged('subscribeNewsletter', 'newsletterFrequency');
    }

    return builder.build();
  });

  // ========== Form References (for markAllAsTouched) ==========
  protected readonly step1Form =
    viewChild<FormDirective<WizardStep1Model>>('step1Form');
  protected readonly step2Form =
    viewChild<FormDirective<WizardStep2Model>>('step2Form');
  protected readonly step3Form =
    viewChild<FormDirective<WizardStep3Model>>('step3Form');

  // ========== Validity State ==========
  protected readonly step1Valid = signal(false);
  protected readonly step2Valid = signal(false);
  protected readonly step3Valid = signal(false);

  // ========== Error Collections ==========
  protected readonly step1Errors = signal<Record<string, string[]>>({});
  protected readonly step2Errors = signal<Record<string, string[]>>({});
  protected readonly step3Errors = signal<Record<string, string[]>>({});

  // ========== Computed States ==========
  protected readonly allFormsValid = computed(
    () => this.step1Valid() && this.step2Valid() && this.step3Valid()
  );

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

  // ========== Submission State ==========
  protected readonly isSubmitting = signal(false);
  protected readonly submitSuccess = signal(false);
  protected readonly submitError = signal<string | null>(null);

  // ========== Navigation Methods ==========
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

  // ========== Step Submit Handlers ==========
  /**
   * Step 1: Save account data and proceed
   * Uses form's native submit which triggers validation
   */
  protected onStep1Submit(): void {
    if (this.step1Valid()) {
      // Mark step as completed
      this.completedSteps.update((steps) =>
        steps.includes(1) ? steps : [...steps, 1]
      );
      this.nextStep();
    }
  }

  /**
   * Step 2: Save profile data and proceed
   */
  protected onStep2Submit(): void {
    if (this.step2Valid()) {
      this.completedSteps.update((steps) =>
        steps.includes(2) ? steps : [...steps, 2]
      );
      this.nextStep();
    }
  }

  /**
   * Step 3: Accept terms (just validates, doesn't auto-proceed)
   */
  protected onStep3Submit(): void {
    if (this.step3Valid()) {
      this.completedSteps.update((steps) =>
        steps.includes(3) ? steps : [...steps, 3]
      );
    }
  }

  // ========== Final Submit ==========
  /**
   * Final submit validates ALL forms and submits combined data
   * This is where markAllAsTouched() is essential for multi-form scenarios
   */
  protected async submitAll(): Promise<void> {
    // Mark all forms as touched to show ALL validation errors
    this.step1Form()?.markAllAsTouched();
    this.step2Form()?.markAllAsTouched();
    this.step3Form()?.markAllAsTouched();

    // Check if all forms are valid
    if (!this.allFormsValid()) {
      this.submitError.set(
        'Please complete all steps before submitting. Check each step for errors.'
      );

      // Navigate to first invalid step
      if (!this.step1Valid()) {
        this.goToStep(1);
      } else if (!this.step2Valid()) {
        this.goToStep(2);
      } else if (!this.step3Valid()) {
        this.goToStep(3);
      }
      return;
    }

    // Clear any previous errors
    this.submitError.set(null);
    this.isSubmitting.set(true);

    try {
      // Combine all form data
      const completeData = {
        step1: this.step1Data(),
        step2: this.step2Data(),
        step3: this.step3Data(),
      };

      // Simulate API call
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

  // ========== Helper Methods ==========
  private async simulateApiSubmit(data: unknown): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Log data for demo purposes (in real app, send to API)
    console.log('Wizard submitted:', data);
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
