import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgxMaskDirective } from 'ngx-mask';
import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { PartialBusinessHour } from '../../business-hours-form/business-hours-form.model';

@Component({
  selector: 'sc-business-hour',
  imports: [vestForms, NgxMaskDirective],
  templateUrl: './business-hour.component.html',
  styleUrls: ['./business-hour.component.scss'],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHourComponent {
  readonly businessHour = input<PartialBusinessHour>({});
}
