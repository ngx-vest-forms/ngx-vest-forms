import {
  Directive,
  Signal,
  computed,
  contentChild,
  inject,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControlDirective,
  NgModel,
  NgModelGroup,
} from '@angular/forms';
import { of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

/**
 * Represents the core state of an Angular form control.
 * Contains only the raw state properties directly from the Angular form system.
 * For derived/processed properties like errorMessages, use the separate signals.
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

/**
 * Creates an initial blank state for a form control.
 * This is used as the default value before a real control is connected.
 */
export function getInitialFormControlState(): FormControlState {
  return {
    status: undefined,
    isValid: undefined,
    isInvalid: undefined,
    isPending: undefined,
    isDisabled: undefined,
    isTouched: undefined,
    isDirty: undefined,
    isPristine: undefined,
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
 * display logic. For built-in display behavior (like showing errors on touch/submit), use FormErrorDisplayDirective instead.
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
 *   hostDirectives: [FormControlStateDirective],
 * })
 * export class MyCustomFieldComponent { ... }
 * ```
 *
 * See also: FormErrorDisplayDirective for built-in display logic with configurable error visibility modes.
 */
@Directive({
  selector: '[ngxFormControlState]',
  exportAs: 'formControlState',
})
export class FormControlStateDirective {
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
   * Raw control state using toSignal for Observable -> Signal conversion
   * This provides the foundation for the enhanced linkedSignal state
   */
  readonly #rawControlState = toSignal(
    toObservable(this.#activeControl).pipe(
      switchMap((control) => {
        if (control && control.statusChanges) {
          return control.statusChanges.pipe(
            startWith(control.status),
            map(() => ({
              status: control.status,
              isValid: control.valid,
              isInvalid: control.invalid,
              isPending: control.pending,
              isDisabled: control.disabled,
              isTouched: control.touched,
              isDirty: control.dirty,
              isPristine: control.pristine,
              errors: control.errors,
            })),
          );
        }
        return of(getInitialFormControlState());
      }),
    ),
    { initialValue: getInitialFormControlState() },
  );

  /**
   * Enhanced control state using computed for reactive state synchronization
   *
   * Key improvements:
   * - Uses computed for simpler, more reliable reactivity
   * - Provides enhanced state properties for common use cases
   * - Better timing and elimination of race conditions
   * - Cleaner dependency tracking
   */
  readonly controlState = computed(() => {
    const rawState = this.#rawControlState();
    const control = this.#activeControl();

    // Enhanced state with additional derived properties
    const hasErrors = !!(
      rawState.errors && Object.keys(rawState.errors).length > 0
    );

    return {
      ...rawState,
      // Add computed properties that depend on multiple state aspects
      hasErrors,
      isValidTouched: rawState.isValid && rawState.isTouched,
      isInvalidTouched: rawState.isInvalid && rawState.isTouched,
      shouldShowErrors: (rawState.isInvalid && rawState.isTouched) || false,

      // Add control reference for advanced use cases
      controlRef: control,
    } as FormControlState & {
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
   */
  readonly errorMessages = computed(() => {
    const state = this.controlState();

    // Extract Vest-specific error messages
    const vestErrors = state.errors?.['errors'];
    if (Array.isArray(vestErrors)) {
      return vestErrors;
    }

    // Fallback to standard Angular error messages
    if (state.errors && Object.keys(state.errors).length > 0) {
      return Object.keys(state.errors).map((key) => {
        const errorValue = state.errors?.[key];
        return typeof errorValue === 'string' ? errorValue : `${key} error`;
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

    // Extract Vest-specific warning messages
    const vestWarnings = state.errors?.['warnings'];
    if (Array.isArray(vestWarnings)) {
      return vestWarnings;
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
