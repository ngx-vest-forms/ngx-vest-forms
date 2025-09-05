import { Component, signal } from '@angular/core';
import { fromZod, type NgxRuntimeSchema } from 'ngx-vest-forms/schemas';
import { z } from 'zod';
import { SchemaFormComponent } from '../schema-form/schema-form.component';

// Zod schema - ONLY for type inference and preventing type errors in templates
// NO validation logic should be here - that's handled by Vest.js
export const zodUserProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  dateOfBirth: z.string(),
  newsletter: z.boolean(),
  notificationsEmail: z.boolean(),
  notificationsSms: z.boolean(),
  bio: z.string(),
});

export type ZodUserProfile = z.infer<typeof zodUserProfileSchema>;

/**
 * ZodSchemaFormComponent
 * Demonstrates Zod schema validation with ngx-vest-forms.
 * Passes schema, vestSuite, and formValue to the generic ngx-schema-form.
 * All props are readonly for safety and clarity.
 */
@Component({
  selector: 'ngx-zod-schema-form',

  imports: [SchemaFormComponent],
  template: `
    <section class="prose mb-4 max-w-none">
      <h2>Zod Schema Form</h2>
      <p>
        Purpose: Demonstrate using Zod for type safety with ngx-vest-forms
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
      [title]="'Zod Schema Form'"
      [description]="description"
      [infoBlock]="infoBlock"
    />
  `,
})
export class ZodSchemaFormComponent {
  /**
   * Signal model for the form, inferred from Zod schema.
   */
  protected readonly formValue = signal<ZodUserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    newsletter: false,
    notificationsEmail: true,
    notificationsSms: false,
    bio: '',
  });
  /**
   * Zod schema for validation and type inference.
   */
  protected readonly runtimeSchema: NgxRuntimeSchema<ZodUserProfile> =
    fromZod<ZodUserProfile>(zodUserProfileSchema);

  /**
   * Description for info block in the form UI.
   */
  protected readonly description = 'Zod schema adapter example.';
  protected readonly infoBlock =
    'Zod schema adapter used for type inference and developer docs.';
}
