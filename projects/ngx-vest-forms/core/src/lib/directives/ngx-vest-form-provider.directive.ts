/**
 * Auto-provider directive for Vest forms
 *
 * This directive automatically provides the form instance to child directives,
 * eliminating the need for manual viewProviders configuration.
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <!-- Automatically provides form to auto-touch and auto-aria directives -->
 *     <form [ngxVestFormProvider]="form">
 *       <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
 *     </form>
 *   `
 * })
 * export class MyFormComponent {
 *   readonly form = createVestForm(...);
 * }
 * ```
 */
import { Directive, input, type OnInit } from '@angular/core';
import { NGX_VEST_FORM } from '../tokens';
import type { VestForm } from '../vest-form.types';

@Directive({
  selector: '[ngxVestFormProvider]',

  providers: [
    {
      provide: NGX_VEST_FORM,
      useFactory: (directive: NgxVestFormProviderDirective) => directive,
      deps: [NgxVestFormProviderDirective],
    },
  ],
})
export class NgxVestFormProviderDirective implements OnInit {
  /**
   * The form instance to provide to child directives.
   *
   * Use this input to bind your createVestForm instance, making it available
   * to all NgxVestAutoTouch and NgxVestAutoAria directives in the template.
   */
  readonly ngxVestFormProvider =
    input.required<VestForm<Record<string, unknown>>>();

  ngOnInit() {
    if (!this.ngxVestFormProvider()) {
      throw new Error(
        '[ngxVestFormProvider] requires a form instance. ' +
          'Did you forget to bind it? Usage: <form [ngxVestFormProvider]="form">',
      );
    }
  }

  /**
   * Get the form instance from the input signal.
   * This method is used by child directives to access the form.
   */
  getForm(): VestForm<Record<string, unknown>> {
    return this.ngxVestFormProvider();
  }
}
