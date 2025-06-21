import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgModelGroup } from '@angular/forms';
import {
  NgxDeepPartial,
  ngxVestForms,
  ngxVestFormsViewProviders,
} from 'ngx-vest-forms';
import {
  BusinessHoursData,
  PartialBusinessHour,
} from '../../02-standard-forms/business-hours-form/business-hours-form.model';
import { BusinessHourComponent } from '../business-hour/business-hour.component';

@Component({
  selector: 'ngx-business-hours',
  imports: [ngxVestForms, KeyValuePipe, BusinessHourComponent],
  templateUrl: './business-hours.component.html',
  styleUrls: ['./business-hours.component.scss'],
  viewProviders: [ngxVestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursComponent {
  readonly businessHoursModel = input<NgxDeepPartial<BusinessHoursData>>({});
  readonly add = output<PartialBusinessHour | undefined>();
  readonly remove = output<string>();

  addBusinessHour(group: NgModelGroup): void {
    const model = this.businessHoursModel();
    this.add.emit(model?.addValue);
    group.control.reset({}, { emitEvent: false });
    group.control.markAsUntouched();
  }

  removeBusinessHour(key: string): void {
    this.remove.emit(key);
  }
}
