import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormErrorDisplayDirective } from '../../directives/form-error-display.directive';

/**
 * Accessible ScControlWrapper
 *
 * Usage:
 *   - Wrap any form element with `sc-control-wrapper` or `[scControlWrapper]` (or `[sc-control-wrapper]` for legacy) that contains an `ngModel` or `ngModelGroup`.
 *   - Errors and warnings are shown when the control is invalid and touched, after form submit, or both, depending on the error display mode.
 *   - Pending state is shown with a spinner and aria-busy when async validation is running.
 *   - No manual error/warning/pending signal management is needed in your form components.
 *
 * Error & Warning Display Behavior:
 *   - The error display mode can be configured globally using the SC_ERROR_DISPLAY_MODE_TOKEN injection token (import from core), or per instance using the `errorDisplayMode` input on FormErrorDisplayDirective (which this component uses as a hostDirective).
 *   - Possible values: 'on-blur' | 'on-submit' | 'on-blur-or-submit' (default: 'on-blur-or-submit')
 *
 * Example (per instance):
 *   <div ngxControlWrapper>
 *     <label>
 *       <span>First name</span>
 *       <input type="text" name="firstName" [ngModel]="formValue().firstName" />
 *     </label>
 *   </div>
 *   /// To customize errorDisplayMode for this instance, use the errorDisplayMode input.
 *
 * Example (with warnings and pending):
 *   <sc-control-wrapper>
 *     <input name="username" ngModel />
 *   </sc-control-wrapper>
 *   /// If async validation is running, a spinner and 'Validating…' will be shown.
 *   /// If Vest warnings are present, they will be shown below errors.
 *
 * Example (global config):
 *   import { provide } from '@angular/core';
 *   import { SC_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';
 *   @Component({
 *     providers: [
 *       provide(SC_ERROR_DISPLAY_MODE_TOKEN, { useValue: 'submit' })
 *     ]
 *   })
 *   export class MyComponent {}
 *
 * Best Practices:
 *   - Use for every input or group in your forms.
 *   - Do not manually display errors for individual fields; rely on this wrapper.
 */
@Component({
  selector: 'sc-control-wrapper, [scControlWrapper], [sc-control-wrapper]',
  templateUrl: './control-wrapper.component.html',
  styleUrls: ['./control-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sc-control-wrapper',
    '[class.sc-control-wrapper--invalid]': 'errorDisplay.shouldShowErrors()',
    '[attr.aria-busy]': "errorDisplay.isPending() ? 'true' : null",
  },
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode'],
    },
  ],
})
export class ControlWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
