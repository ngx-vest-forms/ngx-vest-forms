import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  ValidateRootFormDirective,
  ROOT_FORM,
  vestForms,
} from 'ngx-vest-forms';
import {
  BusinessHoursFormModel,
  businessHoursFormShape,
} from '../../../models/business-hours-form.model';
import { businessHoursSuite } from '../../../validations/business-hours.validations';
import { BusinessHourComponent } from '../../ui/business-hour/business-hour.component';
import { BusinessHoursComponent } from '../../ui/business-hours/business-hours.component';

@Component({
  selector: 'sc-business-hours-form',
  standalone: true,
  imports: [
    JsonPipe,
    vestForms,
    ValidateRootFormDirective,
    BusinessHoursComponent,
  ],
  templateUrl: './business-hours-form.component.html',
  styleUrls: ['./business-hours-form.component.scss'],
})
export class BusinessHoursFormComponent {
  protected readonly formValue = signal<BusinessHoursFormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly suite = businessHoursSuite;
  protected readonly shape = businessHoursFormShape;
  protected readonly ROOT_FORM = ROOT_FORM;
}
