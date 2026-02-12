import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import {
  createValidationConfig,
  FormDirective,
  NgxVestForms,
  ROOT_FORM,
  ValidateRootFormDirective,
} from 'ngx-vest-forms';
import {
  BusinessHoursFormModel,
  businessHoursFormShape,
  initialBusinessHoursFormValue,
} from '../../models/business-hours-form.model';
import { CardComponent } from '../../ui/card/card.component';
import { businessHoursSuite } from './business-hours.validations';
import {
  BusinessHoursComponent,
  BusinessHoursMap,
} from './ui/business-hours/business-hours.component';

@Component({
  selector: 'ngx-business-hours-form',
  imports: [
    JsonPipe,
    NgxVestForms,
    ValidateRootFormDirective,
    BusinessHoursComponent,
    CardComponent,
  ],
  templateUrl: './business-hours-form.component.html',
  styleUrls: ['./business-hours-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursFormComponent {
  /** Reference to the form directive for triggering validation after structural changes */
  protected readonly vestFormRef =
    viewChild<FormDirective<BusinessHoursFormModel>>('vestForm');

  protected readonly formValue = signal<BusinessHoursFormModel>(
    initialBusinessHoursFormValue
  );
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly businessHoursSuite = businessHoursSuite;
  protected readonly shape = businessHoursFormShape;
  protected readonly ROOT_FORM = ROOT_FORM;

  protected readonly validationConfig =
    createValidationConfig<BusinessHoursFormModel>()
      .bidirectional('businessHours.addValue.from', 'businessHours.addValue.to')
      .build();

  /** Returns business hours values with proper typing for the child component */
  protected getBusinessHoursValues(): BusinessHoursMap {
    const values = this.formValue().businessHours?.values;
    if (!values) return {};

    // Filter out any undefined values from DeepPartial
    const result: BusinessHoursMap = {};
    for (const [key, value] of Object.entries(values)) {
      if (value) {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Handles structural changes (add/remove) from BusinessHoursComponent.
   * Value edits flow automatically via ngModel + vestFormsViewProviders.
   */
  protected onBusinessHoursChange(values: BusinessHoursMap): void {
    this.formValue.update((current) => ({
      ...current,
      businessHours: {
        ...current.businessHours,
        // Clear the add-new slot values after adding/removing.
        // This keeps the UI ready for the next entry and avoids emitting a
        // separate form value change from inside the child component.
        addValue: { from: '', to: '' },
        values,
      },
    }));

    // Trigger validation refresh after structural changes.
    // This ensures all validations re-run, including:
    // - Form-level overlap detection (ROOT_FORM tests)
    // - Field-level validations with allowEmptyPair logic for cleared addValue inputs
    // - Any conditional validations that depend on the structure
    this.vestFormRef()?.triggerFormValidation();
  }
}
