import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { FormErrorDisplayDirective } from '../../directives/form-error-display.directive';

// Counter for unique IDs
let nextUniqueId = 0;

/**
 * Accessible ScControlWrapper with WCAG 2.2 AA Compliance
 *
 * Usage:
 *   - Wrap any form element with `sc-control-wrapper` or `[scControlWrapper]` (or `[sc-control-wrapper]` for legacy) that contains an `ngModel` or `ngModelGroup`.
 *   - Errors and warnings are shown when the control is invalid and touched, after form submit, or both, depending on the error display mode.
 *   - Pending state is shown with a spinner and aria-busy when async validation is running.
 *   - No manual error/warning/pending signal management is needed in your form components.
 *
 * ARIA & Accessibility Features:
 *   - Automatically generates unique IDs for error/warning/pending regions
 *   - Associates error messages with form controls via aria-describedby
 *   - Sets aria-invalid="true" on form controls when errors should be shown
 *   - Uses role="status" with aria-live="polite" for inline field errors to avoid interrupting typing
 *   - Uses role="status" with aria-live="polite" for warnings and pending states
 *   - Implements aria-atomic="true" for complete message announcements
 *
 * Accessibility Strategy:
 *
 *   Inline Field Messages (default):
 *   - Field-level errors use role="status" with aria-live="polite"
 *   - Rationale: Errors often update as users type. Polite announcements avoid interrupting
 *     typing flow and prevent excessive screen reader chatter. This aligns with WCAG guidance
 *     for non-critical, continuously updating messages.
 *
 *   Warnings & Pending States:
 *   - Also use role="status" and aria-live="polite"
 *   - Referenced via aria-describedby so users are informed without interruption
 *
 *   Blocking Errors (form-level):
 *   - For post-submit validation errors that block submission, implement a separate
 *     form-level error summary with role="alert" and aria-live="assertive"
 *   - Example:
 *     ```html
 *     <!-- Keep in DOM; update text content on submit -->
 *     <div id="form-errors" role="alert" aria-live="assertive" aria-atomic="true"></div>
 *     ```
 *   - This provides immediate, reliable announcements for blocking errors while keeping
 *     inline field errors non-disruptive. Follows WCAG ARIA19/ARIA22 guidance.
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
 *   - Validate with tools like Accessibility Insights and real screen reader testing.
 *
 * @see https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19 - ARIA19: Using ARIA role=alert
 * @see https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22 - ARIA22: Using role=status
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
export class ControlWrapperComponent implements AfterContentInit {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
  private readonly elementRef = inject(ElementRef);

  // Generate unique IDs for ARIA associations
  protected readonly uniqueId = `ngx-control-wrapper-${nextUniqueId++}`;
  protected readonly errorId = `${this.uniqueId}-error`;
  protected readonly warningId = `${this.uniqueId}-warning`;
  protected readonly pendingId = `${this.uniqueId}-pending`;

  // Track form controls found in the wrapper
  private readonly formControls = signal<HTMLElement[]>([]);

  /**
   * Computed signal that builds aria-describedby string based on visible regions
   */
  protected readonly ariaDescribedBy = computed(() => {
    const ids: string[] = [];
    if (this.errorDisplay.shouldShowErrors()) {
      ids.push(this.errorId);
    }
    if (this.errorDisplay.warnings().length > 0) {
      ids.push(this.warningId);
    }
    if (this.errorDisplay.isPending()) {
      ids.push(this.pendingId);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  });

  constructor() {
    // Effect to update aria-describedby and aria-invalid on form controls
    effect(() => {
      const describedBy = this.ariaDescribedBy();
      const shouldShowErrors = this.errorDisplay.shouldShowErrors();

      this.formControls().forEach((control) => {
        // Update aria-describedby
        if (describedBy) {
          control.setAttribute('aria-describedby', describedBy);
        } else {
          control.removeAttribute('aria-describedby');
        }

        // Update aria-invalid
        if (shouldShowErrors) {
          control.setAttribute('aria-invalid', 'true');
        } else {
          control.removeAttribute('aria-invalid');
        }
      });
    });
  }

  ngAfterContentInit(): void {
    // Find all form controls (input, select, textarea) in the wrapper
    const controls = this.elementRef.nativeElement.querySelectorAll(
      'input, select, textarea'
    );
    this.formControls.set(Array.from(controls) as HTMLElement[]);
  }
}
