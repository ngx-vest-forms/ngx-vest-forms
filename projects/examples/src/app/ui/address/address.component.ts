import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { AddressModel, initialAddressForm } from './address.model';

@Component({
  selector: 'sc-address',
  imports: [vestForms],
  viewProviders: [vestFormsViewProviders],
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressComponent {
  readonly address = input<AddressModel>({ ...initialAddressForm });
}
