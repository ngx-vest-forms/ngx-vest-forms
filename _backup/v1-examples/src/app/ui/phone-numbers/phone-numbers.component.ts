import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { arrayToObject, ngxVestForms } from 'ngx-vest-forms/core';
import {
  PhoneNumberModel,
  initialPhoneNumberState,
} from './phone-number.model';
import { PHONE_NUMBER_REGEX } from './phone-number.utils';
import { phoneNumberValidations } from './phone-number.validations';

@Component({
  selector: 'ngx-phone-numbers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ngxVestForms, NgxControlWrapper, KeyValuePipe],
  templateUrl: './phone-numbers.component.html',
  styleUrls: ['./phone-numbers.component.scss'],
})
export class PhoneNumbersComponent {
  // Model signal for the form data
  protected readonly model = signal<PhoneNumberModel>({
    ...initialPhoneNumberState,
  });

  // Vest suite for validation
  protected readonly suite = phoneNumberValidations;

  // Computed values for template
  protected readonly phoneNumbersList = computed(() => {
    const values = this.model().values || {};
    return values as Record<string, string>;
  });

  protected readonly phoneNumbersCount = computed(() => {
    return Object.keys(this.phoneNumbersList()).length;
  });

  // Adds a new phone number to the list and clears the input
  addPhoneNumber(): void {
    const { addValue, values = {} } = this.model();
    const newPhoneNumber = addValue?.trim();

    if (!newPhoneNumber) {
      return;
    }

    // Guard: basic format validation (mirror of suite regex)
    // Accept digits, spaces, hyphens and parentheses, optional leading plus
    const formatOk = PHONE_NUMBER_REGEX.test(newPhoneNumber);
    if (!formatOk) {
      return; // Do not add invalid phone numbers
    }

    // Guard: prevent duplicates
    const existing = Object.values(values).filter(Boolean) as string[];
    if (existing.includes(newPhoneNumber)) {
      return; // Do not add duplicates
    }

    // Use Object.values() directly and filter out empty values in one go
    const phoneNumbers = [...existing, newPhoneNumber];

    this.model.update((current) => ({
      ...current,
      values: arrayToObject(phoneNumbers),
      addValue: '',
    }));
  }

  // Handle keyboard events for accessibility (Enter key support)
  onKeyDown(event: KeyboardEvent): void {
    // Add phone number when Enter key is pressed
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission
      this.addPhoneNumber();
    }
  }

  // Removes a phone number by its key
  removePhoneNumber(key: string): void {
    this.model.update((current) => {
      // Use Object.entries() with filter and map for cleaner conversion
      const phoneNumbers = Object.entries(current.values || {})
        .filter(([k]) => k !== key)
        .map(([, value]) => value)
        .filter(Boolean);

      return {
        ...current,
        values: arrayToObject(phoneNumbers),
      };
    });
  }
}
