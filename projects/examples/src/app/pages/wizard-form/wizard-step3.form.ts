import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  FormDirective,
  NgxDeepRequired,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import {
  WizardStep1Model,
  WizardStep2Model,
  WizardStep3Model,
} from '../../models/wizard-form.model';
import { WizardNavigationComponent } from '../../ui/wizard';

@Component({
  selector: 'ngx-wizard-step3-form',
  imports: [NgxVestForms, WizardNavigationComponent],
  templateUrl: './wizard-step3.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStep3FormComponent {
  readonly step1Data = input.required<WizardStep1Model>();
  readonly step2Data = input.required<WizardStep2Model>();
  readonly data = input.required<WizardStep3Model>();
  readonly suite = input.required<NgxVestSuite<WizardStep3Model>>();
  readonly shape = input.required<NgxDeepRequired<WizardStep3Model>>();
  readonly isSubmitting = input(false);

  readonly dataChange = output<WizardStep3Model>();
  readonly validChange = output<boolean>();
  readonly errorsChange = output<Record<string, string[]>>();
  readonly previous = output();
  readonly goToStep = output<number>();
  readonly submit = output();
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
    return this.form()?.touchedFieldPaths() ?? [];
  }

  pending(): boolean {
    return this.form()?.ngForm.form.pending ?? false;
  }
}
