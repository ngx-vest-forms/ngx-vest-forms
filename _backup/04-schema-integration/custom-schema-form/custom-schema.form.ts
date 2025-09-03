import { Component, signal } from '@angular/core';
import {
  ngxModelToStandardSchema,
  toRuntimeSchema,
  type NgxRuntimeSchema,
} from 'ngx-vest-forms/schemas';
import { SchemaFormComponent } from '../schema-form/schema-form.component';
import { schemaFormSuite } from '../schema-form/schema-form.validations';

// Type for the form data
export type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  newsletter: boolean;
  notificationsEmail: boolean;
  notificationsSms: boolean;
  bio: string;
};

// Custom schema using ngxModelToStandardSchema
export const userProfileSchema = ngxModelToStandardSchema({
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  newsletter: false,
  notificationsEmail: true,
  notificationsSms: false,
  bio: '',
});

@Component({
  selector: 'ngx-custom-schema-form',
  imports: [SchemaFormComponent],
  template: `
    <section class="prose mb-4 max-w-none">
      <h2>Custom Schema Form</h2>
      <p>
        Purpose: Demonstrate using ngxModelToStandardSchema to define a schema
        from a model template, combined with a shared Vest suite.
      </p>
      <p class="text-sm">
        See:
        <a
          href="https://github.com/simplifiedcourses/ngx-vest-forms"
          target="_blank"
          >README</a
        >
        · <a href="https://vestjs.dev" target="_blank">Vest Docs</a>
      </p>
    </section>
    <ngx-schema-form
      [formSchema]="runtimeSchema"
      [(formValue)]="formValue"
      [title]="'Custom Schema Form'"
      [description]="description"
      [infoBlock]="infoBlock"
    />
  `,
})
export class CustomSchemaFormComponent {
  protected readonly formValue = signal<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    newsletter: false,
    notificationsEmail: true,
    notificationsSms: false,
    bio: '',
  });
  protected readonly runtimeSchema: NgxRuntimeSchema<UserProfile> =
    toRuntimeSchema(userProfileSchema);

  protected readonly suite = schemaFormSuite;

  protected readonly description = 'Custom schema form example.';
  protected readonly infoBlock =
    'Custom schema adapter used for developer docs.';
}
