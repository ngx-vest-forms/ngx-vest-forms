import { Directive } from '@angular/core';
import { NgxFormCoreDirective } from 'ngx-vest-forms/core';
import { NgxSchemaValidationDirective } from './schema-validation.directive';

/**
 * Convenience directive that composes core + schema validation on a single form.
 *
 * Usage:
 *  - Import NgxVestFormWithSchemaDirective in your component
 *  - Use <form ngxVestFormWithSchema [vestSuite]="..." [formSchema]="..." [(formValue)]="..."> ... </form>
 *
 * Notes:
 *  - This avoids having to import both directives separately.
 *  - If you already use ngxVestForm/ngxVestFormCore and attach [formSchema], prefer importing
 *    NgxSchemaValidationDirective directly. Do NOT apply both this wrapper and ngxVestForm on the same form.
 */
@Directive({
  selector: 'form[ngxVestFormWithSchema]',
  exportAs: 'ngxVestFormWithSchema',
  hostDirectives: [
    {
      directive: NgxFormCoreDirective,
      inputs: ['formValue', 'vestSuite', 'validationOptions'],
      outputs: ['formValueChange'],
    },
    {
      directive: NgxSchemaValidationDirective,
      inputs: ['formSchema'],
    },
  ],
})
export class NgxVestFormWithSchemaDirective {
  // Expose a no-op flag to satisfy strict linters about empty classes
  readonly composed = true as const;
}
