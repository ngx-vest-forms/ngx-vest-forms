import {
  Directive,
  Signal,
  computed,
  contentChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControlDirective,
  NgModel,
  NgModelGroup,
} from '@angular/forms';
import { merge, of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

/**
 * Represents the core state of an Angular form control.
 * Contains only the raw state properties directly from the Angular form system.
 * For derived/processed properties like errorMessages, use the separate signals.
 */
export type NgxFormControlState = {
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

/**
 * Creates an initial blank state for a form control.
 * This is used as the default value before a real control is connected.
 */
export function getInitialNgxFormControlState(): NgxFormControlState {
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

/**
 * Directive: ngxFormControlState
 *
 * Provides reactive signals for accessing the core state of Angular form controls and Vest validation results.
 * This directive focuses on WHAT data is available from form controls, without opinions on WHEN or HOW to display it.
 *
 * Use this directive when you need raw form state and parsed error messages, but want complete control over
 * display logic. For built-in display behavior (like showing errors on touch/submit), use NgxFormErrorDisplayDirective instead.
 *
 * Key features:
 * - Creates a reactive bridge between Angular's form system and the signals API
 * - Extracts and processes Vest validation results into usable formats
 * - Provides granular reactivity through separate signals for different aspects of form state
 * - Maintains clear separation between raw form state and derived validation data
 *
 * Available signals:
 * - `controlState`: Core Angular form control state (valid, touched, errors, etc.)
 * - `errorMessages`: User-friendly error messages extracted from Vest validation
 * - `warningMessages`: Non-blocking warning messages from Vest validation
 * - `hasPendingValidation`: Whether async validation is in progress
 *
 * Basic usage:
 * ```html
 * <div ngxFormControlState #state="formControlState">
 *   <input type="text" name="username" ngModel />
 *
 *   @if (state.controlState().isTouched && state.errorMessages().length) {
 *     <div class="errors">
 *       @for (error of state.errorMessages(); track error) {
 *         <div class="error">{{ error }}</div>
 *       }
 *     </div>
 *   }
 * </div>
 * ```
 *
 *
 * ## Composition & hostDirectives
 *
 * This directive is designed to be used as a `hostDirective` in your own components or directives, embracing Angular's composition API. This is the recommended approach for composing form state logic into custom controls or wrappers.
 *
 * Example:
 * ```typescript
 * @Component({
 *   ...,
 *   hostDirectives: [NgxFormControlStateDirective],
 * })
 * export class MyCustomFieldComponent { ... }
 * ```
 *
 * See also: NgxFormErrorDisplayDirective for built-in display logic with configurable error visibility modes.
 */
@Directive({
  selector: '[ngxFormControlState]',
  exportAs: 'formControlState',
})
export class NgxFormControlStateDirective {
  /**
   * Signal for the nearest NgModel or NgModelGroup in content or host.
   * Returns the active AbstractControlDirective or null if not found.
   */
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

  /**
   * Computed signal for the active control (NgModel, NgModelGroup, or null).
   */
  readonly #activeControl: Signal<AbstractControlDirective | null> = computed(
    () => {
      return (
        this.contentNgModel() ||
        this.contentNgModelGroup() ||
        this.#hostNgModel ||
        this.#hostNgModelGroup ||
        null
      );
    },
  );

  /**
   * Signal to track touched/dirty state separately since these don't emit through observables
   */
  readonly #interactionState = signal({
    isTouched: false,
    isDirty: false,
  });

  constructor() {
    // Effect to track touched/dirty state changes that Angular doesn't emit through observables
    // Use a more robust approach with timer to ensure we capture all state changes
    effect((onCleanup) => {
      const control = this.#activeControl();
      if (control) {
        // Check state immediately
        this.#interactionState.set({
          isTouched: control.touched ?? false,
          isDirty: control.dirty ?? false,
        });

        // Set up periodic checking to catch state changes that don't emit through observables
        const intervalId = setInterval(() => {
          const currentTouched = control.touched ?? false;
          const currentDirty = control.dirty ?? false;
          const currentState = this.#interactionState();

          if (
            currentTouched !== currentState.isTouched ||
            currentDirty !== currentState.isDirty
          ) {
            this.#interactionState.set({
              isTouched: currentTouched,
              isDirty: currentDirty,
            });
          }
        }, 50); // Check every 50ms

        onCleanup(() => clearInterval(intervalId));
      }
    });
  }

  /**
   * Enhanced control state using toSignal for reactive state management
   *
   * Angular v20 best practice: Use toSignal with proper observable streams
   * for zoneless compatibility and optimal performance
   */
  readonly #controlStateSignal = toSignal(
    toObservable(this.#activeControl).pipe(
      switchMap((control) => {
        if (control) {
          // Combine multiple event streams to capture all state changes
          const statusChanges$ = control.statusChanges || of(control.status);
          const valueChanges$ = control.valueChanges || of(control.value);

          return merge(statusChanges$, valueChanges$).pipe(
            startWith(null), // Emit initial state immediately
            map(() => this.#extractControlState(control)),
          );
        }
        return of(getInitialNgxFormControlState());
      }),
    ),
    {
      initialValue: getInitialNgxFormControlState(),
      requireSync: false, // Zoneless compatibility
    },
  );

  /**
   * Extract control state - centralized for consistency
   */
  #extractControlState(control: AbstractControlDirective): NgxFormControlState {
    return {
      status: control.status,
      isValid: control.valid,
      isInvalid: control.invalid,
      isPending: control.pending,
      isDisabled: control.disabled,
      isTouched: control.touched,
      isDirty: control.dirty,
      isPristine: control.pristine,
      errors: control.errors,
    };
  }

  /**
   * Main control state computed signal - simplified and more reliable
   *
   * Angular v20 best practice: Use computed for derived state
   */
  readonly controlState = computed(() => {
    const baseState = this.#controlStateSignal();
    const interactionState = this.#interactionState();
    const control = this.#activeControl();

    // Merge base state with more up-to-date interaction state
    const mergedState = {
      ...baseState,
      isTouched: interactionState.isTouched || baseState.isTouched,
      isDirty: interactionState.isDirty || baseState.isDirty,
      isPristine: !(interactionState.isDirty || baseState.isDirty),
    };

    // Enhanced state with derived properties
    const hasErrors = !!(
      mergedState.errors && Object.keys(mergedState.errors).length > 0
    );

    return {
      ...mergedState,
      hasErrors,
      isValidTouched: mergedState.isValid && mergedState.isTouched,
      isInvalidTouched: mergedState.isInvalid && mergedState.isTouched,
      shouldShowErrors:
        (mergedState.isInvalid && mergedState.isTouched) || false,
      controlRef: control,
    } as NgxFormControlState & {
      hasErrors: boolean;
      isValidTouched: boolean;
      isInvalidTouched: boolean;
      shouldShowErrors: boolean;
      controlRef: AbstractControlDirective | null;
    };
  });

  /**
   * Enhanced error messages using computed for better reactivity
   *
   * Key improvements:
   * - Uses computed for purely derived state (no internal state to maintain)
   * - Better timing and elimination of race conditions
   * - More efficient updates when only errors change
   * - Improved extraction of multiple Vest error messages
   */
  readonly errorMessages = computed(() => {
    const state = this.controlState();

    if (!state.errors) {
      return [];
    }

    // Extract Vest-specific error messages - check all possible locations
    const allErrors: string[] = [];

    // 1. Direct errors array property
    const vestErrors = state.errors['errors'];
    if (Array.isArray(vestErrors)) {
      allErrors.push(...vestErrors);
    }

    // 2. Check for multiple field-specific error arrays (in case Vest structures differently)
    for (const [key, value] of Object.entries(state.errors)) {
      if (key !== 'errors' && key !== 'warnings' && Array.isArray(value)) {
        allErrors.push(...value);
      }
    }

    // 3. If we found Vest errors, return them
    if (allErrors.length > 0) {
      return allErrors;
    }

    // 4. Fallback to standard Angular error messages
    if (Object.keys(state.errors).length > 0) {
      return Object.keys(state.errors).map((key) => {
        const errorValue = state.errors?.[key];
        return typeof errorValue === 'string' ? errorValue : key;
      });
    }

    return [];
  });

  /**
   * Enhanced warning messages using computed for better reactivity
   * Warnings are non-blocking validation messages that don't prevent form submission.
   */
  readonly warningMessages = computed(() => {
    const state = this.controlState();

    // Extract Vest-specific warning messages from multiple possible locations
    // 1. Direct warnings property
    const directWarnings = state.errors?.['warnings'];
    if (Array.isArray(directWarnings)) {
      return directWarnings;
    }

    // 2. Warnings attached to error arrays (non-enumerable)
    const errorsArray = state.errors?.['errors'];
    if (Array.isArray(errorsArray)) {
      const warningsProperty = Object.getOwnPropertyDescriptor(
        errorsArray,
        'warnings',
      );
      if (warningsProperty && Array.isArray(warningsProperty.value)) {
        return warningsProperty.value;
      }
    }

    // 3. Check if there's an empty errors array but with warnings attached
    if (state.errors && Object.keys(state.errors).length > 0) {
      for (const value of Object.values(state.errors)) {
        if (Array.isArray(value)) {
          const warningsProperty = Object.getOwnPropertyDescriptor(
            value,
            'warnings',
          );
          if (warningsProperty && Array.isArray(warningsProperty.value)) {
            return warningsProperty.value;
          }
        }
      }
    }

    return [];
  });

  /**
   * Enhanced pending validation detection using computed for better reactivity
   */
  readonly hasPendingValidation = computed(() => {
    return !!this.controlState().isPending;
  });

  /**
   * Enhanced updateOn detection using computed for better reactivity
   */
  readonly updateOn = computed(() => {
    const ngModel = this.contentNgModel() || this.#hostNgModel;
    return ngModel?.options?.updateOn ?? 'change';
  });

  /// --- ENHANCED CONVENIENCE SIGNALS ---

  /**
   * Convenience signals for common state checks using computed for optimal performance
   */
  readonly isValid = computed(() => this.controlState().isValid || false);
  readonly isInvalid = computed(() => this.controlState().isInvalid || false);
  readonly isPending = computed(() => this.controlState().isPending || false);
  readonly isTouched = computed(() => this.controlState().isTouched || false);
  readonly isDirty = computed(() => this.controlState().isDirty || false);
  readonly isPristine = computed(() => this.controlState().isPristine || false);
  readonly isDisabled = computed(() => this.controlState().isDisabled || false);
  readonly hasErrors = computed(() => this.controlState().hasErrors || false);

  /**
   * Enhanced composite state signals for common validation patterns
   */
  readonly isValidAndTouched = computed(
    () => this.isValid() && this.isTouched(),
  );

  readonly isInvalidAndTouched = computed(
    () => this.isInvalid() && this.isTouched(),
  );

  readonly shouldShowValidation = computed(
    () => this.isTouched() && !this.isPending(),
  );

  readonly shouldShowErrors = computed(
    () => this.controlState().shouldShowErrors || false,
  );
}
