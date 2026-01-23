import { computed, Directive, effect, inject, input, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgForm } from '@angular/forms';
import { map, merge, of, startWith } from 'rxjs';
import {
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  SC_ERROR_DISPLAY_MODE_TOKEN,
} from './error-display-mode.token';
import { FormControlStateDirective } from './form-control-state.directive';

export type ScErrorDisplayMode = 'on-blur' | 'on-submit' | 'on-blur-or-submit';

export const SC_ERROR_DISPLAY_MODE_DEFAULT: ScErrorDisplayMode =
  'on-blur-or-submit';

@Directive({
  selector: '[formErrorDisplay], [ngxErrorDisplay]',
  exportAs: 'formErrorDisplay, ngxErrorDisplay',
  standalone: true,
  hostDirectives: [FormControlStateDirective],
})
export class FormErrorDisplayDirective {
  readonly #formControlState = inject(FormControlStateDirective);
  // Optionally inject NgForm for form submission tracking
  readonly #ngForm = inject(NgForm, { optional: true });

  /**
   * Input signal for error display mode.
   * Works seamlessly with hostDirectives in Angular 19+.
   */
  readonly errorDisplayMode = input<ScErrorDisplayMode>(
    inject(NGX_ERROR_DISPLAY_MODE_TOKEN, { optional: true }) ??
      inject(SC_ERROR_DISPLAY_MODE_TOKEN, { optional: true }) ??
      SC_ERROR_DISPLAY_MODE_DEFAULT
  );

  // Expose state signals from FormControlStateDirective
  readonly controlState = this.#formControlState.controlState;
  readonly errorMessages = this.#formControlState.errorMessages;
  readonly warningMessages = this.#formControlState.warningMessages;
  readonly hasPendingValidation = this.#formControlState.hasPendingValidation;
  readonly isTouched = this.#formControlState.isTouched;
  readonly isDirty = this.#formControlState.isDirty;
  readonly isValid = this.#formControlState.isValid;
  readonly isInvalid = this.#formControlState.isInvalid;
  readonly hasBeenValidated = this.#formControlState.hasBeenValidated;
  /**
   * Expose updateOn and formSubmitted as public signals for advanced consumers.
   * updateOn: The ngModelOptions.updateOn value for the control (change/blur/submit)
   * formSubmitted: true after the form is submitted (if NgForm is present)
   */
  readonly updateOn = this.#formControlState.updateOn;

  /**
   * Signal that tracks NgForm.submitted state reactively.
   *
   * Uses toSignal() to convert ngSubmit events + statusChanges into a reactive signal.
   * - ngSubmit: fires when form is submitted (sets NgForm.submitted = true)
   * - statusChanges: fires after resetForm() (which sets NgForm.submitted = false)
   *
   * This ensures proper sync with both submit and reset operations.
   */
  readonly formSubmitted: Signal<boolean> = this.#ngForm
    ? toSignal(
        merge(this.#ngForm.ngSubmit, this.#ngForm.statusChanges ?? of()).pipe(
          startWith(null),
          map(() => this.#ngForm?.submitted ?? false)
        ),
        { initialValue: this.#ngForm.submitted }
      )
    : toSignal(of(false), { initialValue: false });

  constructor() {
    // Warn about problematic combinations of updateOn and errorDisplayMode
    effect(() => {
      const mode = this.errorDisplayMode();
      const updateOn = this.updateOn();
      if (updateOn === 'submit' && mode === 'on-blur') {
        console.warn(
          '[ngx-vest-forms] Potential UX issue: errorDisplayMode is "on-blur" but updateOn is "submit". Errors will only show after form submission, not after blur.'
        );
      }
    });
  }

  /**
   * Determines if errors should be shown based on the specified display mode
   * and the control's state (touched/submitted/validated).
   *
   * Note: We check both hasErrors (extracted error messages) AND isInvalid (Angular's validation state)
   * because in some cases (like conditional validations via validationConfig), the control is marked
   * as invalid by Angular before error messages are extracted from Vest. This ensures aria-invalid
   * is set correctly even during the validation propagation delay.
   *
   * For validationConfig-triggered validations: A field can be validated without being touched
   * (e.g., confirmPassword validated when password changes). We check hasBeenValidated to show
   * errors in these scenarios, providing better UX and proper ARIA attributes.
   */
  readonly shouldShowErrors: Signal<boolean> = computed(() => {
    const mode = this.errorDisplayMode();
    const isTouched = this.isTouched();
    const isInvalid = this.isInvalid();
    const hasErrors = this.errorMessages().length > 0;
    const updateOn = this.updateOn();
    const formSubmitted = this.formSubmitted();

    // Consider errors present if either we have error messages OR the control is invalid
    // This handles the race condition where Angular marks control invalid before Vest errors propagate
    const hasErrorState = hasErrors || isInvalid;

    // Always only show errors after submit if updateOn is 'submit'
    if (updateOn === 'submit') {
      return !!(formSubmitted && hasErrorState);
    }
    // on-blur: show errors after blur (touch)
    if (mode === 'on-blur') {
      return !!(isTouched && hasErrorState);
    }
    // on-submit: show errors after submit
    if (mode === 'on-submit') {
      return !!(formSubmitted && hasErrorState);
    }
    // on-blur-or-submit: show errors after blur (touch) OR submit
    return !!((isTouched || formSubmitted) && hasErrorState);
  });

  /**
   * Errors to display (filtered for pending state)
   */
  readonly errors: Signal<string[]> = computed(() => {
    if (this.hasPendingValidation()) return [];
    return this.errorMessages();
  });

  /**
   * Warnings to display (filtered for pending state)
   */
  readonly warnings: Signal<string[]> = computed(() => {
    if (this.hasPendingValidation()) return [];
    return this.warningMessages();
  });

  /**
   * Whether the control is currently being validated (pending)
   * Excludes pristine+untouched controls to prevent "Validating..." on initial load
   */
  readonly isPending: Signal<boolean> = computed(() => {
    // Don't show pending state for pristine untouched controls
    // This prevents "Validating..." message appearing on initial page load
    const state = this.#formControlState.controlState();
    if (state.isPristine && !state.isTouched) {
      return false;
    }
    return this.hasPendingValidation();
  });
}
