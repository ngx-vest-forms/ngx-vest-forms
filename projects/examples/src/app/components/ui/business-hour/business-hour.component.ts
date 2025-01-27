import { Component, Input } from '@angular/core';
import { NgxMaskDirective } from 'ngx-mask';
import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { BusinessHourFormModel } from '../../../models/business-hours-form.model';

@Component({
  selector: 'sc-business-hour',
  imports: [vestForms, NgxMaskDirective],
  templateUrl: './business-hour.component.html',
  styleUrls: ['./business-hour.component.scss'],
  viewProviders: [vestFormsViewProviders],
})
export class BusinessHourComponent {
  @Input() public businessHour?: BusinessHourFormModel = {};
}
