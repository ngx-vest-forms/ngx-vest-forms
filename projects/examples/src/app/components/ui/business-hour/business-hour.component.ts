import { Component, input } from '@angular/core';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxVestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { BusinessHourFormModel } from '../../../models/business-hours-form.model';

@Component({
  selector: 'ngx-business-hour',
  imports: [NgxVestForms, NgxMaskDirective],
  templateUrl: './business-hour.component.html',
  styleUrls: ['./business-hour.component.scss'],
  viewProviders: [vestFormsViewProviders],
})
export class BusinessHourComponent {
  readonly businessHour = input<BusinessHourFormModel | undefined>({});
}
