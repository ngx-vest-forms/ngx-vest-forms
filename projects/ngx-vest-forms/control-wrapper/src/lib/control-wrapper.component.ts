import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
// Import from the core entry point to avoid cross-entrypoint source imports that break ng-packagr
import { NgxFormErrorDisplayDirective } from 'ngx-vest-forms/core';

/**
 * Accessible NgxControlWrapper
 *
 * Usage:
 *   - Wrap any form element with `ngx-control-wrapper` that contains an `ngModel` or `ngModelGroup`.
 *   - Errors are shown when the control is invalid and touched, after form submit, or both, depending on the error display mode.
 *   - Warnings are opt-in and only shown when `showWarnings` input is provided.
 *   - Pending state is shown with a spinner and aria-busy when async validation is running.
 *   - No manual error/warning/pending signal management is needed in your form components.
 *
 * Error Display Behavior:
 *   - The error display mode can be configured globally using the NGX_ERROR_DISPLAY_MODE_DEFAULT injection token,
 *     or per instance using the `errorDisplayMode` input.
 *   - Possible values: 'on-blur' | 'on-submit' | 'on-blur-or-submit' (default: 'on-blur-or-submit')
 *
 * Warning Display Behavior:
 *   - Warnings are disabled by default for clean UX.
 *   - To enable progressive warnings: `showWarnings` (boolean attribute) or `showWarnings="on-change"`
 *   - To enable conservative warnings: `showWarnings="on-blur"`
 *   - Available modes: 'on-change' (default when enabled) | 'on-blur'
 *   - 'on-change': Shows warnings while typing (debounced at 180ms) for progressive guidance
 *   - 'on-blur': Shows warnings only after field loses focus (conservative approach)
 *
 * Basic Example:
 *   <ngx-control-wrapper>
 *     <label>
 *       <span>First name</span>
 *       <input type="text" name="firstName" [ngModel]="formValue().firstName" />
 *     </label>
 *   </ngx-control-wrapper>
 *
 * Example with progressive warnings (boolean attribute):
 *   <ngx-control-wrapper showWarnings>
 *     <input name="password" type="password" ngModel />
 *   </ngx-control-wrapper>
 *
 * Example with progressive warnings (explicit):
 *   <ngx-control-wrapper showWarnings="on-change">
 *     <input name="password" type="password" ngModel />
 *   </ngx-control-wrapper>
 *
 * Example with conservative warnings:
 *   <ngx-control-wrapper showWarnings="on-blur">
 *     <input name="username" ngModel />
 *   </ngx-control-wrapper>
 *
 * Best Practices:
 *   - Use for every input or group in your forms.
 *   - Enable warnings selectively where progressive feedback adds value (e.g., password strength, username availability).
 *   - Do not manually display errors for individual fields; rely on this wrapper.
 */
@Component({
  selector: 'ngx-control-wrapper, [ngxControlWrapper]',
  templateUrl: './control-wrapper.component.html',
  styleUrls: ['./control-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ngx-control-wrapper',
    // Accessing errorDisplay properties through the injected NgxFormErrorDisplayDirective
    '[class.ngx-control-wrapper--invalid]': 'errorDisplay.shouldShowErrors()',
    '[class.ngx-control-wrapper--has-warnings]':
      'errorDisplay.shouldShowWarnings()',
    // Pass through the computed warningDisplayMode from the directive
    '[attr.data-warning-mode]': 'errorDisplay.computedWarningMode()',
  },
  hostDirectives: [
    {
      directive: NgxFormErrorDisplayDirective,
      // Re-expose the directive inputs for convenience on the wrapper component
      inputs: ['errorDisplayMode', 'showWarnings'],
    },
  ],
})
export class NgxControlWrapper {
  // Injects the instance of NgxFormErrorDisplayDirective that is applied via hostDirectives
  protected readonly errorDisplay = inject(NgxFormErrorDisplayDirective, {
    self: true,
  });
}
