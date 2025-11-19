import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { NgxVestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { AddressModel } from '../../../models/address.model';

@Component({
  selector: 'ngx-address',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressComponent {
  address = input<AddressModel>();
}
