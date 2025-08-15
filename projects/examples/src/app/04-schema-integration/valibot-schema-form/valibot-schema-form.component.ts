import { Component, signal } from '@angular/core';
import { fromValibot, type NgxRuntimeSchema } from 'ngx-vest-forms/schemas';
import * as v from 'valibot';
import { SchemaFormComponent } from '../schema-form/schema-form.component';

// Valibot schema - ONLY for type inference and preventing type errors in templates
// NO validation logic should be here - that's handled by Vest.js
export const valibotUserProfileSchema = v.object({
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(),
  dateOfBirth: v.string(),
  newsletter: v.boolean(),
  notificationsEmail: v.boolean(),
  notificationsSms: v.boolean(),
  bio: v.string(),
});

export type ValibotUserProfile = v.InferOutput<typeof valibotUserProfileSchema>;

@Component({
  selector: 'ngx-valibot-schema-form',
  standalone: true,
  imports: [SchemaFormComponent],
  template: `
    <section class="prose mb-4 max-w-none">
      <h2>Valibot Schema Form</h2>
      <p>
        Purpose: Demonstrate using Valibot for type safety with ngx-vest-forms
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
      [title]="'Valibot Schema Form'"
      [description]="description"
      [infoBlock]="infoBlock"
    />
  `,
})
export class ValibotSchemaFormComponent {
  protected readonly formValue = signal<ValibotUserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    newsletter: false,
    notificationsEmail: true,
    notificationsSms: false,
    bio: '',
  });
  // Wrap Valibot schema with safeParse facade expected by adapter (method form)
  private readonly valibotWrapper = {
    safeParse: (data: unknown) => v.safeParse(valibotUserProfileSchema, data),
  } as const;
  protected readonly runtimeSchema: NgxRuntimeSchema<ValibotUserProfile> =
    fromValibot<ValibotUserProfile>(this.valibotWrapper);

  protected readonly description =
    'This example demonstrates <strong>Valibot schema for type safety</strong> and a <strong>shared Vest.js validation suite</strong> for all schema forms.';
  protected readonly infoBlock = `
    <ul class="info-box-list">
      <li>Type inference and compile-time safety from Valibot schema</li>
      <li>Vest.js: All validation logic (field-level, cross-field, async)</li>
      <li>Prevents type errors in templates (name attributes, ngModelGroup)</li>
      <li>Separation of concerns: types (Valibot) vs validation (Vest.js)</li>
      <li>Best for complex forms requiring both type safety and flexible validation</li>
      <li>For deep runtime validation, use Valibot on submit or API calls</li>
    </ul>
  `;
}
