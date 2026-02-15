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
import { WizardStep2Model } from '../../models/wizard-form.model';
import { WizardNavigationComponent } from '../../ui/wizard';

@Component({
  selector: 'ngx-wizard-step2-form',
  imports: [NgxVestForms, WizardNavigationComponent],
  templateUrl: './wizard-step2.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStep2FormComponent {
  readonly data = input.required<WizardStep2Model>();
  readonly suite = input.required<NgxVestSuite<WizardStep2Model>>();
  readonly shape = input.required<NgxDeepRequired<WizardStep2Model>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<WizardStep2Model>>();

  readonly dataChange = output<WizardStep2Model>();
  readonly validChange = output<boolean>();
  readonly errorsChange = output<Record<string, string[]>>();
  readonly previous = output();
  readonly submit = output();

  private readonly form =
    viewChild<FormDirective<WizardStep2Model>>('step2Form');

  markAllAsTouched(): void {
    this.form()?.markAllAsTouched();
  }
}
