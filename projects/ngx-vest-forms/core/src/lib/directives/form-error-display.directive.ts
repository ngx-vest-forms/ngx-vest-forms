import {
  computed,
  Directive,
  effect,
  inject,
  Injector,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgForm } from '@angular/forms';
import { map, of, startWith } from 'rxjs';
import {
  NGX_ERROR_DISPLAY_MODE_DEFAULT,
  NgxErrorDisplayMode,
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

  // Configuration for when to display errors
  readonly errorDisplayMode = input<NgxErrorDisplayMode>(
    inject(NGX_ERROR_DISPLAY_MODE_DEFAULT),
  );

  // Access the underlying form control state and its derived signals
  readonly controlState = this.#formControlState.controlState;
  readonly errorMessages = this.#formControlState.errorMessages;
  readonly warningMessages = this.#formControlState.warningMessages;
  readonly hasPendingValidation = this.#formControlState.hasPendingValidation;
  readonly updateOn = this.#formControlState.updateOn;

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
  }

  /**
   * Determines if errors should be shown based on the specified display mode and the control's updateOn value.
   *
   * This signal is used to control when validation messages should be displayed to the user
   * based on the form's state (touched/submitted), the configured display mode, and the ngModelOptions.updateOn value.
   *
   * - If updateOn is 'submit', errors are only shown after form submit (regardless of display mode).
   * - If updateOn is 'blur', errors are shown after blur (touched) or submit, depending on display mode.
   * - If updateOn is 'change', errors are shown after change (touched) or submit, depending on display mode.
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

    // on-blur: show errors after blur (touch)
    if (mode === 'on-blur') {
      return !!(state.isTouched && errorCount > 0);
    }

    // on-submit: show errors after submit
    if (mode === 'on-submit') {
      return !!(this.formSubmitted() && errorCount > 0);
    }

    // on-blur-or-submit: show errors after blur (touch) or submit
    return !!((state.isTouched || this.formSubmitted()) && errorCount > 0);
  });

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
   * Filtered and processed warning messages.
   *
   * This signal provides non-blocking warning messages from Vest validation.
   * Warnings don't prevent form submission but provide helpful guidance to users.
   *
   * Usage:
   * ```html
   * @for (warning of warnings(); track warning) {
   *   <div class="warning">{{ warning }}</div>
   * }
   * ```
   */
  readonly warnings = computed(() => {
    const hasPending = this.hasPendingValidation();
    if (hasPending) return [];

    const warningMessages = this.warningMessages();
    return Array.isArray(warningMessages) ? warningMessages : [];
  });

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
