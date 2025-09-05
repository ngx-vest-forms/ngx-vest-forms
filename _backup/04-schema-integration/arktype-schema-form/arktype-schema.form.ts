import { Component, signal } from '@angular/core';
import { type } from 'arktype';
import { fromArkType, type NgxRuntimeSchema } from 'ngx-vest-forms/schemas';
import { SchemaFormComponent } from '../schema-form/schema-form.component';

export const arktypeUserProfileSchema = type({
  firstName: 'string',
  lastName: 'string',
  email: 'string',
  dateOfBirth: 'string',
  newsletter: 'boolean',
  notificationsEmail: 'boolean',
  notificationsSms: 'boolean',
  bio: 'string',
});

export type ArkTypeUserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  newsletter: boolean;
  notificationsEmail: boolean;
  notificationsSms: boolean;
  bio: string;
};

@Component({
  selector: 'ngx-arktype-schema-form',

  imports: [SchemaFormComponent],
  template: `
    <section class="prose mb-4 max-w-none">
      <h2>ArkType Schema Form</h2>
      <p>
        Purpose: Demonstrate using ArkType for type safety with ngx-vest-forms
        runtime schema adapters and a shared Vest suite.
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
      [title]="'ArkType Schema Form'"
      [description]="description"
      [infoBlock]="infoBlock"
    />
  `,
})
export class ArkTypeSchemaFormComponent {
  protected readonly formValue = signal<ArkTypeUserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    newsletter: false,
    notificationsEmail: true,
    notificationsSms: false,
    bio: '',
  });

  protected readonly runtimeSchema: NgxRuntimeSchema<ArkTypeUserProfile> =
    fromArkType<ArkTypeUserProfile>(
      arktypeUserProfileSchema as unknown as (
        data: unknown,
      ) => ArkTypeUserProfile | { summary?: string },
    );

  protected readonly description = 'ArkType schema adapter example.';
  protected readonly infoBlock =
    'ArkType schema adapter used for type inference and developer docs.';
}
