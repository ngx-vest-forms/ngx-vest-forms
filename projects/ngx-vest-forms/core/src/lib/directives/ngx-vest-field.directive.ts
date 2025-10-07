/**
 * Field-level directive that provides field context to auto-touch and auto-aria directives
 *
 * This directive allows auto-directives to work WITHOUT any component-level provider
 * by binding the field directly on the input element.
 *
 * @example
 * ```typescript
 * @Component({
 *   imports: [NgxVestForms],
 *   /// ✅ NO viewProviders needed!
 *   template: `
 *     <form>
 *       <!-- Option 1: Explicit field binding -->
 *       <input
 *         [ngxVestField]="form.emailField()"
 *         [value]="form.email()"
 *         (input)="form.setEmail($event)"
 *       />
 *
 *       <!-- Option 2: Auto-extract from value binding (if possible) -->
 *       <input
 *         [value]="form.email()"
 *         (input)="form.setEmail($event)"
 *       />
 *     </form>
 *   `
 * })
 * ```
 */
import { Directive, input } from '@angular/core';
import { NGX_VEST_FIELD } from '../tokens';
import type { VestField } from '../vest-form.types';

@Directive({
  selector: '[ngxVestField]',
  providers: [
    {
      provide: NGX_VEST_FIELD,
      useFactory: (directive: NgxVestFieldDirective) =>
        directive.ngxVestField(),
      deps: [NgxVestFieldDirective],
    },
  ],
})
export class NgxVestFieldDirective {
  /**
   * The field instance to provide to child directives.
   */
  readonly ngxVestField = input.required<VestField<unknown>>();
}
