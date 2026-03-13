import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxDeepRequired,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { BusinessHoursFormModel } from '../../models/business-hours-form.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import {
  BusinessHoursComponent,
  BusinessHoursMap,
} from './ui/business-hours/business-hours.component';

@Component({
  selector: 'ngx-business-hours-form-body',
  imports: [NgxVestForms, BusinessHoursComponent, Card, AlertPanel],
  templateUrl: './business-hours.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursFormBody {
  readonly formValue = input.required<BusinessHoursFormModel>();
  readonly shape = input.required<NgxDeepRequired<BusinessHoursFormModel>>();
  readonly suite = input.required<NgxVestSuite<BusinessHoursFormModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<BusinessHoursFormModel>>();
  readonly rootFormError = input<string | undefined>();
  readonly businessHoursValues = input<BusinessHoursMap>({});

  readonly formValueChange = output<BusinessHoursFormModel>();
  readonly businessHoursChange = output<BusinessHoursMap>();

  private readonly vestForm =
    viewChild<FormDirective<BusinessHoursFormModel>>('vestForm');
  private readonly formFeedback = createFormFeedbackSignals(this.vestForm);

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = this.formFeedback.formState;

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = this.formFeedback.warnings;

  /** Field paths that have been validated (touched/blurred or submitted). */
  readonly validatedFields = this.formFeedback.validatedFields;

  /** True while async validation is in progress. */
  readonly pending = this.formFeedback.pending;

  protected onBusinessHoursChange(values: BusinessHoursMap): void {
    this.businessHoursChange.emit(values);
  }

  triggerValidation(): void {
    this.vestForm()?.triggerFormValidation();
  }
}
