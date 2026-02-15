import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgModelGroup } from '@angular/forms';
import {
  arrayToObject,
  NgxVestForms,
  vestFormsViewProviders,
} from 'ngx-vest-forms';
import { BusinessHourFormModel } from '../../../../models/business-hours-form.model';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [vestFormsViewProviders]
})
export class BusinessHoursComponent {
  /**
   * Business hours map from parent.
   * Changes to existing values flow back to parent via ngModel + vestFormsViewProviders.
   */
  readonly values = input<BusinessHoursMap>({});

  /** The current "add new slot" values from the parent form model. */
  readonly addValue = input<BusinessHourFormModel | undefined>(undefined);

  /**
   * Emits when business hours are added or removed (structural changes).
   * Value edits flow through ngModel automatically.
   */
  readonly valuesChange = output<BusinessHoursMap>();

  /** Adds the new business hour and emits structural change to parent */
  addBusinessHour(
    addValueGroup: NgModelGroup,
    valuesGroup?: NgModelGroup
  ): void {
    // IMPORTANT:
    // For click-time actions (like adding a new slot), the NgModelGroup control
    // value is the authoritative source of truth. The parent-provided `addValue()`
    // is updated via unidirectional sync and can lag a tick behind user input.
    const groupValue = addValueGroup.control
      .value as BusinessHourFormModel | null;
    const newValue = groupValue ?? this.addValue();
    if (!newValue?.from || !newValue?.to) return;

    // IMPORTANT: use the current form group's value as the source of truth.
    // `values()` is an input that is updated by the parent via unidirectional sync,
    // which can lag behind during rapid consecutive adds.
    const currentValues =
      (valuesGroup?.control.value as BusinessHoursMap | null) ?? this.values();

    const businessHours = [...Object.values(currentValues), newValue];
    const newValues = arrayToObject(businessHours);

    // IMPORTANT: Do NOT reset values here.
    // Resetting would emit a form value change first, which can overwrite the
    // structural update we emit via valuesChange (race/conflict with the parent
    // unidirectional sync). Instead, the parent clears `businessHours.addValue`
    // as part of handling `valuesChange`, and the form directive patches that
    // value back into the form with emitEvent:false.
    addValueGroup.control.markAsPristine();
    addValueGroup.control.markAsUntouched();
    this.valuesChange.emit(newValues);

    // Note: Validation refresh after structural changes is handled by the parent
    // component via triggerFormValidation() in onBusinessHoursChange(). This ensures
    // all validations (including form-level overlap checks and field-level rules)
    // are re-run after the parent applies the structural update.
  }

  /**
   * Checks if the add button should be disabled.
   * Disabled when: pending, invalid, or either from/to field is empty.
   *
   * Note: We use a method instead of inline template expression to avoid
   * TypeScript warnings about optional chaining on group.control, which
   * CAN be null during initial render despite TypeScript's type inference.
   */
  isAddButtonDisabled(group: NgModelGroup): boolean {
    if (group.pending || group.invalid) return true;
    const control = group.control;
    if (!control) return true;
    const fromValue = control.get('from')?.value;
    const toValue = control.get('to')?.value;
    return !fromValue || !toValue;
  }

  /** Removes a business hour and emits structural change to parent */
  removeBusinessHour(key: string, valuesGroup?: NgModelGroup): void {
    const currentValues =
      (valuesGroup?.control.value as BusinessHoursMap | null) ?? this.values();

    const businessHours = Object.values(currentValues).filter(
      (_, index) => index !== Number(key)
    );
    const newValues = arrayToObject(businessHours);
    this.valuesChange.emit(newValues);

    // Note: Validation refresh after structural changes is handled by the parent
    // component via triggerFormValidation() in onBusinessHoursChange().
  }
}
