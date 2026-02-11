import {
  Directive,
  Injector,
  afterEveryRender,
  computed,
  contentChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControlDirective,
  NgModel,
  NgModelGroup,
  ValidationErrors,
} from '@angular/forms';
import { FormDirective } from './form.directive';

/**
 * Angular's ValidationErrors is `{ [key: string]: any }`.
 * We extend it with Vest-specific structure for better type safety.
 */
export type VestValidationErrors = {
  /** Vest error messages array */
  errors?: readonly string[];
  /** Vest warning messages array */
  warnings?: readonly string[];
} & ValidationErrors;

/**
 * Form control status values as defined by Angular.
 * @see AbstractControl.status
 */
export type FormControlStatus = 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED';

/**
 * Represents the core state of an Angular form control.
 * Uses narrower types than Angular's defaults where possible.
 */
export type FormControlState = {
  readonly status: FormControlStatus | null;
  readonly isValid: boolean;
  readonly isInvalid: boolean;
  readonly isPending: boolean;
  readonly isDisabled: boolean;
  readonly isTouched: boolean;
  readonly isDirty: boolean;
  readonly isPristine: boolean;
  /** Errors from Angular validators or Vest validation */
  readonly errors: VestValidationErrors | null;
};

const INITIAL_FORM_CONTROL_STATE = {
  status: 'INVALID',
  isValid: false,
  isInvalid: true,
  isPending: false,
  isDisabled: false,
  isTouched: false,
  isDirty: false,
  isPristine: true,
  errors: null,
} as const satisfies FormControlState;

@Directive({
  selector: '[formControlState], [ngxControlState]',
  exportAs: 'formControlState, ngxControlState',
})
export class FormControlStateDirective {
  protected readonly contentNgModel = contentChild(NgModel);
  protected readonly contentNgModelGroup = contentChild(NgModelGroup);

