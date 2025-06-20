import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
// Imports will be updated to point to the core library 'ngx-vest-forms'
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

/**
 * Accessible NgxControlWrapper
 *
 * Usage:
 *   - Wrap any form element with `ngx-control-wrapper` that contains an `ngModel` or `ngModelGroup`.
 *   - Errors and warnings are shown when the control is invalid and touched, after form submit, or both, depending on the error display mode.
 *   - Pending state is shown with a spinner and aria-busy when async validation is running.
 *   - No manual error/warning/pending signal management is needed in your form components.
 *
 * Error & Warning Display Behavior:
 *   - The error display mode can be configured globally using the ERROR_DISPLAY_MODE_DEFAULT injection token (imported from 'ngx-vest-forms'),
 *     or per instance using the `errorDisplayMode` input on FormErrorDisplayDirective (which this component uses as a hostDirective).
 *   - Possible values: 'on-blur' | 'on-submit' | 'on-blur-or-submit' (default: 'on-blur-or-submit')
 *
 * Example (per instance):
 *   <div ngxControlWrapper>
 *     <label>
 *       <span>First name</span>
 *       <input type="text" name="firstName" [ngModel]="formValue().firstName" />
 *     </label>
 *   </div>
 *   // To customize errorDisplayMode for this instance, you would typically apply
 *   // FormErrorDisplayDirective with its input directly if not using ControlWrapper, or rely on global config.
 *   // ControlWrapper itself doesn't re-expose errorDisplayMode as an input; it uses the one from FormErrorDisplayDirective.
 *
 * Example (with warnings and pending):
 *   <ngx-control-wrapper>
 *     <input name="username" ngModel />
 *   </ngx-control-wrapper>
 *   <!-- If async validation is running, a spinner and 'Validating…' will be shown. -->
 *   <!-- If Vest warnings are present, they will be shown below errors. -->
 *
 * Example (global config):
 *   import { provide } from '@angular/core';
 *   import { ERROR_DISPLAY_MODE_DEFAULT } from 'ngx-vest-forms'; // Import from core
 *
 *   @Component({
 *     providers: [
 *       provide(ERROR_DISPLAY_MODE_DEFAULT, { useValue: 'submit' })
 *     ]
 *   })
 *   export class MyComponent {}
 *
 * Best Practices:
 *   - Use for every input or group in your forms.
 *   - Do not manually display errors for individual fields; rely on this wrapper.
 */
@Component({
  selector: 'ngx-control-wrapper, [ngxControlWrapper]',
  templateUrl: './control-wrapper.component.html',
  styleUrls: ['./control-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true, // Ensuring it's standalone
  imports: [], // FormErrorDisplayDirective is a hostDirective, no need to import it here for the component itself
  host: {
    class: 'ngx-control-wrapper',
    // Accessing errorDisplay properties through the injected FormErrorDisplayDirective
    '[class.ngx-control-wrapper--invalid]': 'errorDisplay.shouldShowErrors()',
  },
  // FormErrorDisplayDirective is now a host directive applied here.
  // It needs to be imported from 'ngx-vest-forms' in the context where this component is used, if not already available.
  // However, for the component definition itself, if FormErrorDisplayDirective is also standalone and exported by ngx-vest-forms,
  // it will be resolved. Let's assume FormErrorDisplayDirective is correctly exported by the core.
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      // inputs: ['errorDisplayMode'], // ControlWrapper doesn't re-expose this; it uses the directive's own input
    },
  ],
})
export class NgxControlWrapper {
  // Injects the instance of FormErrorDisplayDirective that is applied via hostDirectives
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
