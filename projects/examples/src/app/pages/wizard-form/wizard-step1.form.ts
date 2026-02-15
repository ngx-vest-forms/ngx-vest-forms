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
import { WizardStep1Model } from '../../models/wizard-form.model';
import { WizardNavigationComponent } from '../../ui/wizard';

@Component({
  selector: 'ngx-wizard-step1-form',
  imports: [NgxVestForms, WizardNavigationComponent],
  templateUrl: './wizard-step1.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStep1FormComponent {
  readonly data = input.required<WizardStep1Model>();
  readonly suite = input.required<NgxVestSuite<WizardStep1Model>>();
  readonly shape = input.required<NgxDeepRequired<WizardStep1Model>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<WizardStep1Model>>();

  readonly dataChange = output<WizardStep1Model>();
  readonly validChange = output<boolean>();
  readonly errorsChange = output<Record<string, string[]>>();
  readonly submit = output();

  private readonly form =
    viewChild<FormDirective<WizardStep1Model>>('step1Form');

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
