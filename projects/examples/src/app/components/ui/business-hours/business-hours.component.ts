import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { NgModelGroup } from '@angular/forms';
import {
  arrayToObject,
  NgxVestForms,
  vestFormsViewProviders,
} from 'ngx-vest-forms';
import { BusinessHourFormModel } from '../../../models/business-hours-form.model';
import { BusinessHourComponent } from '../business-hour/business-hour.component';

export type BusinessHoursMap = Record<string, BusinessHourFormModel>;

/**
 * Business hours component that integrates with ngx-vest-forms parent form.
 *
 * With `vestFormsViewProviders`, this component's ngModel changes automatically
 * flow to the parent form via Angular's template-driven forms mechanism.
 * The parent receives changes via `(formValueChange)` on its `ngxVestForm`.
 *
 * For add/remove operations that change the structure (not just values),
 * we emit via `valuesChange` output since those aren't captured by ngModel.
 */
@Component({
  selector: 'ngx-business-hours',
  imports: [NgxVestForms, KeyValuePipe, BusinessHourComponent],
  templateUrl: './business-hours.component.html',
  styleUrls: ['./business-hours.component.scss'],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursComponent {
  /**
   * Business hours map from parent.
   * Changes to existing values flow back to parent via ngModel + vestFormsViewProviders.
   */
  readonly values = input<BusinessHoursMap>({});

  /**
   * Emits when business hours are added or removed (structural changes).
   * Value edits flow through ngModel automatically.
   */
  readonly valuesChange = output<BusinessHoursMap>();

  /** Local UI state for the "add new" form fields - not part of form model */
  readonly newBusinessHour = signal<BusinessHourFormModel>({});

  /** Adds the new business hour and emits structural change to parent */
  addBusinessHour(group: NgModelGroup): void {
    const newValue = this.newBusinessHour();
    if (!newValue.from || !newValue.to) return;

    const businessHours = [...Object.values(this.values()), newValue];
    const newValues = arrayToObject(businessHours);
    group.control.markAsUntouched();
    this.newBusinessHour.set({});
    this.valuesChange.emit(newValues);
  }

  /** Removes a business hour and emits structural change to parent */
  removeBusinessHour(key: string): void {
    const businessHours = Object.values(this.values()).filter(
      (_, index) => index !== Number(key)
    );
    const newValues = arrayToObject(businessHours);
    this.valuesChange.emit(newValues);
  }

  /** Updates the local new business hour (local UI state only) */
  onNewBusinessHourChange(value: BusinessHourFormModel): void {
    this.newBusinessHour.set(value);
  }
}
