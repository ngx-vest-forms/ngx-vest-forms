import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  businessHoursFormContract,
  BusinessHoursFormModel,
} from '../../models/business-hours-form.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import {
  BusinessHoursComponent,
  BusinessHoursMap,
} from './ui/business-hours/business-hours.component';

@Component({
  selector: 'ngx-business-hours-form-body',
  imports: [NgxVestForms, BusinessHoursComponent, AlertPanel],
  templateUrl: './business-hours.form.html',
  providers: [provideFormContract(businessHoursFormContract)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursFormBody {
  readonly formValue = input.required<BusinessHoursFormModel>();
  readonly suite = input.required<NgxVestSuite<BusinessHoursFormModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<BusinessHoursFormModel>>();
  readonly rootFormError = input<string | undefined>();
  readonly businessHoursValues = input<BusinessHoursMap>({});

  readonly formValueChange = output<BusinessHoursFormModel>();
  readonly businessHoursChange = output<BusinessHoursMap>();

  private readonly vestForm =
    viewChild<FormDirective<BusinessHoursFormModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onBusinessHoursChange(values: BusinessHoursMap): void {
    this.businessHoursChange.emit(values);
  }

  triggerValidation(): void {
    this.vestForm()?.triggerFormValidation();
  }
}
