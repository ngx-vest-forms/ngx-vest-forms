import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import {
  arrayToObject,
  NgxVestForms,
  vestFormsViewProviders,
} from 'ngx-vest-forms';
import type { PhoneNumberMap } from '../../../models/phonenumber.model';

/**
 * Phone numbers component that integrates with ngx-vest-forms parent form.
 *
 * With `vestFormsViewProviders`, this component's ngModel changes automatically
 * flow to the parent form via Angular's template-driven forms mechanism.
 * The parent receives changes via `(formValueChange)` on its `ngxVestForm`.
 *
 * For add/remove operations that change the structure (not just values),
 * we emit via `valuesChange` output since those aren't captured by ngModel.
 */
@Component({
  selector: 'ngx-phonenumbers',
  imports: [NgxVestForms, KeyValuePipe],
  templateUrl: './phonenumbers.component.html',
  styleUrls: ['./phonenumbers.component.scss'],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneNumbersComponent {
  /**
   * Phone numbers map from parent.
   * Changes to existing values flow back to parent via ngModel + vestFormsViewProviders.
   */
  readonly values = input<PhoneNumberMap>({});

  /**
   * Emits when phone numbers are added or removed (structural changes).
   * Value edits flow through ngModel automatically.
   */
  readonly valuesChange = output<PhoneNumberMap>();

  /** Local UI state for the "add new" input field - not part of form model */
  readonly newPhoneNumber = signal('');

  /** Adds the new phone number and emits structural change to parent */
  addPhoneNumber(): void {
    const newValue = this.newPhoneNumber().trim();
    if (!newValue) return;

    const phoneNumbers = [...Object.values(this.values()), newValue];
    const newValues = arrayToObject(phoneNumbers);
    this.newPhoneNumber.set('');
    this.valuesChange.emit(newValues);
  }

  /** Removes a phone number and emits structural change to parent */
  removePhoneNumber(key: string): void {
    const phonenumbers = Object.values(this.values()).filter(
      (_, index) => index !== Number(key)
    );
    const newValues = arrayToObject(phonenumbers);
    this.valuesChange.emit(newValues);
  }

  /** Updates the local new phone number input (local UI state only) */
  onNewPhoneNumberChange(value: string): void {
    this.newPhoneNumber.set(value);
  }
}
