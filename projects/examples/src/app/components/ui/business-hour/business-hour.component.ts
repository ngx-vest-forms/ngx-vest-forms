import { Component, Input } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { BusinessHourFormModel } from '../../../models/business-hours-form.model';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'sc-business-hour',
  imports: [CommonModule, vestForms, NgxMaskDirective],
  templateUrl: './business-hour.component.html',
  styleUrls: ['./business-hour.component.scss'],
  viewProviders: [vestFormsViewProviders],
})
export class BusinessHourComponent {
  @Input() public businessHour?: BusinessHourFormModel = {};
}
