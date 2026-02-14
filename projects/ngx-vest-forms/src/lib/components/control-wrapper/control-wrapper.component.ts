import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormErrorDisplayDirective } from '../../directives/form-error-display.directive';
import {
  AriaAssociationMode,
  mergeAriaDescribedBy,
  parseAriaIdTokens,
  resolveAssociationTargets,
} from '../../utils/aria-association.utils';
import { createDebouncedPendingState } from '../../utils/pending-state.utils';

// Counter for unique IDs
let nextUniqueId = 0;

/**
 * Accessible form control wrapper built with WCAG 2.2 AA considerations.
 *
 * Wrap form fields to automatically display validation errors, warnings, and pending states
 * with proper accessibility attributes.
 *
 * @usageNotes
 *
 * ### Basic Usage
 * ```html
 * <ngx-control-wrapper>
 *   <label for="email">Email</label>
 *   <input id="email" name="email" [ngModel]="formValue().email" />
 * </ngx-control-wrapper>
 * ```
 *
 * ### Error Display Modes
 * Control when errors appear using the `errorDisplayMode` input:
 * - `'on-blur-or-submit'` (default): Show errors after blur OR form submit
 * - `'on-blur'`: Show errors only after blur
 * - `'on-submit'`: Show errors only after form submit
 * - `'on-dirty'`: Show errors as soon as the field value changes
 * - `'always'`: Show errors immediately, even on pristine fields
 *
 * ```html
 * <ngx-control-wrapper [errorDisplayMode]="'on-submit'">
 *   <input name="email" [ngModel]="formValue().email" />
 * </ngx-control-wrapper>
 * ```
 *
 * ### Warning Display Modes
 * Control when warnings appear using the `warningDisplayMode` input:
 * - `'on-validated-or-touch'` (default): Show warnings after validation runs or touch
 * - `'on-touch'`: Show warnings only after touch/blur
 * - `'on-dirty'`: Show warnings as soon as the field value changes
 * - `'always'`: Show warnings immediately, even on pristine fields
 *
 * ```html
 * <ngx-control-wrapper [warningDisplayMode]="'on-dirty'">
 *   <input name="email" [ngModel]="formValue().email" />
 * </ngx-control-wrapper>
 * ```
 *
 * ### Accessibility Features (Automatic)
 * - Unique IDs for error/warning/pending regions
 * - `aria-describedby` linking errors to form controls
 * - `aria-invalid="true"` when errors are shown
 * - Uses `role="status"` with `aria-live="polite"` for non-disruptive announcements
 * - Debounced pending state to prevent flashing for quick validations
 *
 * ### WCAG 2.2 AA - Error Severity Levels
 * This component uses `role="status"` for **field-level** validation messages:
 * - **Errors**: Non-disruptive announcement (user can continue filling other fields)
 * - **Warnings**: Informational only, doesn't block submission
 * - **Pending**: Status update while async validation runs
 *
 * For **form-level blocking errors** (e.g., submission failed), implement a separate
 * error summary component with `role="alert"` and `aria-live="assertive"`.
 *
 * @see {@link FormErrorDisplayDirective} for custom wrapper implementation
 *
 *   Form-Level Blocking Errors:
 *   - For post-submit validation errors that block submission, implement a separate
 *     form-level error summary with role="alert" and aria-live="assertive"
 *   - This component uses role="status" for field-level errors (non-disruptive)
 *   - Example for form-level errors:
 *     ```html
 *     <!-- Keep in DOM; update text content on submit -->
 *     <div id="form-errors" role="alert" aria-live="assertive" aria-atomic="true"></div>
 *     ```
 *   - This separation provides immediate announcements for blocking form errors while
 *     keeping inline field errors non-disruptive. Follows WCAG ARIA21/ARIA22 guidance.
 *
 * Error & Warning Display Behavior:
 *   - The error display mode can be configured globally using the NGX_ERROR_DISPLAY_MODE_TOKEN injection token, or per instance using the `errorDisplayMode` input on FormErrorDisplayDirective (which this component uses as a hostDirective).
 *   - Possible error display values: 'on-blur' | 'on-submit' | 'on-blur-or-submit' | 'on-dirty' | 'always' (default: 'on-blur-or-submit')
 *   - The warning display mode can be configured globally using NGX_WARNING_DISPLAY_MODE_TOKEN, or per instance using the `warningDisplayMode` input on FormErrorDisplayDirective.
 *   - Possible warning display values: 'on-touch' | 'on-validated-or-touch' | 'on-dirty' | 'always' (default: 'on-validated-or-touch')
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
 *   <ngx-control-wrapper>
 *     <input name="username" ngModel />
 *   </ngx-control-wrapper>
 *   /// If async validation is running for >500ms, a spinner and 'Validating…' will be shown.
 *   /// Once shown, the validation message stays visible for minimum 500ms to prevent flashing.
 *   /// If Vest warnings are present, they will be shown below errors.
 *
 * Example (global config):
 *   import { provide } from '@angular/core';
 *   import { NGX_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';
 *   @Component({
 *     providers: [
 *       provide(NGX_ERROR_DISPLAY_MODE_TOKEN, { useValue: 'on-submit' })
 *     ]
 *   })
 *   export class MyComponent {}
 *
 * Best Practices:
 *   - Use for single-control wrappers.
 *   - For multi-control/group containers, prefer `ngx-form-group-wrapper`.
 *   - Do not manually display errors for individual fields; rely on this wrapper.
 *   - Validate with tools like Accessibility Insights and real screen reader testing.
 *
 * @see https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19 - ARIA19: Using ARIA role=alert
 * @see https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22 - ARIA22: Using role=status
 */
