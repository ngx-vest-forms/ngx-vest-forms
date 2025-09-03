import { Component, Input } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import {
  arrayToObject,
  DeepPartial,
  vestForms,
  vestFormsViewProviders,
} from 'ngx-vest-forms';
import { BusinessHourFormModel } from '../../../models/business-hours-form.model';
import { BusinessHourComponent } from '../business-hour/business-hour.component';
import { NgModelGroup } from '@angular/forms';

@Component({
    selector: 'sc-business-hours',
    imports: [CommonModule, vestForms, KeyValuePipe, BusinessHourComponent],
    templateUrl: './business-hours.component.html',
    styleUrls: ['./business-hours.component.scss'],
    viewProviders: [vestFormsViewProviders]
})
export class BusinessHoursComponent {
  @Input() public businessHoursModel?: DeepPartial<{
    addValue: BusinessHourFormModel;
    values: {
      [key: string]: BusinessHourFormModel;
    };
  }> = {};

  public addBusinessHour(group: NgModelGroup): void {
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

  public removeBusinessHour(key: string): void {
    if (!this.businessHoursModel?.values) {
      return;
    }
    const businessHours = Object.values(this.businessHoursModel.values).filter(
      (v, index) => index !== Number(key)
    );
    this.businessHoursModel.values = arrayToObject(businessHours);
  }
}
