import {
  computed,
  Directive,
  effect,
  inject,
  input,
  isDevMode,
  linkedSignal,
  signal,
  Signal,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import {
  logDiagnostic,
  NGX_VEST_FORMS_DIAGNOSTICS,
} from '../errors/error-catalog';
import {
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  NGX_WARNING_DISPLAY_MODE_TOKEN,
} from './error-display-mode.token';
import { FormControlStateDirective } from './form-control-state.directive';
import {
  getFormResetCount,
  getFormSubmittedSignal,
} from './form-submitted-state';

/**
 * Error display modes for form controls.
 * - 'on-blur': Show errors after field is touched/blurred
 * - 'on-submit': Show errors after form submission
 * - 'on-blur-or-submit': Show errors after blur or form submission (default)
 * - 'on-dirty': Show errors as soon as the field value changes
 * - 'always': Show errors immediately, even on pristine fields
 */
export type NgxErrorDisplayMode =
  | 'on-blur'
  | 'on-submit'
  | 'on-blur-or-submit'
  | 'on-dirty'
  | 'always';

/**
 * Warning display modes for form controls.
 * - 'on-touch': Show warnings after field is touched/blurred
 * - 'on-validated-or-touch': Show warnings after validation runs or field is touched (default)
 * - 'on-dirty': Show warnings as soon as the field value changes
 * - 'always': Show warnings immediately, even on pristine fields
 */
export type NgxWarningDisplayMode =
  | 'on-touch'
  | 'on-validated-or-touch'
  | 'on-dirty'
  | 'always';

export const NGX_ERROR_DISPLAY_MODE_DEFAULT: NgxErrorDisplayMode =
  'on-blur-or-submit';
export const NGX_WARNING_DISPLAY_MODE_DEFAULT: NgxWarningDisplayMode =
  'on-validated-or-touch';

@Directive({
  selector: '[ngxErrorDisplay]',
  exportAs: 'ngxErrorDisplay',
  hostDirectives: [FormControlStateDirective],
})
export class FormErrorDisplayDirective {
  readonly #controlStateDirective = inject(FormControlStateDirective);
  // Optionally inject NgForm for form submission tracking
  readonly #ngForm = inject(NgForm, { optional: true });
  readonly #formSubmittedState = this.#ngForm
    ? getFormSubmittedSignal(this.#ngForm)
    : signal(false);

  /**
   * Input signal for error display mode.
   * Works seamlessly with hostDirectives in Angular 19+.
   */
  readonly errorDisplayMode = input<NgxErrorDisplayMode>(
    inject(NGX_ERROR_DISPLAY_MODE_TOKEN, { optional: true }) ??
      NGX_ERROR_DISPLAY_MODE_DEFAULT
  );

  /**
   * Input signal for warning display mode.
   * Controls whether warnings are shown only after touch or also after validation.
   */
  readonly warningDisplayMode = input<NgxWarningDisplayMode>(
    inject(NGX_WARNING_DISPLAY_MODE_TOKEN, { optional: true }) ??
      NGX_WARNING_DISPLAY_MODE_DEFAULT
  );

  // Expose state signals from FormControlStateDirective
  readonly controlState = this.#controlStateDirective.controlState;
  readonly errorMessages = this.#controlStateDirective.errorMessages;
  readonly warningMessages = this.#controlStateDirective.warningMessages;
  readonly hasPendingValidation =
    this.#controlStateDirective.hasPendingValidation;
  readonly isTouched = this.#controlStateDirective.isTouched;
  readonly isDirty = this.#controlStateDirective.isDirty;
  readonly isValid = this.#controlStateDirective.isValid;
  readonly isInvalid = this.#controlStateDirective.isInvalid;
  readonly hasBeenValidated = this.#controlStateDirective.hasBeenValidated;
  /**
   * Expose updateOn and formSubmitted as public signals for advanced consumers.
   * updateOn: The ngModelOptions.updateOn value for the control (change/blur/submit)
   * formSubmitted: true after the form is submitted (if NgForm is present)
   */
  readonly updateOn = this.#controlStateDirective.updateOn;

  /**
   * Signal that tracks NgForm.submitted state reactively.
   *
   * Driven by the form's submit/reset events (one subscription per form,
   * shared by all fields), so programmatic `NgForm.onSubmit()` stays reactive
   * in zoneless mode.
   *
   * Note: when this directive is used outside an `NgForm` (no parent form),
   * this signal stays `false` for the lifetime of the directive. Consumers
   * relying on submitted state must host the field inside an `NgForm` (or
   * `ngxVestForm`).
   */
  readonly formSubmitted: Signal<boolean> = this.#formSubmittedState;

  constructor() {
    // Warn about problematic combinations of updateOn and errorDisplayMode.
    // Dev-only: production builds don't create the effect at all.
    if (isDevMode()) {
      effect(() => {
        if (
          this.updateOn() === 'submit' &&
          this.errorDisplayMode() === 'on-blur'
        ) {
          logDiagnostic(NGX_VEST_FORMS_DIAGNOSTICS.ERROR_DISPLAY_MODE_CONFLICT);
        }
      });
    }
  }

  /**
   * Whether the control's *current* state calls for showing errors, given
   * the display mode and touched/submitted/dirty state. While the control is
   * pending this is usually `false` (Angular clears the errors and the
   * invalid flag until the async result lands); {@link shouldShowErrors}
   * holds the last settled value instead.
   *
   * We check both hasErrors (extracted error messages) AND isInvalid (Angular's validation state)
   * because in some cases (like conditional validations via validationConfig), the control is marked
   * as invalid by Angular before error messages are extracted from Vest. This ensures aria-invalid
   * is set correctly even during the validation propagation delay.
   *
   * For validationConfig-triggered validations, a field may become invalid before it has been
   * touched. Error visibility still respects the field's own `errorDisplayMode`, so untouched
   * dependent fields can remain visually quiet until blur or submit.
   */
  readonly #liveShowErrors = computed(() => {
    const mode = this.errorDisplayMode();
    const isTouched = this.isTouched();
    const isDirty = this.isDirty();
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

    // Handle the new display modes
    switch (mode) {
      case 'always':
        // Always show errors immediately, even on pristine fields
        return hasErrorState;

      case 'on-dirty':
        // Show when value has changed, OR when touched/submitted (for backwards compat)
        return !!(isDirty || isTouched || formSubmitted) && hasErrorState;

      case 'on-blur':
        // Show after touch (blur) or form submission (traditional behavior, not dirty-based)
        return !!(isTouched || formSubmitted) && hasErrorState;

      case 'on-submit':
        // Show only after form submission
        return !!(formSubmitted && hasErrorState);

      case 'on-blur-or-submit':
      default:
        // Show after blur (touch) OR submit (default behavior)
        return !!((isTouched || formSubmitted) && hasErrorState);
    }
  });

  /**
   * Whether the control's *current* state calls for showing warnings.
   *
   * NOTE: Unlike errors, warnings can exist on VALID fields (warnings-only scenario).
   * We don't require isInvalid() because Vest warn() tests don't affect field validity.
   *
   * UX Note: We include `hasBeenValidated` for `on-validated-or-touch` mode to support
   * cross-field validation. If Field A triggers validation on Field B (via validationConfig),
   * Field B should show warnings if it has them, even if the user hasn't touched Field B yet.
   * Unlike errors (which block submission), warnings are informational and safe to show.
   */
  readonly #liveShowWarnings = computed(() => {
    const mode = this.warningDisplayMode();
    const isTouched = this.isTouched();
    const isDirty = this.isDirty();
    const hasBeenValidated = this.hasBeenValidated();
    const hasWarnings = this.warningMessages().length > 0;
    const formSubmitted = this.formSubmitted();

    if (!hasWarnings) {
      return false;
    }

    // Handle the warning display modes
    switch (mode) {
      case 'always':
        // Always show warnings immediately, even on pristine fields
        return true;

      case 'on-dirty':
        // Show when value has changed, OR when touched/submitted (for backwards compat)
        return isDirty || isTouched || formSubmitted;

      case 'on-touch':
        // Show after touch (blur) or form submission (traditional behavior, not dirty-based)
        return isTouched || formSubmitted;

      case 'on-validated-or-touch':
      default:
        // Show after validation runs or after touch/submit (default behavior)
        return hasBeenValidated || isTouched || formSubmitted;
    }
  });

  /**
   * Counter of root-form resets; a change drops the held messages.
   * Outside an `NgForm` there is no form reset to observe.
   */
  readonly #formResetCount = this.#ngForm
    ? getFormResetCount(this.#ngForm)
    : signal(0);

  /**
   * What the regions render: the live view while the control is settled,
   * and the last settled view while it re-validates.
   *
   * Without the hold, Angular's PENDING status (errors cleared, `invalid`
   * false) blanked the messages on every async re-check, so the message
   * vanished and came back and a polite live region announced it again.
   *
   * Nothing is held, and the regions blank as before, when:
   * - the last settled view rendered no message (first-ever validation, or
   *   messages the display mode still hid): nothing to keep;
   * - the form was reset (`FormResetEvent` on the root form);
   * - the control went back to untouched and pristine (a `control.reset()`).
   *
   * The settled view is captured when it is read, which the rendered message
   * regions do on every change detection; a consumer that never reads these
   * signals between a settle and the next re-check gets no hold.
   *
   * A held view is a snapshot: a blur or submit during the re-check does not
   * reveal messages that were hidden when the last result settled; those
   * show once the new result settles.
   */
  readonly #view = linkedSignal<MessageViewSource, MessageView>({
    source: () => ({
      pending: this.hasPendingValidation(),
      resetCount: this.#formResetCount(),
      interacted: this.isTouched() || this.isDirty(),
      live: {
        showErrors: this.#liveShowErrors(),
        errors: this.errorMessages(),
        showWarnings: this.#liveShowWarnings(),
        warnings: this.warningMessages(),
      },
    }),
    computation: (source, previous) => {
      if (!source.pending) {
        return source.live;
      }
      if (
        previous !== undefined &&
        rendersMessages(previous.value) &&
        source.resetCount === previous.source.resetCount &&
        !(previous.source.interacted && !source.interacted)
      ) {
        return previous.value;
      }
      // Nothing rendered to keep (first validation, or the control's
      // placeholder state before it attached), or a reset: blank as before.
      return {
        showErrors: source.live.showErrors,
        errors: [],
        showWarnings: false,
        warnings: [],
      };
    },
    equal: isSameMessageView,
  });

  /**
   * Whether the error region should render, based on the display mode and
   * the control's state (touched/submitted/dirty). Also drives `aria-invalid`
   * in the wrappers and `FormErrorControlDirective`.
   *
   * While the control re-validates (pending), this keeps the value from the
   * last settled result, so the message and `aria-invalid` stay put until the
   * new result lands.
   */
  readonly shouldShowErrors: Signal<boolean> = computed(
    () => this.#view().showErrors
  );

  /**
   * Errors to display: the current messages, or the last settled messages
   * while the control re-validates. Empty while the first validation is
   * pending and right after a reset.
   */
  readonly errors: Signal<string[]> = computed(() => this.#view().errors);

  /**
   * Warnings to display: the current messages, or the last settled messages
   * while the control re-validates. Empty while the first validation is
   * pending and right after a reset.
   */
  readonly warnings: Signal<string[]> = computed(() => this.#view().warnings);

  /**
   * Whether the control is currently being validated (pending)
   * Excludes pristine+untouched controls to prevent "Validating..." on initial load
   */
  readonly isPending: Signal<boolean> = computed(() => {
    // Don't show pending state for pristine untouched controls
    // This prevents "Validating..." message appearing on initial page load
    const state = this.#controlStateDirective.controlState();
    if (state.isPristine && !state.isTouched) {
      return false;
    }
    return this.hasPendingValidation();
  });

  /**
   * Whether the warning region should render, based on the warning display
   * mode and the control's state (touched/validated/dirty).
   *
   * While the control re-validates (pending), this keeps the value from the
   * last settled result, like {@link shouldShowErrors}.
   */
  readonly shouldShowWarnings: Signal<boolean> = computed(
    () => this.#view().showWarnings
  );
}

type MessageView = {
  readonly showErrors: boolean;
  readonly errors: string[];
  readonly showWarnings: boolean;
  readonly warnings: string[];
};

type MessageViewSource = {
  readonly pending: boolean;
  readonly resetCount: number;
  readonly interacted: boolean;
  readonly live: MessageView;
};

/** Whether a view puts any message on screen. */
function rendersMessages(view: MessageView): boolean {
  return (
    (view.showErrors && view.errors.length > 0) ||
    (view.showWarnings && view.warnings.length > 0)
  );
}

function sameMessages(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((message, i) => message === b[i]);
}

function isSameMessageView(a: MessageView, b: MessageView): boolean {
  return (
    a.showErrors === b.showErrors &&
    a.showWarnings === b.showWarnings &&
    sameMessages(a.errors, b.errors) &&
    sameMessages(a.warnings, b.warnings)
  );
}
