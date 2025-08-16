import { JsonPipe } from '@angular/common';
import { Component, input, model, viewChild } from '@angular/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
// Use main entry (re-export) to avoid deep path that may not exist pre-build
import { ngxVestForms } from 'ngx-vest-forms';
import type { NgxRuntimeSchema } from 'ngx-vest-forms/schemas';
import { NgxVestFormWithSchemaDirective } from 'ngx-vest-forms/schemas';
import type { SchemaFormModel } from './schema-form.validations';
import { schemaFormSuite } from './schema-form.validations';

@Component({
  selector: 'ngx-schema-form',
  styleUrls: ['./schema-form.component.scss'],
  templateUrl: './schema-form.component.html',
  imports: [
    ngxVestForms,
    NgxVestFormWithSchemaDirective,
    NgxControlWrapper,
    JsonPipe,
  ],
})
export class SchemaFormComponent {
  // Access the wrapper directive instance via template ref `#vestForm="ngxVestForm"`
  readonly vestForm = viewChild<NgxVestFormWithSchemaDirective>('vestForm');
  // Schema is passed through to the underlying directive; validation happens automatically on submit.
  formSchema = input<NgxRuntimeSchema<SchemaFormModel> | null>(null);
  // Two-way bound form data model.
  formValue = model<SchemaFormModel>({});
  title = input('');
  description = input('');
  infoBlock = input<string | null>(null);

  /**
   * Vest validation suite for field-level and schema validation.
   */
  protected readonly suite = schemaFormSuite;

  /**
   * SECURITY: infoBlock HTML is inserted with [innerHTML]. Only allow static, trusted
   * framework-owned content. Do NOT pass user-provided strings without sanitizing first.
   */

  protected save(): void {
    // Guard: only show success when Vest + schema validation both succeed.
    // (The directive already ran schema safeParse during submit.)
    const state = this.vestForm()?.formState();
    if (state && (!state.valid || state.schema?.success === false)) return; // Do not alert on invalid submit
    alert('Profile submitted');
  }
}
