import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxVestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { BusinessHourFormModel } from '../../../../models/business-hours-form.model';

@Component({
  selector: 'ngx-business-hour',
  imports: [NgxVestForms, NgxMaskDirective],
  templateUrl: './business-hour.component.html',
  styleUrls: ['./business-hour.component.scss'],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHourComponent {
  private static nextInstanceId = 0;
  private readonly instanceId = BusinessHourComponent.nextInstanceId++;

  readonly businessHour = input<BusinessHourFormModel | undefined>({});

  /**
   * Used to generate unique input ids so labels remain correctly associated.
   * If not provided, a unique per-instance prefix is used.
   */
  readonly idPrefix = input<string>(`business-hour-${this.instanceId}`);
}
