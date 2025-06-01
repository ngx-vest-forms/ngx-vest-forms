import { KeyValuePipe } from '@angular/common';
import { Component, model } from '@angular/core';
import {
  arrayToObject,
  vestForms,
  vestFormsViewProviders,
} from 'ngx-vest-forms';

@Component({
  selector: 'sc-phone-numbers',
  imports: [vestForms, KeyValuePipe],
  templateUrl: './phone-numbers.component.html',
  styleUrls: ['./phone-numbers.component.scss'],
  viewProviders: [vestFormsViewProviders],
})
export class PhoneNumbersComponent {
  // Signal for the phone numbers array, enables idiomatic two-way binding with [(values)]
  // Holds the value of the input for adding a new phone number
  // Adds a new phone number to the array and clears the input
  // Removes a phone number by its key
  // Signal for the phone numbers array, enables idiomatic two-way binding with [(values)]
  readonly values = model<Record<string, string | undefined>>({});

  // Holds the value of the input for adding a new phone number
  addValue = '';

  // Adds a new phone number to the array and clears the input
  addPhoneNumber(): void {
    const phoneNumbers = [...Object.values(this.values()), this.addValue];
    this.values.set(arrayToObject(phoneNumbers));
    this.addValue = '';
  }

  // Removes a phone number by its key
  removePhoneNumber(key: string): void {
    const phoneNumbers = Object.values(this.values()).filter(
      (v, index) => index !== Number(key),
    );
    this.values.set(arrayToObject(phoneNumbers));
  }
}
