import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PhoneNumbersComponent } from '../../ui/phone-numbers/phone-numbers.component';

@Component({
  selector: 'ngx-phone-numbers-form',
  imports: [PhoneNumbersComponent],
  templateUrl: './phone-numbers-form.component.html',
})
export class PhoneNumbersFormComponent {
  #title = inject(Title);

  constructor() {
    this.#title.setTitle('Phone Numbers Form');
  }

  save(): void {
    alert('Phone numbers saved!');
  }
}
