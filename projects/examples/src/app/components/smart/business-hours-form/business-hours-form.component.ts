import { JsonPipe } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import {
  ROOT_FORM,
  ValidateRootFormDirective,
  vestForms,
} from 'ngx-vest-forms';
import {
  BusinessHoursFormModel,
  businessHoursFormShape,
} from '../../../models/business-hours-form.model';
import { businessHoursSuite } from '../../../validations/business-hours.validations';
import { BusinessHoursComponent } from '../../ui/business-hours/business-hours.component';

@Component({
  selector: 'sc-business-hours-form',
  imports: [
    JsonPipe,
    vestForms,
    ValidateRootFormDirective,
    BusinessHoursComponent,
  ],
  templateUrl: './business-hours-form.component.html',
  styleUrls: ['./business-hours-form.component.scss'],
  providers: [{ provide: ROOT_FORM, useValue: 'businessHoursRootForm' }],
})
export class BusinessHoursFormComponent {
  protected readonly formValue = signal<BusinessHoursFormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly suite = businessHoursSuite;
  protected readonly shape = businessHoursFormShape;
  protected readonly ROOT_FORM = Inject(ROOT_FORM);
}
