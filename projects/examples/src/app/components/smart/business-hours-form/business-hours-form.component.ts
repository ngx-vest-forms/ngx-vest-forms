import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  createValidationConfig,
  NgxVestForms,
  ROOT_FORM,
  ValidateRootFormDirective,
} from 'ngx-vest-forms';
import {
  BusinessHoursFormModel,
  businessHoursFormShape,
} from '../../../models/business-hours-form.model';
import { businessHoursSuite } from '../../../validations/business-hours.validations';
import {
  BusinessHoursComponent,
  BusinessHoursMap,
} from '../../ui/business-hours/business-hours.component';
import { CardComponent } from '../../ui/card/card.component';

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
  protected readonly formValue = signal<BusinessHoursFormModel>({});
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
  }
}
