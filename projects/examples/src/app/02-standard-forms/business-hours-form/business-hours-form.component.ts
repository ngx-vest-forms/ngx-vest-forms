// (moved below class declaration)
import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
  viewChild,
} from '@angular/core';
import type { NgxVestSuite } from 'ngx-vest-forms';
import {
  injectNgxRootFormKey,
  NgxFormDirective,
  ngxVestForms,
} from 'ngx-vest-forms';
import type { InferSchemaType } from 'ngx-vest-forms/schemas';
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
import { BusinessHoursComponent } from '../../ui/business-hours/business-hours.component';
import {
  initialBusinessHourEntry,
  initialBusinessHoursFormData,
  PartialBusinessHour,
} from './business-hours-form.model';
import { createBusinessHoursSuite } from './business-hours.validations';

// Create a schema for the business hours form using the modern schema-first approach
const businessHoursFormSchema = ngxModelToStandardSchema(
  initialBusinessHoursFormData,
);

// Infer the type for the business hours form from the schema
type BusinessHoursFormType = InferSchemaType<typeof businessHoursFormSchema>;

@Component({
  selector: 'ngx-business-hours-form',
  imports: [JsonPipe, ngxVestForms, BusinessHoursComponent],
  templateUrl: './business-hours-form.component.html',
  styleUrls: ['./business-hours-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursFormComponent {
  /**
   * The initial value for the business hours form.
   */
  readonly initialBusinessHoursFormData = initialBusinessHoursFormData;
  readonly rootFormKey = injectNgxRootFormKey();

  /**
   * The form value signal, bound to the form using model() for two-way binding.
   * This is the single source of truth for the form's value.
   */
  protected readonly formValue = model<BusinessHoursFormType>(
    this.initialBusinessHoursFormData,
  );

  /**
   * Define the view child for the vestForm directive.
   */
  protected readonly vestForm =
    viewChild.required<NgxFormDirective<typeof businessHoursFormSchema>>(
      'vestForm',
    );

  /**
   * The Vest validation suite for the business hours form.
   */
  protected readonly businessHoursFormValidations: NgxVestSuite<BusinessHoursFormType> =
    createBusinessHoursSuite(this.rootFormKey);

  /**
   * The schema definition for the business hours form.
   */
  protected readonly businessHoursFormSchema = businessHoursFormSchema;

  /**
   * View model for template binding. Exposes plain values, not signals.
   */
  private readonly viewModel = computed(() => {
    const vestFormInstance = this.vestForm();
    const formState = vestFormInstance?.formState();
    const value = this.formValue();

    return {
      formValue: () => value,
      formValid: formState?.valid ?? false,
      formErrors: formState?.errors ?? {},
      businessHoursModel: value.businessHours,
    };
  });

  get businessHoursModel() {
    return this.viewModel().businessHoursModel;
  }

  onAddBusinessHour(hour: PartialBusinessHour | undefined) {
    if (!hour) return;

    this.formValue.update((current) => {
      const businessHours = current.businessHours || {
        values: {},
        addValue: initialBusinessHoursFormData.businessHours.addValue,
      };
      const currentValues = businessHours.values || {};
      const keys = Object.keys(currentValues)
        .map(Number)
        .filter((n) => !Number.isNaN(n));
      const nextKey = keys.length > 0 ? String(Math.max(...keys) + 1) : '0';

      return {
        ...current,
        businessHours: {
          ...businessHours,
          values: {
            ...currentValues,
            [nextKey]: { ...initialBusinessHourEntry, ...hour },
          },
          addValue: initialBusinessHoursFormData.businessHours.addValue,
        },
      };
    });
  }

  onRemoveBusinessHour(key: string) {
    this.formValue.update((current) => {
      const businessHours = current.businessHours || {
        values: {},
        addValue: initialBusinessHoursFormData.businessHours.addValue,
      };
      const currentValues = businessHours.values || {};
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: _removed, ...rest } = currentValues;

      return {
        ...current,
        businessHours: {
          ...businessHours,
          values: rest,
          addValue: businessHours.addValue,
        },
      };
    });
  }
}
