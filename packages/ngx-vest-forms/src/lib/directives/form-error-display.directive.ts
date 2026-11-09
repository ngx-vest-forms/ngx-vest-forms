import {
  computed,
  Directive,
  effect,
  inject,
  input,
  isDevMode,
  signal,
  Signal,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  FormResetEvent,
  NgForm,
  StatusChangeEvent,
} from '@angular/forms';
import {
  logDiagnostic,
  NGX_VEST_FORMS_DIAGNOSTICS,
} from '../errors/error-catalog';
import { fastDeepEqual } from '../utils/equality';
import {
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  NGX_WARNING_DISPLAY_MODE_TOKEN,
} from './error-display-mode.token';
import {
  AttachedControl,
  extractErrorMessages,
  extractWarningMessages,
  FormControlStateDirective,
  getAttachedControl,
  VestValidationErrors,
} from './form-control-state.directive';
import { getFormSubmittedSignal } from './form-submitted-state';
import { FormDirective } from './form.directive';
import { onValidationReset } from './validation-reset';

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
  readonly #attached = getAttachedControl(this.#controlStateDirective);
  readonly #fieldWarnings = inject(FormDirective, { optional: true })
    ?.fieldWarnings;
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

    // Track the attached control's own events to keep the hold (see
    // `#hold`). The effect only (re)subscribes when the control changes;
    // the hold itself is written synchronously from the events, so a result
    // that settles and re-pends before change detection is still seen.
    effect((onCleanup) => {
      const attached = this.#attached();
      if (!attached) return;
      const unsubscribe = untracked(() => this.#trackHold(attached));
      onCleanup(unsubscribe);
    });
  }

  /**
   * The messages kept on screen while the attached control re-validates,
   * keyed to that control.
   *
   * Without a hold, Angular's PENDING status (errors cleared, `invalid`
   * false) blanked the messages on every async re-check, so a message
   * vanished and came back and a polite live region announced it again.
   *
   * Written only from the control's events, synchronously:
   * - on every settled status, the result is stored (not yet shown);
   * - when a check starts (status turns PENDING), the latest stored result,
   *   filtered by what the display mode showed at that moment, becomes the
   *   hold. Messages the mode was hiding stay hidden until the new result
   *   settles, even if the field is blurred or submitted mid-check;
   * - the control's own `FormResetEvent` (its `reset()`, also when a parent
   *   resets) and `FormDirective.resetField()` drop both.
   * A control's first-ever validation has no stored result, so nothing is
   * held.
   */
  readonly #hold = signal<Hold | null>(null, { equal: isSameHold });

  /**
   * Subscribes to `attached.control`'s events and maintains `#hold` for it.
   * Returns the teardown.
   */
  #trackHold(attached: AttachedControl): () => void {
    const { control } = attached;
    let settled: SettledResult | null = control.pending
      ? null
      : this.#readSettled(attached);
    let wasPending = control.pending;
    this.#hold.set(null);

    const drop = (): void => {
      settled = null;
      this.#hold.set(null);
    };

    const subscription = control.events.subscribe((event) => {
      if (event instanceof FormResetEvent) {
        drop();
        return;
      }
      if (!(event instanceof StatusChangeEvent)) return;
      if (!control.pending) {
        settled = this.#readSettled(attached);
        wasPending = false;
        return;
      }
      if (!wasPending) {
        wasPending = true;
        this.#hold.set(settled ? { control, view: this.#gate(settled) } : null);
      }
    });
    subscription.add(onValidationReset(control).subscribe(drop));

    return () => {
      subscription.unsubscribe();
      this.#hold.set(null);
    };
  }

  /** The control's result as it settled, read straight from the control. */
  #readSettled({ control, path }: AttachedControl): SettledResult {
    const errors = control.errors as VestValidationErrors | null;
    const errorMessages = extractErrorMessages(errors);
    return {
      errors: errorMessages,
      hasErrorState: errorMessages.length > 0 || control.invalid,
      warnings: extractWarningMessages(
        errors,
        this.#fieldWarnings ? untracked(this.#fieldWarnings) : undefined,
        path
      ),
    };
  }

  /** What the display mode shows of `settled` right now. */
  #gate(settled: SettledResult): MessageView {
    return untracked(() => {
      const showErrors = errorGateOpen({
        mode: this.errorDisplayMode(),
        updateOn: this.updateOn(),
        isTouched: this.isTouched(),
        isDirty: this.isDirty(),
        formSubmitted: this.formSubmitted(),
        hasErrorState: settled.hasErrorState,
      });
      const showWarnings = warningGateOpen({
        mode: this.warningDisplayMode(),
        isTouched: this.isTouched(),
        isDirty: this.isDirty(),
        hasBeenValidated: this.hasBeenValidated(),
        formSubmitted: this.formSubmitted(),
        hasWarnings: settled.warnings.length > 0,
      });
      return {
        showErrors,
        errors: showErrors ? settled.errors : [],
        showWarnings,
        warnings: showWarnings ? settled.warnings : [],
      };
    });
  }

  /**
   * Whether the control's *current* state calls for showing errors. While
   * the control is pending this is usually `false` (Angular clears the
   * errors and the invalid flag until the async result lands); the hold
   * covers that window.
   */
  readonly #liveShowErrors = computed(() =>
    errorGateOpen({
      mode: this.errorDisplayMode(),
      updateOn: this.updateOn(),
      isTouched: this.isTouched(),
      isDirty: this.isDirty(),
      formSubmitted: this.formSubmitted(),
      hasErrorState: this.errorMessages().length > 0 || this.isInvalid(),
    })
  );

  /** Whether the control's *current* state calls for showing warnings. */
  readonly #liveShowWarnings = computed(() =>
    warningGateOpen({
      mode: this.warningDisplayMode(),
      isTouched: this.isTouched(),
      isDirty: this.isDirty(),
      hasBeenValidated: this.hasBeenValidated(),
      formSubmitted: this.formSubmitted(),
      hasWarnings: this.warningMessages().length > 0,
    })
  );

  /**
   * What the regions render: the live state while the control is settled;
   * while it is pending, the hold for this control, or nothing.
   */
  readonly #view = computed<MessageView>(
    () => {
      const live: MessageView = {
        showErrors: this.#liveShowErrors(),
        errors: this.errorMessages(),
        showWarnings: this.#liveShowWarnings(),
        warnings: this.warningMessages(),
      };
      if (!this.hasPendingValidation()) {
        return live;
      }
      const hold = this.#hold();
      if (hold && hold.control === this.#attached()?.control) {
        return hold.view;
      }
      return {
        showErrors: live.showErrors,
        errors: [],
        showWarnings: false,
        warnings: [],
      };
    },
    { equal: fastDeepEqual }
  );

  /**
   * Whether the error region should render, based on the display mode and
   * the control's state (touched/submitted/dirty). Also drives `aria-invalid`
   * in the wrappers and `FormErrorControlDirective`.
   *
   * We check both hasErrors (extracted error messages) AND isInvalid (Angular's validation state)
   * because in some cases (like conditional validations via validationConfig), the control is marked
   * as invalid by Angular before error messages are extracted from Vest. This ensures aria-invalid
   * is set correctly even during the validation propagation delay.
   *
   * For validationConfig-triggered validations, a field may become invalid before it has been
   * touched. Error visibility still respects the field's own `errorDisplayMode`, so untouched
   * dependent fields can remain visually quiet until blur or submit.
   *
   * While the control re-validates (pending), this keeps what was shown when
   * the check started, from the latest settled result, until the new result
   * lands.
   */
  readonly shouldShowErrors: Signal<boolean> = computed(
    () => this.#view().showErrors
  );

  /**
   * Errors to display: the current messages, or the shown messages of the
   * latest settled result while the control re-validates. Empty while a
   * control's first validation is pending and right after a reset.
   */
  readonly errors: Signal<string[]> = computed(() => this.#view().errors);

  /**
   * Warnings to display: the current messages, or the shown messages of the
   * latest settled result while the control re-validates. Empty while a
   * control's first validation is pending and right after a reset.
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
   * NOTE: Unlike errors, warnings can exist on VALID fields (warnings-only scenario).
   * We don't require isInvalid() because Vest warn() tests don't affect field validity.
   *
   * UX Note: We include `hasBeenValidated` for `on-validated-or-touch` mode to support
   * cross-field validation. If Field A triggers validation on Field B (via validationConfig),
   * Field B should show warnings if it has them, even if the user hasn't touched Field B yet.
   * Unlike errors (which block submission), warnings are informational and safe to show.
   *
   * While the control re-validates (pending), this keeps what was shown when
   * the check started, like {@link shouldShowErrors}.
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

/** A settled validation result of the attached control. */
type SettledResult = {
  readonly errors: string[];
  readonly hasErrorState: boolean;
  readonly warnings: string[];
};

type Hold = {
  readonly control: AbstractControl;
  readonly view: MessageView;
};

function isSameHold(a: Hold | null, b: Hold | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  return a.control === b.control && fastDeepEqual(a.view, b.view);
}

/** Whether the error display mode shows errors for this state. */
function errorGateOpen(state: {
  mode: NgxErrorDisplayMode;
  updateOn: 'change' | 'blur' | 'submit';
  isTouched: boolean;
  isDirty: boolean;
  formSubmitted: boolean;
  hasErrorState: boolean;
}): boolean {
  const { mode, isTouched, isDirty, formSubmitted, hasErrorState } = state;

  // Always only show errors after submit if updateOn is 'submit'
  if (state.updateOn === 'submit') {
    return formSubmitted && hasErrorState;
  }

  switch (mode) {
    case 'always':
      // Always show errors immediately, even on pristine fields
      return hasErrorState;

    case 'on-dirty':
      // Show when value has changed, OR when touched/submitted (for backwards compat)
      return (isDirty || isTouched || formSubmitted) && hasErrorState;

    case 'on-blur':
      // Show after touch (blur) or form submission (traditional behavior, not dirty-based)
      return (isTouched || formSubmitted) && hasErrorState;

    case 'on-submit':
      // Show only after form submission
      return formSubmitted && hasErrorState;

    default:
      // 'on-blur-or-submit': show after blur (touch) OR submit
      return (isTouched || formSubmitted) && hasErrorState;
  }
}

/** Whether the warning display mode shows warnings for this state. */
function warningGateOpen(state: {
  mode: NgxWarningDisplayMode;
  isTouched: boolean;
  isDirty: boolean;
  hasBeenValidated: boolean;
  formSubmitted: boolean;
  hasWarnings: boolean;
}): boolean {
  const { mode, isTouched, isDirty, hasBeenValidated, formSubmitted } = state;
  if (!state.hasWarnings) {
    return false;
  }

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

    default:
      // 'on-validated-or-touch': show after validation runs or after touch/submit
      return hasBeenValidated || isTouched || formSubmitted;
  }
}
