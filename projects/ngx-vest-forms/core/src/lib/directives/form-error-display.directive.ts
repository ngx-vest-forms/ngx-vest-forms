import {
  computed,
  Directive,
  effect,
  inject,
  Injector,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NgForm } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import {
  NGX_ERROR_DISPLAY_MODE_DEFAULT,
  NGX_ON_CHANGE_WARNING_DEBOUNCE,
  NGX_WARNING_DISPLAY_MODE_DEFAULT,
  NgxErrorDisplayMode,
  NgxWarningDisplayMode,
} from '../config/error-display.config';
import { NgxFormControlStateDirective } from './form-control-state.directive';

/**
 * NgxFormErrorDisplayDirective
 *
 * Extends NgxFormControlStateDirective with error/warning display behavior and opinions about WHEN to show validation messages.
 * While NgxFormControlStateDirective provides the raw data, this directive adds display logic like "show errors after blur, submit, or both".
 *
 * Key Benefits:
 * - Adds configurable error display modes ('on-blur', 'on-submit', 'on-blur-or-submit')
 * - Provides form submission tracking automatically
 * - Includes convenient method to determine when errors should be visible
 * - Filters errors/warnings during pending validation to prevent flickering
 * - Error display logic is now aware of the control's ngModelOptions.updateOn value for correct timing
 *
 * When To Use:
 * - When you need display logic (not just data) for form validation
 * - When building custom form components that should respect user preferences for error visibility
 * - When you want to handle form submission state without manual tracking
 *
 * Basic Usage:
 * ```html
 * <div ngxFormErrorDisplay #display="formErrorDisplay" errorDisplayMode="on-submit">
 *   <input type="text" name="email" ngModel />
 *
 *   @if (display.shouldShowErrors()) {
 *     <div class="errors">
 *       @for (error of display.errors(); track error) {
 *         <div class="error">{{ error }}</div>
 *       }
 *     </div>
 *   }
 * </div>
 * ```
 *
 * ## Composition & hostDirectives
 *
 * This directive is designed to be used as a `hostDirective` in your own components or directives, embracing Angular's composition API. This is the recommended approach for composing error display logic into custom controls or wrappers.
 *
 * Example:
 * ```typescript
 * @Component({
 *   ...,
 *   hostDirectives: [NgxFormErrorDisplayDirective],
 * })
 * export class MyCustomFieldComponent { ... }
 * ```
 *
 * See also: NgxFormControlStateDirective for just the raw form state without display opinions.
 */
@Directive({
  selector: '[ngxFormErrorDisplay]',
  exportAs: 'formErrorDisplay',
  hostDirectives: [NgxFormControlStateDirective],
})
export class NgxFormErrorDisplayDirective {
  readonly #ngForm = inject(NgForm, { optional: true });
  readonly #formControlState = inject(NgxFormControlStateDirective);

  // Configuration for when to display blocking errors
  readonly errorDisplayMode = input<NgxErrorDisplayMode>(
    inject(NGX_ERROR_DISPLAY_MODE_DEFAULT),
  );

  // Configuration for when to display non-blocking warnings (progressive guidance)
  readonly warningDisplayMode = input<NgxWarningDisplayMode>(
    inject(NGX_WARNING_DISPLAY_MODE_DEFAULT),
  );

  /**
   * Opt-in control for warning display with intelligent input transform.
   * This provides a developer-friendly API for enabling warnings.
   *
   * Usage patterns:
   * - `<div ngxFormErrorDisplay showWarnings>` → Enables with 'on-change' mode
   * - `<div ngxFormErrorDisplay showWarnings="true">` → Enables with 'on-change' mode
   * - `<div ngxFormErrorDisplay showWarnings="on-change">` → Progressive warnings while typing
   * - `<div ngxFormErrorDisplay showWarnings="on-blur">` → Conservative warnings after blur
   * - `<div ngxFormErrorDisplay>` (default) → Uses warningDisplayMode or global default
   *
   * When showWarnings is provided, it overrides warningDisplayMode for this instance.
   */
  readonly showWarnings = input(
    undefined as NgxWarningDisplayMode | 'disabled' | undefined,
    {
      transform: (
        value: string | boolean | NgxWarningDisplayMode | undefined,
      ): NgxWarningDisplayMode | 'disabled' | undefined => {
        // Handle boolean attributes and string coercion
        if (value === '' || value === true || value === 'true') {
          return 'on-change'; // Default mode when enabled as boolean
        }

        if (value === false || value === 'false') {
          return 'disabled'; // Explicitly disabled
        }

        if (value === undefined || value === null) {
          return undefined; // Use warningDisplayMode instead
        }

        // Handle specific warning modes
        if (value === 'on-change' || value === 'on-blur') {
          return value;
        }

        // Fallback for any other truthy value
        return typeof value === 'string' && value.length > 0
          ? 'on-change'
          : undefined;
      },
    },
  );

