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

@Component({
  selector: 'ngx-phonenumbers',
  imports: [NgxVestForms, KeyValuePipe],
  templateUrl: './phonenumbers.component.html',
  styleUrls: ['./phonenumbers.component.scss'],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneNumbersComponent {
  values = input<PhoneNumberMap>({});
  valuesChange = output<PhoneNumberMap>();
  
  /** Holds the user's input for a new phone number */
  addValue = signal('');

  addPhoneNumber(): void {
    const phoneNumbers = [...Object.values(this.values()), this.addValue()];
    const newValues = arrayToObject(phoneNumbers);
    this.addValue.set('');
    this.valuesChange.emit(newValues);
  }

  removePhoneNumber(key: string): void {
    const phonenumbers = Object.values(this.values()).filter(
      (v, index) => index !== Number(key)
    );
    const newValues = arrayToObject(phonenumbers);
    this.valuesChange.emit(newValues);
  }
}
