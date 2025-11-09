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
  vestForms,
  vestFormsViewProviders,
} from 'ngx-vest-forms';
import type { PhoneNumberMap } from '../../../models/phonenumber.model';

@Component({
  selector: 'sc-phonenumbers',
  imports: [vestForms, KeyValuePipe],
  templateUrl: './phonenumbers.component.html',
  styleUrls: ['./phonenumbers.component.scss'],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhonenumbersComponent {
  values = input<PhoneNumberMap>({});
  valuesChange = output<PhoneNumberMap>();
  addValue = signal('');

  addPhonenumber(): void {
    const phoneNumbers = [...Object.values(this.values()), this.addValue()];
    const newValues = arrayToObject(phoneNumbers);
    this.addValue.set('');
    this.valuesChange.emit(newValues);
  }

  removePhonenumber(key: string): void {
    const phonenumbers = Object.values(this.values()).filter(
      (v, index) => index !== Number(key)
    );
    const newValues = arrayToObject(phonenumbers);
    this.valuesChange.emit(newValues);
  }
}
