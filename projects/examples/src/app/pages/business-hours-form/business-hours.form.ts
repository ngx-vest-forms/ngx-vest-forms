import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createEmptyFormState,
  FormDirective,
  NgxDeepRequired,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { BusinessHoursFormModel } from '../../models/business-hours-form.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { mapWarningsToRecord } from '../../utils/form-warnings.util';
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

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = computed(() => {
    const state = this.vestForm()?.formState();
    if (!state) return createEmptyFormState<BusinessHoursFormModel>();
    return state;
  });

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = computed(() =>
    mapWarningsToRecord(this.vestForm()?.fieldWarnings() ?? new Map())
  );

  /** Field paths that have been validated (touched/blurred or submitted). */
  readonly validatedFields = computed(
    () => this.vestForm()?.touchedFieldPaths() ?? []
  );

  /** True while async validation is in progress. */
  readonly pending = computed(
    () => this.vestForm()?.ngForm.form.pending ?? false
  );

  protected onBusinessHoursChange(values: BusinessHoursMap): void {
    this.businessHoursChange.emit(values);
  }

  triggerValidation(): void {
    this.vestForm()?.triggerFormValidation();
  }
}