@Component({
  selector:
    'ngx-control-wrapper, sc-control-wrapper, [scControlWrapper], [ngxControlWrapper], [ngx-control-wrapper], [sc-control-wrapper]',
  templateUrl: './control-wrapper.component.html',
  styles: `
    :host {
      display: block;
      position: relative;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,

  host: {
    class: 'ngx-control-wrapper sc-control-wrapper',
    '[class.ngx-control-wrapper--invalid]': 'errorDisplay.shouldShowErrors()',
    '[attr.aria-busy]': "errorDisplay.isPending() ? 'true' : null",
  },
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode', 'warningDisplayMode'],
    },
  ],
})
export class ControlWrapperComponent implements AfterContentInit, OnDestroy {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Controls how this wrapper applies ARIA attributes to descendant controls.
   *
   * - `all-controls` (default, backwards compatible): apply `aria-describedby` / `aria-invalid`
   *   to all `input/select/textarea` elements inside the wrapper.
   * - `single-control`: apply ARIA attributes only when exactly one control is found.
   *   (Useful for wrappers that sometimes contain helper buttons/controls.)
   * - `none`: do not mutate descendant controls at all (group-safe mode).
   *
   * Notes:
   * - Use `none` when wrapping a container (e.g. `NgModelGroup`) to avoid stamping ARIA
   *   across multiple child controls.
   * - This does not affect whether messages render; it only affects ARIA wiring.
   */
  readonly ariaAssociationMode = input<AriaAssociationMode>('all-controls');

  // Generate unique IDs for ARIA associations
  protected readonly uniqueId = `ngx-control-wrapper-${nextUniqueId++}`;
  protected readonly errorId = `${this.uniqueId}-error`;
  protected readonly warningId = `${this.uniqueId}-warning`;
  protected readonly pendingId = `${this.uniqueId}-pending`;

  // Track form controls found in the wrapper
  private readonly formControls = signal<HTMLElement[]>([]);

  // Signals when content is initialized so effects can safely touch the DOM.
  private readonly contentInitialized = signal(false);

  // MutationObserver to detect dynamically added/removed controls
  private mutationObserver: MutationObserver | null = null;

  /**
   * Debounced pending state to prevent flashing for quick async validations.
   * Uses createDebouncedPendingState utility with 500ms delay and 500ms minimum display.
   */
  private readonly pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    { showAfter: 500, minimumDisplay: 500 }
  );
  protected readonly showPendingMessage = this.pendingState.showPendingMessage;

  /**
   * Whether to display warnings.
   * Delegates to FormErrorDisplayDirective's centralized shouldShowWarnings signal.
   *
   * This ensures consistent warning display behavior across all form components
   * and supports the new 'on-dirty' and 'always' display modes.
   */
  protected readonly shouldShowWarnings = this.errorDisplay.shouldShowWarnings;

  /**
   * Computed signal that builds aria-describedby string based on visible regions
   */
  protected readonly ariaDescribedBy = computed(() => {
    const ids: string[] = [];
    if (this.errorDisplay.shouldShowErrors()) {
      ids.push(this.errorId);
    }
    if (this.shouldShowWarnings()) {
      ids.push(this.warningId);
    }
    if (this.showPendingMessage()) {
      ids.push(this.pendingId);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  });

  /**
   * IDs managed by this wrapper when composing aria-describedby.
   *
   * We remove only these from the consumer-provided aria-describedby tokens and then
   * append the currently-relevant wrapper IDs. This prevents clobbering app-provided
   * hint/help text associations.
   */
  private readonly wrapperOwnedDescribedByIds = [
    this.errorId,
    this.warningId,
    this.pendingId,
  ];

  constructor() {
    // Effect to update aria-describedby and aria-invalid on form controls
    effect(() => {
      if (!this.contentInitialized()) return;

      const mode = this.ariaAssociationMode();
      if (mode === 'none') {
        return;
      }

      const describedBy = this.ariaDescribedBy();
      const wrapperActiveIds = parseAriaIdTokens(describedBy);
      const shouldShowErrors = this.errorDisplay.shouldShowErrors();

      const targets = resolveAssociationTargets(this.formControls(), mode);

      targets.forEach((control) => {
        // Update aria-describedby (merge, don't overwrite)
        const nextDescribedBy = mergeAriaDescribedBy(
          control.getAttribute('aria-describedby'),
          wrapperActiveIds,
          this.wrapperOwnedDescribedByIds
        );
        if (nextDescribedBy) {
          control.setAttribute('aria-describedby', nextDescribedBy);
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

    // Clean up MutationObserver when component is destroyed
    this.destroyRef.onDestroy(() => {
      this.mutationObserver?.disconnect();
      this.mutationObserver = null;
    });

    // Effect to enable/disable DOM observation based on ariaAssociationMode.
    // This keeps the wrapper cheap in group-safe mode.
    effect(() => {
      if (!this.contentInitialized()) return;

      const mode = this.ariaAssociationMode();

      if (mode === 'none') {
        this.mutationObserver?.disconnect();
        this.mutationObserver = null;
        if (this.formControls().length > 0) {
          this.formControls.set([]);
        }
        return;
      }

      // Ensure controls list is up to date.
      this.updateFormControls();

      // Ensure MutationObserver is installed (dynamic @if/@for support).
      if (!this.mutationObserver) {
        this.mutationObserver = new MutationObserver(() => {
          this.updateFormControls();
        });

        this.mutationObserver.observe(this.elementRef.nativeElement, {
          childList: true,
          subtree: true,
        });
      }
    });
  }

  ngAfterContentInit(): void {
    this.contentInitialized.set(true);

    // ARIA wiring + observer setup is managed by effects so that the wrapper can
    // opt out (ariaAssociationMode="none").
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
  }

  /**
   * Query and update the list of form controls within this wrapper.
   * Called on init and whenever the DOM structure changes.
   */
  private updateFormControls(): void {
    const controls = this.elementRef.nativeElement.querySelectorAll(
      'input, select, textarea'
    );
    this.formControls.set(Array.from(controls) as HTMLElement[]);
  }
}
