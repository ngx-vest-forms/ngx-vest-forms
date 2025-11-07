import { Component, input, ChangeDetectionStrategy } from '@angular/core';

import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { AddressModel } from '../../../models/address.model';

@Component({
  selector: 'sc-address',
  imports: [vestForms],
  viewProviders: [vestFormsViewProviders],
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressComponent {
  address = input<AddressModel>();
}
