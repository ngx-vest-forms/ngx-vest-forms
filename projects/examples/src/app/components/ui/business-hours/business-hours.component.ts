import { KeyValuePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
  input,
  output,
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
  private readonly injector = inject(Injector);

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
    // We read the current add-new values from the parent model (`addValue()`),
    // which is kept in sync via the parent form's (formValueChange) output.
    // This is the most reliable unidirectional flow and avoids relying on
    // the internal NgModelGroup control value.
    const newValue = this.addValue();
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

    // After the parent applies the structural update, it also clears the addValue
    // inputs via the unidirectional formValue sync. That can temporarily clear one
    // field before the other, leaving a stale one-sided validation error.
    // Additionally, the form directive patches values with emitEvent:false, so
    // group-level validators (e.g. businessHours.values overlap checks) may not
    // automatically re-run after structural changes.
    // Trigger a follow-up validity refresh after the next render.
    // This is more deterministic than setTimeout and ensures the parent has
    // applied the structural change + unidirectional model patch.
    afterNextRender(
      () => {
        addValueGroup.control.get('from')?.updateValueAndValidity();
        addValueGroup.control.get('to')?.updateValueAndValidity();
        valuesGroup?.control.updateValueAndValidity();
      },
      { injector: this.injector }
    );
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

    // See note in addBusinessHour(): structural changes are patched into the form with
    // emitEvent:false, so we proactively refresh group-level validations.
    afterNextRender(
      () => {
        valuesGroup?.control.updateValueAndValidity();
      },
      { injector: this.injector }
    );
  }
}
