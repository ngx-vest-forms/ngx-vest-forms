import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgModelGroup } from '@angular/forms';
import { DeepPartial, vestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import {
  BusinessHoursData,
  PartialBusinessHour,
} from '../../business-hours-form/business-hours-form.model';
import { BusinessHourComponent } from '../business-hour/business-hour.component';

@Component({
  selector: 'sc-business-hours',
  imports: [vestForms, KeyValuePipe, BusinessHourComponent],
  templateUrl: './business-hours.component.html',
  styleUrls: ['./business-hours.component.scss'],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursComponent {
  readonly businessHoursModel = input<DeepPartial<BusinessHoursData>>({});
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
