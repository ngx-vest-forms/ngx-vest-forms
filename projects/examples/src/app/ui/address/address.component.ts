import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { NgxVestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { AddressModel } from '../../models/address.model';

let nextAddressInstanceId = 0;

@Component({
  selector: 'ngx-address',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressComponent {
  private readonly defaultIdPrefix = `ngx-address-${nextAddressInstanceId++}`;

  /**
   * Optional prefix used to generate unique `id`/`for` pairs for the inputs.
   * Useful when multiple address forms are rendered on the same page.
   */
  readonly idPrefix = input<string>(this.defaultIdPrefix);

  address = input<AddressModel>();

  protected readonly idFor = (field: string) => `${this.idPrefix()}-${field}`;

  protected readonly fieldIds = computed(() => ({
    street: this.idFor('street'),
    number: this.idFor('number'),
    city: this.idFor('city'),
    zipcode: this.idFor('zipcode'),
    country: this.idFor('country'),
  }));
}
