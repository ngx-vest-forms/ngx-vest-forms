import {
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  FormDirective,
  NgxFirstInvalidOptions,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  WizardStep1Model,
  WizardStep2Model,
  wizardStep3Contract,
  WizardStep3Model,
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
  readonly data = input.required<WizardStep3Model>();
  readonly suite = input.required<NgxVestSuite<WizardStep3Model>>();
  readonly isSubmitting = input(false);

  readonly dataChange = output<WizardStep3Model>();
  readonly validChange = output<boolean>();
  readonly errorsChange = output<Record<string, string[]>>();
  readonly previous = output();
  readonly goToStep = output<number>();
  readonly stepSubmit = output();
  readonly submitAll = output();

  protected readonly reviewSections = computed(() => {
    const firstName = this.step2Data().firstName || '';
    const lastName = this.step2Data().lastName || '';

    return [
      {
        id: 1,
        title: 'Account Details',
        fieldLabel: 'Email',
        fieldValue: this.step1Data().email || '-',
      },
      {
        id: 2,
        title: 'Profile Details',
        fieldLabel: 'Name',
        fieldValue: `${firstName} ${lastName}`.trim() || '-',
      },
    ];
  });

  private readonly form =
    viewChild<FormDirective<WizardStep3Model>>('step3Form');

  markAllAsTouched(): void {
    this.form()?.markAllAsTouched();
  }

  validatedFields(): readonly string[] {
    return this.form()?.validatedFields() ?? [];
  }

  pending(): boolean {
    return this.form()?.pending() ?? false;
  }

  isValid(): boolean {
    return this.form()?.valid() ?? false;
  }

  focusFirstInvalidControl(
    options?: NgxFirstInvalidOptions
  ): HTMLElement | null {
    return this.form()?.focusFirstInvalidControl(options) ?? null;
  }
}
