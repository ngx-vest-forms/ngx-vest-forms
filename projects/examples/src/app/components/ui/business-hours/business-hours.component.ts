import { KeyValuePipe } from '@angular/common';
import { Component, input } from '@angular/core';
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
  readonly businessHoursModel = input<NgxDeepPartial<{
    addValue: BusinessHourFormModel;
    values: Record<string, BusinessHourFormModel>;
}> | undefined>({});

  addBusinessHour(group: NgModelGroup): void {
    const businessHoursModel = this.businessHoursModel();
    if (!businessHoursModel?.values) {
      return;
    }
    group.control.markAsUntouched();
    businessHoursModel.values = arrayToObject([
      ...Object.values(businessHoursModel.values),
      businessHoursModel.addValue,
    ]);
    businessHoursModel.addValue = undefined;
  }

  removeBusinessHour(key: string): void {
    const businessHoursModel = this.businessHoursModel();
    if (!businessHoursModel?.values) {
      return;
    }
    const businessHours = Object.values(businessHoursModel.values).filter(
      (v, index) => index !== Number(key)
    );
    businessHoursModel.values = arrayToObject(businessHours);
  }
}
