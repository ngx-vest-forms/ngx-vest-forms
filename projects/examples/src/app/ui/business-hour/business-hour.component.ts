import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgxMaskDirective } from 'ngx-mask';
import { ngxVestForms, ngxVestFormsViewProviders } from 'ngx-vest-forms';
import { PartialBusinessHour } from '../../business-hours-form/business-hours-form.model';

@Component({
  selector: 'ngx-business-hour',
  imports: [ngxVestForms, NgxMaskDirective],
  templateUrl: './business-hour.component.html',
  styleUrls: ['./business-hour.component.scss'],
  viewProviders: [ngxVestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHourComponent {
  readonly businessHour = input<PartialBusinessHour>({});
}
