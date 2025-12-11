import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormErrorDisplayDirective } from '../../directives/form-error-display.directive';
import { createDebouncedPendingState } from '../../utils/pending-state.utils';

// Counter for unique IDs
let nextUniqueId = 0;

/**
 * Accessible form control wrapper with WCAG 2.2 AA compliance.
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
 *
 * ```html
 * <ngx-control-wrapper [errorDisplayMode]="'on-submit'">
 *   <input name="email" [ngModel]="formValue().email" />
 * </ngx-control-wrapper>
 * ```
 *
 * ### Accessibility Features (Automatic)
 * - Unique IDs for error/warning/pending regions
 * - `aria-describedby` linking errors to form controls
 * - `aria-invalid="true"` when errors are shown
 * - `role="status"` with `aria-live="polite"` for non-interruptive announcements
 * - Debounced pending state to prevent flashing for quick validations
 *
 * @see {@link FormErrorDisplayDirective} for custom wrapper implementation
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
 *   <ngx-control-wrapper>
 *     <input name="username" ngModel />
 *   </ngx-control-wrapper>
 *   /// If async validation is running for >200ms, a spinner and 'Validating…' will be shown.
 *   /// Once shown, the validation message stays visible for minimum 500ms to prevent flashing.
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
  selector:
    'ngx-control-wrapper, sc-control-wrapper, [scControlWrapper], [ngxControlWrapper], [ngx-control-wrapper], [sc-control-wrapper]',
  template: `
    <div class="ngx-control-wrapper__content">
      <ng-content />
    </div>

    <!--
      Live regions are kept stable in the DOM to improve announcement reliability.
      We update the inner content instead of relying on node mount/unmount.
    -->
    <div
      [id]="errorId"
      class="text-sm text-red-600"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      @if (errorDisplay.shouldShowErrors()) {
        <ul>
          @for (error of errorDisplay.errors(); track error) {
            <li>{{ error.message || error }}</li>
          }
        </ul>
      }
    </div>

    <div
      [id]="warningId"
      class="text-sm text-yellow-700"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      @if (errorDisplay.warnings().length > 0) {
        <ul>
          @for (warn of errorDisplay.warnings(); track warn) {
            <li>{{ warn }}</li>
          }
        </ul>
      }
    </div>

    <!-- Pending state is also stable; content appears only after the debounce delay -->
    <div
      [id]="pendingId"
      class="absolute top-0 right-0 flex items-center gap-1 text-xs text-gray-500"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      @if (showPendingMessage()) {
        <span
          class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
          aria-hidden="true"
        ></span>
        Validating…
      }
    </div>
  `,
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
      inputs: ['errorDisplayMode'],
    },
  ],
})
export class ControlWrapperComponent implements AfterContentInit, OnDestroy {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  // Generate unique IDs for ARIA associations
  protected readonly uniqueId = `ngx-control-wrapper-${nextUniqueId++}`;
  protected readonly errorId = `${this.uniqueId}-error`;
  protected readonly warningId = `${this.uniqueId}-warning`;
  protected readonly pendingId = `${this.uniqueId}-pending`;

  // Track form controls found in the wrapper
  private readonly formControls = signal<HTMLElement[]>([]);

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

  private mergeAriaDescribedBy(
    existing: string | null,
    wrapperActiveIds: string[]
  ): string | null {
    const existingTokens = (existing ?? '')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    // Remove any previous wrapper-owned IDs from the existing list.
    const existingWithoutWrapper = existingTokens.filter(
      (t) => !this.wrapperOwnedDescribedByIds.includes(t)
    );

    // Append current wrapper IDs, preserving existing order and uniqueness.
    const merged: string[] = [...existingWithoutWrapper];
    for (const id of wrapperActiveIds) {
      if (!merged.includes(id)) {
        merged.push(id);
      }
    }

    return merged.length > 0 ? merged.join(' ') : null;
  }

  constructor() {
    // Effect to update aria-describedby and aria-invalid on form controls
    effect(() => {
      const describedBy = this.ariaDescribedBy();
      const wrapperActiveIds = describedBy
        ? describedBy.split(/\s+/).filter(Boolean)
        : [];
      const shouldShowErrors = this.errorDisplay.shouldShowErrors();

      this.formControls().forEach((control) => {
        // Update aria-describedby (merge, don't overwrite)
        const nextDescribedBy = this.mergeAriaDescribedBy(
          control.getAttribute('aria-describedby'),
          wrapperActiveIds
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
  }

  ngAfterContentInit(): void {
    // Initial query for form controls
    this.updateFormControls();

    // Set up MutationObserver to detect dynamically added/removed controls (via @if/@for)
    // This ensures ARIA associations stay in sync with dynamic content
    this.mutationObserver = new MutationObserver(() => {
      this.updateFormControls();
    });

    this.mutationObserver.observe(this.elementRef.nativeElement, {
      childList: true,
      subtree: true,
    });
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
