import { KeyValuePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgModelGroup } from '@angular/forms';
import {
  arrayToObject,
  NgxDeepPartial,
  NgxVestForms,
  vestFormsViewProviders,
} from 'ngx-vest-forms';
import { BusinessHourFormModel } from '../../../models/business-hours-form.model';
import { BusinessHourComponent } from '../business-hour/business-hour.component';

@Component({
  selector: 'ngx-business-hours',
  imports: [NgxVestForms, KeyValuePipe, BusinessHourComponent],
  templateUrl: './business-hours.component.html',
  styleUrls: ['./business-hours.component.scss'],
  viewProviders: [vestFormsViewProviders],
})
export class BusinessHoursComponent {
  @Input() businessHoursModel?: NgxDeepPartial<{
    addValue: BusinessHourFormModel;
    values: Record<string, BusinessHourFormModel>;
  }> = {};

  addBusinessHour(group: NgModelGroup): void {
    if (!this.businessHoursModel?.values) {
      return;
    }
    group.control.markAsUntouched();
    this.businessHoursModel.values = arrayToObject([
      ...Object.values(this.businessHoursModel.values),
      this.businessHoursModel.addValue,
    ]);
    this.businessHoursModel.addValue = undefined;
  }

  removeBusinessHour(key: string): void {
    if (!this.businessHoursModel?.values) {
      return;
    }
    const businessHours = Object.values(this.businessHoursModel.values).filter(
      (v, index) => index !== Number(key)
    );
    this.businessHoursModel.values = arrayToObject(businessHours);
  }
}
