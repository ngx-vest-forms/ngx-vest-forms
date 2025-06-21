import { Component, signal } from '@angular/core';
import { injectNgxRootFormKey, ngxVestForms } from 'ngx-vest-forms';
import { PhoneNumbersComponent } from '../ui/phone-numbers/phone-numbers.component';
import { createPhoneNumbersValidationSuite } from './phone-numbers-form.validations';

@Component({
  selector: 'ngx-phone-numbers-form',
  standalone: true,
  imports: [ngxVestForms, PhoneNumbersComponent],
  templateUrl: './phone-numbers-form.component.html',
})
export class PhoneNumbersFormComponent {
  // Inject the root form key using DI
  protected readonly rootFormKey = injectNgxRootFormKey();

  // Create the validation suite with the injected root form key
  protected readonly suite = createPhoneNumbersValidationSuite(
    this.rootFormKey,
  );

  // Provide a reactive signal for initial form values.
  // Use an empty object for phoneNumbers to match the expected type for ngx-phone-numbers.
  protected readonly initialValue = signal({ phoneNumbers: {} });

  // Called on form submit. The form directive handles validation and error display.
  save(): void {
    alert('Phone numbers saved!');
  }
}
