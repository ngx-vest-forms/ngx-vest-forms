import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { vestForms } from 'ngx-vest-forms';
import { z } from 'zod';
import { BusinessHoursComponent } from '../ui/business-hours/business-hours.component';

// Define a Zod schema for the business hours form
const businessHoursZodSchema = z.object({
  businessHours: z.record(
    z.object({
      from: z.string().min(1, 'From is required'),
      to: z.string().min(1, 'To is required'),
    }),
  ),
});

type BusinessHoursZodType = z.infer<typeof businessHoursZodSchema>;

@Component({
  selector: 'sc-business-hours-form-zod',
  imports: [JsonPipe, vestForms, BusinessHoursComponent],
  styleUrl: './business-hours-form.component.scss',
  template: `
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800 sm:col-span-2"
    >
      <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Example: form array with complex validations (Zod)
      </h3>
      <p class="mb-2 text-sm text-blue-700 dark:text-blue-300">
        <strong>Note:</strong> This example uses <strong>Zod</strong> for schema
        validation (field types and required fields) and
        <strong>Vest</strong> for business logic validation (such as time order
        and overlap).
      </p>

      <ul class="text-md ml-4 list-disc">
        <li>Always show an error if there is no business hour added</li>
        <li>From field is required</li>
        <li>To field is required</li>
        <li>From field should be valid time</li>
        <li>To field should be valid time</li>
        <li>
          If both from and to fields are valid:
          <ul>
            <li>To field should be later than from field</li>
          </ul>
        </li>
        <li>The same should apply for edit</li>
        <li>
          If more than 1 business hour is added, there should be no overlap
        </li>
      </ul>
    </div>

    <form
      class="mt-8"
      scVestForm
      [formValue]="formValue()"
      [formSchema]="businessHoursZodSchema"
    >
      <fieldset>
        <sc-business-hours
          [businessHoursModel]="formValue().businessHours"
        ></sc-business-hours>
      </fieldset>
    </form>
    <br />
    <h3>The value of the form</h3>
    <pre id="json-data">
      {{ formValue() | json }}
    </pre
    >
  `,
})
export class BusinessHoursFormZodExampleComponent {
  readonly businessHoursZodSchema = businessHoursZodSchema;
  readonly formValue = signal<BusinessHoursZodType>({
    businessHours: {},
  });
}
