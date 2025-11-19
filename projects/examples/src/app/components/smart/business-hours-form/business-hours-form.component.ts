import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NgxVestForms,
  ROOT_FORM,
  ValidateRootFormDirective,
} from 'ngx-vest-forms';
import {
  BusinessHoursFormModel,
  businessHoursFormShape,
} from '../../../models/business-hours-form.model';
import { businessHoursSuite } from '../../../validations/business-hours.validations';
import { BusinessHoursComponent } from '../../ui/business-hours/business-hours.component';

@Component({
  selector: 'ngx-business-hours-form',
  imports: [
    JsonPipe,
    NgxVestForms,
    ValidateRootFormDirective,
    BusinessHoursComponent,
  ],
  templateUrl: './business-hours-form.component.html',
  styleUrls: ['./business-hours-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursFormComponent {
  protected readonly formValue = signal<BusinessHoursFormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly businessHoursSuite = businessHoursSuite;
  protected readonly shape = businessHoursFormShape;
  protected readonly ROOT_FORM = ROOT_FORM;
}
