/**
 * Convenience directive that applies all Vest form directives at once.
 *
 * This directive uses Angular's hostDirectives to automatically apply:
 * - NgxVestFormProviderDirective (DI for child directives)
 * - NgxVestAutoAriaDirective (accessible error states)
 * - NgxVestAutoTouchDirective (touch state management)
 * - NgxVestFormBusyDirective (aria-busy during async validation)
 * - **Auto-preventDefault** on form submit (prevents page reload)
 *
 * **When to use:**
 * - Quick form setup with all features
 * - Consistent behavior across forms
 * - Examples and demos
 *
 * **When NOT to use:**
 * - Need granular control over which directives apply
 * - Custom touch/aria behavior required
 * - Performance-sensitive forms (use individual directives)
 *
 * @example Basic usage
 * ```typescript
 * @Component({
 *   template: `
 *     <form [ngxVestForm]="form" (submit)="save()">
 *       <!-- ✅ preventDefault() called automatically -->
 *       <input
 *         id="email"
 *         [value]="form.email()"
 *         (input)="form.setEmail($event)"
 *       />
 *     </form>
 *   `
 * })
 * export class MyFormComponent {
 *   readonly form = createVestForm(emailSuite, signal({ email: '' }));
 *
 *   async save() {
 *     // ✅ No need for event.preventDefault() - handled by directive
 *     const result = await this.form.submit();
 *     if (result.valid) {
 *       await this.api.save(result.data);
 *     }
 *   }
 * }
 * ```
 *
 * @example Granular control (use individual directives instead)
 * ```typescript
 * @Component({
 *   template: `
 *     <form
 *       [ngxVestFormProvider]="form"
 *       ngxVestAutoAria
 *       ngxVestFormBusy
 *     >
 *       <!-- Skip ngxVestAutoTouch for manual touch control -->
 *       <input
 *         id="email"
 *         [value]="form.email()"
 *         (input)="form.setEmail($event)"
 *         (blur)="form.touchEmail()"
 *       />
 *     </form>
 *   `
 * })
 * export class MyFormComponent {
 *   readonly form = createVestForm(emailSuite, signal({ email: '' }));
 * }
 * ```
 */
import { Directive, input } from '@angular/core';
import type { VestForm } from '../vest-form.types';
import { NgxVestFormProviderDirective } from './ngx-vest-form-provider.directive';

@Directive({
  selector: 'form[ngxVestForm]',
  host: {
    '(submit)': 'preventDefaultSubmit($event)',
  },
  hostDirectives: [
    {
      directive: NgxVestFormProviderDirective,
      inputs: ['ngxVestFormProvider: ngxVestForm'],
    },
    // Note: NgxVestAutoAriaDirective, NgxVestAutoTouchDirective, and NgxVestFormBusyDirective
    // are NOT included here because they have selectors that target child elements (input/textarea/select)
    // or should be applied to the form element separately. Instead, import them via NgxVestForms array.
  ],
})
export class NgxVestFormDirective {
  /**
   * The form instance to provide to child directives.
   *
   * This input is automatically forwarded to NgxVestFormProviderDirective
   * via the hostDirectives input mapping above.
   */
  readonly ngxVestForm = input.required<VestForm<Record<string, unknown>>>();

  /**
   * Automatically prevents the default form submission behavior.
   * This prevents page reload when the form is submitted.
   *
   * **Why this is needed:**
   * - ngx-vest-forms uses native (submit) events, NOT (ngSubmit)
   * - Native (submit) does NOT auto-prevent default (unlike Angular Forms' (ngSubmit))
   * - Without preventDefault(), the browser performs a full page reload
   *
   * **How it works:**
   * - This method is called via host binding BEFORE your (submit) handler
   * - Your submit handler in the component still executes normally
   * - No naming conflicts with component methods (this is protected)
   *
   * @internal This method is called by Angular's host binding system
   */
  protected preventDefaultSubmit(event: SubmitEvent): void {
    event.preventDefault();
  }
}
