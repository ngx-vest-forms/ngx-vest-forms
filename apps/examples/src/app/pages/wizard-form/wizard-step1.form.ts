import {
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  FormDirective,
  NgxFirstInvalidOptions,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  wizardStep1Contract,
  WizardStep1Model,
} from '../../models/wizard-form.model';
import { WizardNavigationComponent } from '../../ui/wizard';

@Component({
  selector: 'ngx-wizard-step1-form',
  imports: [NgxVestForms, WizardNavigationComponent],
  templateUrl: './wizard-step1.form.html',
  providers: [provideFormContract(wizardStep1Contract)],
})
export class WizardStep1FormComponent {
  readonly data = input.required<WizardStep1Model>();
  readonly suite = input.required<NgxVestSuite<WizardStep1Model>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<WizardStep1Model>>();

  readonly dataChange = output<WizardStep1Model>();
  readonly validChange = output<boolean>();
  readonly errorsChange = output<Record<string, string[]>>();
  readonly stepSubmit = output();

  private readonly form =
    viewChild<FormDirective<WizardStep1Model>>('step1Form');

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
