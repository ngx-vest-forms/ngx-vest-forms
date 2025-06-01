import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormErrorDisplayDirective } from '../../directives/form-error-display.directive';

/**
 * Accessible ControlWrapperComponent
 *
 * Usage:
 *   - Wrap any form element with `sc-control-wrapper` that contains an `ngModel` or `ngModelGroup`.
 *   - Errors and warnings are shown when the control is invalid and touched, after form submit, or both, depending on the error display mode.
 *   - Pending state is shown with a spinner and aria-busy when async validation is running.
 *   - No manual error/warning/pending signal management is needed in your form components.
 *
 * Error & Warning Display Behavior:
 *   - The error display mode can be configured globally using the CONTROL_WRAPPER_ERROR_DISPLAY injection token,
 *     or per instance using the `errorDisplayMode` input.
 *   - Possible values: 'touch' | 'submit' | 'touchOrSubmit' (default: 'touchOrSubmit')
 *
 * Example (per instance):
 *   <div scControlWrapper errorDisplayMode="submit">
 *     <label>
 *       <span>First name</span>
 *       <input type="text" name="firstName" [ngModel]="formValue().firstName" />
 *     </label>
 *   </div>
 *
 * Example (with warnings and pending):
 *   <sc-control-wrapper>
 *     <input name="username" ngModel />
 *   </sc-control-wrapper>
 *   <!-- If async validation is running, a spinner and 'Validating…' will be shown. -->
 *   <!-- If Vest warnings are present, they will be shown below errors. -->
 *
 * Example (global config):
 *   import { provide } from '@angular/core';
 *   import { CONTROL_WRAPPER_ERROR_DISPLAY } from 'ngx-vest-forms';
 *
 *   @Component({
 *     providers: [
 *       provide(CONTROL_WRAPPER_ERROR_DISPLAY, { useValue: 'submit' })
 *     ]
 *   })
 *   export class MyComponent {}
 *
 * Best Practices:
 *   - Use for every input or group in your forms.
 *   - Do not manually display errors for individual fields; rely on this wrapper.
 */
@Component({
  selector: 'sc-control-wrapper, [sc-control-wrapper], [scControlWrapper]',
  templateUrl: './control-wrapper.component.html',
  styleUrls: ['./control-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sc-control-wrapper',
    ['class.sc-control-wrapper--invalid']: 'errorDisplay.shouldShowErrors()',
  },
  hostDirectives: [FormErrorDisplayDirective],
})
export class ControlWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective);
}