  // Access the underlying form control state and its derived signals
  readonly controlState = this.#formControlState.controlState;
  readonly errorMessages = this.#formControlState.errorMessages;
  readonly warningMessages = this.#formControlState.warningMessages;
  readonly hasPendingValidation = this.#formControlState.hasPendingValidation;
  readonly updateOn = this.#formControlState.updateOn;
  readonly #onChangeWarningDebounce = inject(NGX_ON_CHANGE_WARNING_DEBOUNCE);

  // Signal that becomes true after the form is submitted
  readonly formSubmitted = toSignal(
    this.#ngForm?.ngSubmit?.asObservable()?.pipe(
      map(() => true),
      startWith(false),
    ) ?? of(false),
    { initialValue: false },
  );

  constructor() {
    // Warning for configuration mismatches
    effect(
      () => {
        const mode = this.errorDisplayMode();
        const updateOn = this.updateOn();

        // Warn about problematic combinations
        if (updateOn === 'submit' && mode === 'on-blur') {
          console.warn(
            '[ngx-vest-forms] Potential UX issue: errorDisplayMode is "on-blur" but updateOn is "submit". ' +
              'Errors will only show after form submission, not after blur.',
          );
        }
      },
      { injector: inject(Injector) },
    );

    effect(
      () => {
        const mode = this.errorDisplayMode();
        const state = this.controlState();
        const updateOn = this.updateOn();

        const includesBlur = mode === 'on-blur' || mode === 'on-blur-or-submit';
        const controlReference = state?.controlRef as {
          control?: { updateValueAndValidity?: (options?: unknown) => void };
        } | null;

        if (!includesBlur) return;
        if (!state?.isTouched) return;
        if (!controlReference) return;
        if (updateOn === 'submit') return;
        if (this.hasPendingValidation()) return;
        if (this.#postBlurValidated.has(controlReference)) return;

        // Defer to next microtask to avoid running during a render pass
        queueMicrotask(() => {
          try {
            controlReference.control?.updateValueAndValidity?.({
              onlySelf: true,
              emitEvent: true,
            });
          } finally {
            this.#postBlurValidated.add(controlReference);
          }
        });
      },
      { injector: inject(Injector) },
    );
  }

  /**
   * Determines if errors should be displayed to users based on timing and context.
   *
   * CSS pseudo-class approach alignment:
   * - Errors represent "user finished editing, field still invalid" (:invalid:not(:focus))
   * - Hard red feedback when user has moved away from invalid field
   *
   * @returns A boolean signal that is true when errors should be shown.
   */
  readonly shouldShowErrors = computed(() => {
    // Simplified signal access - trust Angular 20.2 timing
    const state = this.controlState();
    const mode = this.errorDisplayMode();
    const hasPending = this.hasPendingValidation();
    const updateOn = this.updateOn();
    const errorMessages = this.errorMessages();

    // Early return for safety
    if (!state || hasPending) return false;

    const errorCount = errorMessages?.length || 0;

    // Always only show errors after submit if updateOn is 'submit'
    if (updateOn === 'submit') {
      return !!(this.formSubmitted() && errorCount > 0);
    }

    if (mode === 'on-blur') {
      // Aligns with CSS :invalid:not(:focus) - show after user moves away
      return !!(state.isTouched && errorCount > 0);
    }

    // on-submit: show errors after submit
    if (mode === 'on-submit') {
      return !!(this.formSubmitted() && errorCount > 0);
    }

    // on-blur-or-submit: show errors after blur (touch) or submit
    return !!((state.isTouched || this.formSubmitted()) && errorCount > 0);
  });

  #postBlurValidated = new WeakSet<object>();

  /**
   * Filtered and processed error messages.
   *
   * This signal provides user-friendly error messages that can be displayed directly in templates.
   * It automatically filters out messages when validation is pending.
   *
   * Usage:
   * ```html
   * @for (error of errors(); track error) {
   *   <div class="error">{{ error }}</div>
   * }
   * ```
   */
  readonly errors = computed(() => {
    // Simplified approach - let Angular 20.2 handle timing
    const hasPending = this.hasPendingValidation();
    if (hasPending) return [];

    const errorMessages = this.errorMessages();
    return Array.isArray(errorMessages) ? errorMessages : [];
  });

  /**
   * Determines the computed warning mode based on showWarnings input and warningDisplayMode.
   * The showWarnings input takes precedence when provided.
   */
  readonly computedWarningMode = computed(
    (): NgxWarningDisplayMode | undefined => {
      const explicit = this.showWarnings();

      // Handle explicit disabling via showWarnings="false"
      if (explicit === 'disabled') {
        return; // Completely disabled
      }

      // Handle explicit enabling with specific mode
      if (explicit === 'on-change' || explicit === 'on-blur') {
        return explicit; // Use explicit mode
      }

      // Fallback to warningDisplayMode when showWarnings is undefined
      return this.warningDisplayMode();
    },
  );

  /**
   * Determines if warnings are explicitly disabled via showWarnings="false".
   * This is different from showWarnings being undefined (which falls back to warningDisplayMode).
   */
  readonly warningsExplicitlyDisabled = computed(() => {
    const showWarningsValue = this.showWarnings();

    // Check if explicitly disabled via showWarnings="false"
    return showWarningsValue === 'disabled';
  });

  /**
   * Determines if warnings should be shown based on CSS pseudo-class approach:
   * - Show warnings when field is focused and invalid (:focus:invalid) - soft feedback
   * - Show warnings for progressive feedback (like password strength) even when valid
   */
  readonly shouldShowWarnings = computed(() => {
    // First check if warnings are explicitly disabled
    if (this.warningsExplicitlyDisabled()) return false;

    const warningMode = this.computedWarningMode();
    const state = this.controlState();
    const hasPending = this.hasPendingValidation();
    const warningMessages = this.warningMessages();

    if (!state || hasPending || !warningMode) return false;

    const warningCount = warningMessages?.length || 0;
    if (warningCount === 0) return false;

    // CSS-driven approach: warnings are progressive feedback
    switch (warningMode) {
      case 'on-change': {
        // Progressive: Show warnings while user is actively editing
        // This aligns with :focus:invalid pseudo-class behavior
        return true; // Let CSS handle the visual timing via :focus:invalid
      }
      case 'on-blur': {
        // Conservative: Only show after user has finished (blur/touch)
        return state.isTouched;
      }
      default: {
        return false;
      }
    }
  });

  /**
   * Filtered and processed warning messages.
   *
   * This signal provides non-blocking warning messages from Vest validation.
   * Warnings don't prevent form submission but provide helpful guidance to users.
   *
   * For 'on-change' mode: warnings are debounced to prevent visual churn
   * For 'on-blur' mode: warnings appear immediately after touch (no debounce needed)
   *
   * Usage:
   * ```html
   * @for (warning of warnings(); track warning) {
   *   <div class="warning">{{ warning }}</div>
   * }
   * ```
   */
  readonly warnings = (() => {
    const injector = inject(Injector);

    // Stream of raw warnings (mode gating handled downstream). Avoid circular dependency with shouldShowWarnings.
    const filteredWarnings$ = toObservable(
      computed(() => {
        const mode = this.computedWarningMode();
        if (!mode || this.warningsExplicitlyDisabled()) return [] as string[];
        const msgs = this.warningMessages();
        return Array.isArray(msgs) ? msgs : [];
      }),
    );

    // Stream of mode changes
    const mode$ = toObservable(this.computedWarningMode);

    // Apply debounce only for 'on-change' mode
    const debounced$ = mode$.pipe(
      startWith(this.computedWarningMode()),
      switchMap((mode) => {
        if (mode === 'on-change') {
          const base$ = filteredWarnings$.pipe(
            distinctUntilChanged(
              (a, b) =>
                a.length === b.length && a.every((v, index) => v === b[index]),
            ),
            shareReplay(1),
          );
          return merge(
            base$, // immediate emission
            base$.pipe(debounceTime(this.#onChangeWarningDebounce)), // trailing debounced
          ).pipe(
            distinctUntilChanged(
              (a, b) =>
                a.length === b.length && a.every((v, index) => v === b[index]),
            ),
          );
        }
        return filteredWarnings$; // 'on-blur': no debounce
      }),
    );

    return toSignal(debounced$, { initialValue: [], injector });
  })();

  /**
   * Whether the control is currently being validated.
   *
   * This signal simplifies checking if validation is in progress, making it easy
   * to show loading indicators or spinners during async validation.
   *
   * Usage:
   * ```html
   * @if (isPending()) {
   *   <span class="spinner"></span>
   * }
   * ```
   */
  readonly isPending = computed(() => {
    return this.hasPendingValidation();
  });
}
