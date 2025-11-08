import {
  Component,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import {
  arrayToObject,
  vestForms,
  vestFormsViewProviders,
} from 'ngx-vest-forms';

@Component({
  selector: 'sc-phonenumbers',
  imports: [vestForms, KeyValuePipe],
  templateUrl: './phonenumbers.component.html',
  styleUrls: ['./phonenumbers.component.scss'],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhonenumbersComponent {
  values = input<{ [key: string]: string }>({});
  addValue = signal('');

  addPhonenumber(): void {
    const phoneNumbers = [...Object.values(this.values()), this.addValue()];
    // Note: This mutates the input, which requires the parent to handle updates
    // In a real app, consider emitting an event instead
    const newValues = arrayToObject(phoneNumbers);
    this.addValue.set('');
  }

  removePhonenumber(key: string): void {
    const phonenumbers = Object.values(this.values()).filter(
      (v, index) => index !== Number(key)
    );
    // Note: This mutates the input, which requires the parent to handle updates
    // In a real app, consider emitting an event instead
    const newValues = arrayToObject(phonenumbers);
    this.values.set(newValues);
  }
}
