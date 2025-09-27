import {
  Directive,
  computed,
  inject,
  input,
  Signal,
  contentChild,
  signal,
  Injector,
  afterEveryRender,
  effect,
} from '@angular/core';
import {
  NgModel,
  NgModelGroup,
  AbstractControlDirective,
} from '@angular/forms';

/**
 * Represents the core state of an Angular form control.
 * Contains only the raw state properties directly from the Angular form system.
 */
export type FormControlState = {
  status: string | null | undefined;
  isValid: boolean | null | undefined;
  isInvalid: boolean | null | undefined;
  isPending: boolean | null | undefined;
  isDisabled: boolean | null | undefined;
  isTouched: boolean | null | undefined;
  isDirty: boolean | null | undefined;
  isPristine: boolean | null | undefined;
  errors: Record<string, unknown> | null | undefined;
};

function getInitialFormControlState(): FormControlState {
  return {
    status: 'INVALID',
    isValid: false,
    isInvalid: true,
    isPending: false,
    isDisabled: false,
    isTouched: false,
    isDirty: false,
    isPristine: true,
    errors: null,
  };
}

@Directive({
  selector: '[formControlState]',
  exportAs: 'formControlState',
})
export class FormControlStateDirective {
  protected readonly contentNgModel: Signal<NgModel | undefined> =
    contentChild(NgModel);
  protected readonly contentNgModelGroup: Signal<NgModelGroup | undefined> =
    contentChild(NgModelGroup);
  #hostNgModel: NgModel | null = inject(NgModel, {
    self: true,
    optional: true,
  });
  #hostNgModelGroup: NgModelGroup | null = inject(NgModelGroup, {
    self: true,
    optional: true,
  });
  #injector = inject(Injector);

  /**
   * Computed signal for the active control (NgModel or NgModelGroup)
   */
  #activeControl = computed((): AbstractControlDirective | null => {
    return (
      this.#hostNgModel ||
      this.#hostNgModelGroup ||
      this.contentNgModel() ||
      this.contentNgModelGroup() ||
      null
    );
  });

  /**
   * Internal signal for robust touched/dirty tracking (syncs after every render)
   */
  readonly #interactionState = signal<{ isTouched: boolean; isDirty: boolean }>(
    {
      isTouched: false,
      isDirty: false,
    }
  );

  /**
   * Internal signal for control state (updated reactively)
   */
  readonly #controlStateSignal = signal<FormControlState>(
    getInitialFormControlState()
  );

  constructor() {
    // Update control state reactively
    effect(() => {
      const control = this.#activeControl();
      const interaction = this.#interactionState();
      if (!control) {
        this.#controlStateSignal.set(getInitialFormControlState());
        return;
      }
      // Listen to control changes
      const sub = control.control?.statusChanges?.subscribe(() => {
        const { status, valid, invalid, pending, disabled, pristine, errors } =
          control;
        this.#controlStateSignal.set({
          status,
          isValid: valid,
          isInvalid: invalid,
          isPending: pending,
          isDisabled: disabled,
          isTouched: interaction.isTouched,
          isDirty: interaction.isDirty,
          isPristine: pristine,
          errors,
        });
      });
      // Initial update
      const { status, valid, invalid, pending, disabled, pristine, errors } =
        control;
      this.#controlStateSignal.set({
        status,
        isValid: valid,
        isInvalid: invalid,
        isPending: pending,
        isDisabled: disabled,
        isTouched: interaction.isTouched,
        isDirty: interaction.isDirty,
        isPristine: pristine,
        errors,
      });
      return () => sub?.unsubscribe();
    });

    // Robustly sync touched/dirty after every render (Angular 18+ best practice)
    afterEveryRender(
      () => {
        const control = this.#activeControl();
        if (control) {
          const current = this.#interactionState();
          const newTouched = control.touched ?? false;
          const newDirty = control.dirty ?? false;
          if (
            newTouched !== current.isTouched ||
            newDirty !== current.isDirty
          ) {
            this.#interactionState.set({
              isTouched: newTouched,
              isDirty: newDirty,
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
   * Recursively flattens Angular error objects into an array of error keys.
   */
  #flattenAngularErrors(errors: Record<string, unknown>): string[] {
    const result: string[] = [];
    for (const key of Object.keys(errors)) {
      const value = errors[key];
      if (typeof value === 'object' && value !== null) {
        result.push(
          ...this.#flattenAngularErrors(value as Record<string, unknown>)
        );
      } else {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Extracts error messages from Angular/Vest errors (recursively flattens)
   */
  readonly errorMessages = computed(() => {
    const state = this.controlState();
    if (!state?.errors) return [];
    // Vest errors are stored in the 'errors' property as an array
    const vestErrors = state.errors['errors'];
    if (Array.isArray(vestErrors)) {
      return vestErrors;
    }
    // Fallback to flattened Angular error keys
    return this.#flattenAngularErrors(state.errors);
  });

  /**
   * ADVANCED: updateOn strategy (change/blur/submit) if available
   */
  readonly updateOn = computed(() => {
    const ngModel = this.contentNgModel() || this.#hostNgModel;
    // Angular's NgModel.options?.updateOn
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
   * Extracts warning messages from Vest validation results (robust)
   */
  readonly warningMessages = computed(() => {
    const state = this.controlState();
    if (!state?.errors) return [];
    const warnings = state.errors['warnings'];
    if (Array.isArray(warnings)) {
      return warnings;
    }
    // Optionally, flatten nested warnings if needed in future
    return [];
  });

  /**
   * Whether async validation is in progress
   */
  readonly hasPendingValidation = computed(
    () => !!this.controlState().isPending
  );

  /**
   * Convenience signals for common state checks
   */
  readonly isValid = computed(() => this.controlState().isValid || false);
  readonly isInvalid = computed(() => this.controlState().isInvalid || false);
  readonly isPending = computed(() => this.controlState().isPending || false);
  readonly isTouched = computed(() => this.controlState().isTouched || false);
  readonly isDirty = computed(() => this.controlState().isDirty || false);
  readonly isPristine = computed(() => this.controlState().isPristine || false);
  readonly isDisabled = computed(() => this.controlState().isDisabled || false);
  readonly hasErrors = computed(() => this.errorMessages().length > 0);
}

// vestTest('email', 'Please provide a valid email', () => {
//     enforce(data.email).lengthEquals(1);
//   });