  readonly #hostNgModel = inject(NgModel, { self: true, optional: true });
  readonly #hostNgModelGroup = inject(NgModelGroup, {
    self: true,
    optional: true,
  });
  readonly #injector = inject(Injector);

  /**
   * Reference to the parent FormDirective for accessing field warnings.
   * Optional to support usage outside of ngxVestForm context.
   */
  readonly #formDirective = inject(FormDirective, { optional: true });

  /**
   * Computed signal for the active control (NgModel or NgModelGroup)
   */
  readonly #activeControl = computed(
    (): AbstractControlDirective | null =>
      this.#hostNgModel ||
      this.#hostNgModelGroup ||
      this.contentNgModel() ||
      this.contentNgModelGroup() ||
      null
  );

  /**
   * Consolidated internal signal for interaction state tracking.
   * Combines touched, dirty, and hasBeenValidated into a single signal
   * to reduce signal overhead and simplify state updates.
   */
  readonly #interactionState = signal({
    isTouched: false,
    isDirty: false,
    hasBeenValidated: false,
  });

  /**
   * Track the previous status to detect actual status changes (not just status emissions).
   * This helps distinguish between initial control creation and actual re-validation.
   */
  #previousStatus: FormControlStatus | null = null;

  /**
   * Internal signal for control state (updated reactively)
   */
  readonly #controlStateSignal = signal<FormControlState>(
    INITIAL_FORM_CONTROL_STATE
  );

  constructor() {
    // Update control state reactively with proper cleanup
    effect((onCleanup) => {
      const control = this.#activeControl();
      const interaction = this.#interactionState();

      if (!control) {
        this.#controlStateSignal.set(INITIAL_FORM_CONTROL_STATE);
        return;
      }

      // Listen to control changes
      const sub = control.control?.statusChanges?.subscribe(() => {
        const {
          status,
          valid,
          invalid,
          pending,
          disabled,
          pristine,
          errors,
          touched,
        } = control;

        const currentStatus = status as FormControlStatus | null;

        // Mark as validated when any of the following conditions are met:
        // 1. The control has been touched (user blurred the field).
        // 2. The control's status has actually changed (not the first status emission),
        //    AND the new status is not 'PENDING' (validation completed).
        //
        // This ensures hasBeenValidated is true for:
        //   - User blur events (touched becomes true)
        //   - Any validation that changes status (e.g., typing then validation completes)
        //   - ValidationConfig-triggered validations (status changed without touch/dirty)
        // But NOT for initial page load validations (previousStatus === null).
        //
        // Note: The dirty check was removed to support validationConfig-triggered validations.
        // This allows warnings to show even when the field hasn't been touched/dirtied by the user.
        //
        // Accessibility: The logic is structured for clarity and maintainability.
        // IMPORTANT: Read touched/dirty directly from control, not from signal,
        // to avoid race conditions with afterEveryRender sync.
        if (
          touched || // Control was blurred (most common case)
          (this.#previousStatus !== null && // Not the first status emission
            this.#previousStatus !== currentStatus && // Status actually changed
            currentStatus !== null &&
            currentStatus !== 'PENDING') // Validation completed (not pending)
        ) {
          this.#interactionState.update((state) => ({
            ...state,
            hasBeenValidated: true,
          }));
        }

        // Track current status for next iteration
        this.#previousStatus = currentStatus;

        this.#controlStateSignal.set({
          status: currentStatus,
          isValid: valid ?? false,
          isInvalid: invalid ?? false,
          isPending: pending ?? false,
          isDisabled: disabled ?? false,
          isTouched: interaction.isTouched,
          isDirty: interaction.isDirty,
          isPristine: pristine ?? true,
          errors: errors as VestValidationErrors | null,
        });
      });

      // Initial update
      const { status, valid, invalid, pending, disabled, pristine, errors } =
        control;

      const initialStatus = status as FormControlStatus | null;
      this.#previousStatus = initialStatus;

      this.#controlStateSignal.set({
        status: initialStatus,
        isValid: valid ?? false,
        isInvalid: invalid ?? false,
        isPending: pending ?? false,
        isDisabled: disabled ?? false,
        isTouched: interaction.isTouched,
        isDirty: interaction.isDirty,
        isPristine: pristine ?? true,
        errors: errors as VestValidationErrors | null,
      });

      // Proper cleanup using onCleanup callback (Angular 21 best practice)
      onCleanup(() => sub?.unsubscribe());
    });

    // Robustly sync touched/dirty/pending after every render (Angular 18+ best practice)
    // This handles cases where statusChanges events are missed or delayed
    afterEveryRender(
      () => {
        const control = this.#activeControl();
        if (control) {
          const currentInteraction = this.#interactionState();
          const currentState = this.#controlStateSignal();
          const newTouched = control.touched ?? false;
          const newDirty = control.dirty ?? false;

          // Sync interaction state (touched/dirty)
          if (
            newTouched !== currentInteraction.isTouched ||
            newDirty !== currentInteraction.isDirty
          ) {
            // Mark as validated when control becomes touched (e.g., user blurred the field)
            // This handles the case where blur doesn't trigger statusChanges (field already invalid)
            const shouldMarkValidated =
              newTouched && !currentInteraction.isTouched;

            this.#interactionState.update((state) => ({
              ...state,
              isTouched: newTouched,
              isDirty: newDirty,
              hasBeenValidated: shouldMarkValidated
                ? true
                : state.hasBeenValidated,
            }));
          }

          // Sync pending state only when it transitions from true to false
          // This fixes "Validating..." being stuck when statusChanges misses the transition
          // We only sync when pending goes false to avoid interfering with async validation in progress
          const controlPending = control.pending ?? false;
          if (currentState.isPending && !controlPending) {
            // Pending changed from true to false - update the full state
            const newStatus = control.status as FormControlStatus | null;
            this.#controlStateSignal.set({
              status: newStatus,
              isPending: false,
              isValid: control.valid ?? false,
              isInvalid: control.invalid ?? false,
              isPristine: control.pristine ?? true,
              isDisabled: control.disabled ?? false,
              isTouched: newTouched,
              isDirty: newDirty,
              errors: control.errors as VestValidationErrors | null,
            });
          }
        }
      },
      { injector: this.#injector }
    );
  }

  /**
   * Main control state computed signal (merges robust touched/dirty)
   */
  readonly controlState = computed(() => this.#controlStateSignal());

  /**
   * Recursively flattens Angular error objects into an array of error messages.
   * Handles string values, objects with a message property, and nested structures.
   */
  #flattenAngularErrors(errors: Record<string, unknown>): string[] {
    const result: string[] = [];

    for (const key of Object.keys(errors)) {
      const value: unknown = errors[key];

      if (typeof value === 'string') {
        // String values: push the value itself, not the key
        result.push(value);
      } else if (isErrorWithMessage(value)) {
        // Objects with a 'message' property: extract the message
        result.push(value.message);
      } else if (typeof value === 'object' && value !== null) {
        // Nested objects/arrays: recursively flatten
        result.push(
          ...this.#flattenAngularErrors(value as Record<string, unknown>)
        );
      } else {
        // Fallback: push the key for primitive types (backward compatibility)
        result.push(key);
      }
    }

    return result;
  }

  /**
   * Extracts error messages from Angular/Vest errors (recursively flattens)
   */
  readonly errorMessages = computed((): string[] => {
    const { errors } = this.controlState();
    if (!errors) return [];

    // Vest errors are stored in the 'errors' property as an array
    const vestErrors = errors.errors;
    if (vestErrors) {
      return (vestErrors as readonly unknown[])
        .map((error) => normalizeErrorMessage(error))
        .filter((error): error is string => Boolean(error));
    }

    // Fallback to flattened Angular error keys, excluding 'warnings' key
    // to prevent warnings from appearing in the error list
    const errorsWithoutWarnings = { ...errors };
    delete errorsWithoutWarnings['warnings'];
    return this.#flattenAngularErrors(errorsWithoutWarnings);
  });

  /**
   * ADVANCED: updateOn strategy (change/blur/submit) if available
   */
  readonly updateOn = computed((): 'change' | 'blur' | 'submit' => {
    const ngModel = this.contentNgModel() || this.#hostNgModel;
    return ngModel?.options?.updateOn ?? 'change';
  });

  /**
   * ADVANCED: Composite/derived signals for advanced error display logic
   */
  readonly isValidTouched = computed(() => this.isValid() && this.isTouched());

  readonly isInvalidTouched = computed(
    () => this.isInvalid() && this.isTouched()
  );

  readonly shouldShowErrors = computed(
    () => this.isInvalid() && this.isTouched() && !this.isPending()
  );

  /**
   * Extracts warning messages from Vest validation results.
   * Checks two sources:
   * 1. control.errors.warnings (when errors exist alongside warnings)
   * 2. FormDirective.fieldWarnings (for warnings-only scenarios)
   * This dual-source approach allows warnings to be displayed without affecting field validity.
   */
  readonly warningMessages = computed((): string[] => {
    // Source 1: warnings from control.errors (when field has errors)
    const { errors } = this.controlState();

    // Always read fieldWarnings signal to ensure reactive tracking
    // This must be read unconditionally for proper signal dependency tracking
    const fieldWarnings = this.#formDirective?.fieldWarnings();
    const activeControl = this.#activeControl();

    // If we have warnings in control.errors, use those (errors+warnings case)
    if (errors?.warnings) {
      return [...errors.warnings];
    }

    // Source 2: warnings from FormDirective (for warnings-only scenarios)
    // When a field only has warnings (no errors), they're stored in fieldWarnings
    // to keep the field valid while still allowing warnings to be displayed.
    if (fieldWarnings && activeControl) {
      // Get the field path from the control's path property
      // NgModel.path returns an array like ['passwords', 'password'] which needs to be joined
      const path = (activeControl as { path?: string[] }).path;
      if (path?.length) {
        const fieldPath = path.join('.');
        const warnings = fieldWarnings.get(fieldPath);
        if (warnings) {
          return [...warnings];
        }
      }
    }

    return [];
  });

  /**
   * Whether async validation is in progress
   */
  readonly hasPendingValidation = computed(() => this.controlState().isPending);

  /**
   * Convenience signals for common state checks
   */
  readonly isValid = computed(() => this.controlState().isValid);
  readonly isInvalid = computed(() => this.controlState().isInvalid);
  readonly isPending = computed(() => this.controlState().isPending);
  readonly isTouched = computed(() => this.controlState().isTouched);
  readonly isDirty = computed(() => this.controlState().isDirty);
  readonly isPristine = computed(() => this.controlState().isPristine);
  readonly isDisabled = computed(() => this.controlState().isDisabled);
  readonly hasErrors = computed(() => this.errorMessages().length > 0);

  /**
   * Whether this control has been validated at least once.
   * True after the first validation completes, even if the user hasn't touched the field.
   * This enables showing errors for validationConfig-triggered validations.
   */
  readonly hasBeenValidated = computed(
    () => this.#interactionState().hasBeenValidated
  );
}

/**
 * Type guard for objects with a message property
 */
function isErrorWithMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}

function normalizeErrorMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (isErrorWithMessage(value)) {
    return value.message;
  }

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}
