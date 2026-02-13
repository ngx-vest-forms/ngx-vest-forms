import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { createValidationConfig, ROOT_FORM } from 'ngx-vest-forms';
import {
  BusinessHoursFormModel,
  businessHoursFormShape,
  initialBusinessHoursFormValue,
} from '../../models/business-hours-form.model';
import { Card } from '../../ui/card/card.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { BusinessHoursFormBody } from './business-hours.form';
import { businessHoursSuite } from './business-hours.validations';
import { BusinessHoursMap } from './ui/business-hours/business-hours.component';

@Component({
  selector: 'ngx-business-hours-page',
  imports: [
    Card,
    FormPageLayout,
    FormStateCardComponent,
    PageTitle,
    BusinessHoursFormBody,
  ],
  templateUrl: './business-hours.page.html',
  styleUrls: ['./business-hours.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursPageComponent {
  /** Reference to form-body for triggering validation after structural changes */
  private readonly formBody = viewChild(BusinessHoursFormBody);

  protected readonly formValue = signal<BusinessHoursFormModel>(
    initialBusinessHoursFormValue
  );
  protected readonly businessHoursSuite = businessHoursSuite;
  protected readonly shape = businessHoursFormShape;
  protected readonly ROOT_FORM = ROOT_FORM;
  protected readonly rootFormError = computed(
    () => this.formBody()?.formState()?.errors[ROOT_FORM]?.[0]
  );

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
    this.formBody()?.triggerValidation();
  }
}
