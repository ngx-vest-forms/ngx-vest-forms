import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ngxVestForms, ngxVestFormsViewProviders } from 'ngx-vest-forms';
import { AddressModel, initialAddressForm } from './address.model';

@Component({
  selector: 'ngx-address',
  imports: [ngxVestForms],
  viewProviders: [ngxVestFormsViewProviders],
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressComponent {
  readonly address = input<AddressModel>({ ...initialAddressForm });
}
