import {
  type ChangeDetectorRef,
  type DestroyRef,
  type ErrorHandler,
  untracked,
  type WritableSignal,
} from '@angular/core';
import type {
  AbstractControl,
  AsyncValidatorFn,
  FormGroup,
} from '@angular/forms';
import { catchError, map, of } from 'rxjs';
import { mergeValuesAndRawValues, setValueAtPath } from '../utils/form-utils';
import type { NgxVestSuite } from '../utils/validation-suite';
import {
  extractFieldErrors,
  extractFieldWarnings,
  type NgxSuiteFocusSpec,
  reportToErrorHandler,
  runFieldValidation,
} from '../utils/vest-runner';
import type { NgxValidationFocus } from './form-directive.types';
import type { ValidationOptions } from './validation-options';

/** Field warnings keyed by field path, as `FormDirective.fieldWarnings`. */
type FieldWarningsMap = Map<string, readonly string[]>;

/**
 * @internal
 * Stores (or clears, for an empty list) one field's warnings. Leaves the
 * `fieldWarnings` map untouched when the warnings did not change, so
 * readers are not notified on every validation run.
 */
export function setFieldWarnings(
  fieldWarnings: WritableSignal<FieldWarningsMap>,
  field: string,
  warnings: readonly string[] | undefined
): void {
  const current = untracked(fieldWarnings);
  const previous = current.get(field);
  if (!warnings?.length) {
    if (previous === undefined) return;
    const next = new Map(current);
    next.delete(field);
    fieldWarnings.set(next);
    return;
  }
  if (
    previous?.length === warnings.length &&
    previous.every((warning, index) => warning === warnings[index])
  ) {
    return;
  }
  fieldWarnings.set(new Map(current).set(field, warnings));
}

/**
 * What {@link createFieldValidator} needs from `FormDirective`: the same for
 * every validator, so the directive builds it once.
 */
type FieldValidatorContext = {
  form: FormGroup;
  /** Read on every run, so a changed `validationFocus` input applies. */
  validationFocus: () => NgxValidationFocus | null;
  fieldWarnings: WritableSignal<FieldWarningsMap>;
  cdr: ChangeDetectorRef;
  destroyRef: DestroyRef;
  errorHandler: ErrorHandler;
};

/**
 * @internal
 * The async validator behind `FormDirective.createAsyncValidator`: runs the
 * Vest suite focused on `field` against the form model with the control's
 * candidate value, stores the field's warnings and returns its errors.
 */
export function createFieldValidator<T>(
  context: FieldValidatorContext,
  suite: NgxVestSuite<T>,
  field: string,
  validationOptions: ValidationOptions
): AsyncValidatorFn {
  const { form, cdr, destroyRef, errorHandler } = context;
  return (control: AbstractControl) => {
    // A copy of its own, not the directive's shared form snapshot: the
    // validator runs inside the control's `updateValueAndValidity`, before
    // the root form's value event, so that snapshot can still miss this
    // change or a control registered since; the candidate value is written
    // into the copy below; and the suite is consumer code that may mutate
    // the model it is given.
    // Targeted snapshot with candidate value injected at path
    // mergeValuesAndRawValues already returns fresh plain objects and arrays,
    // so we can modify it directly without affecting the form state.
    const snapshot = mergeValuesAndRawValues<T>(form);
    setValueAtPath(snapshot as object, field, control.value);

    const focus: NgxSuiteFocusSpec = {
      ...context.validationFocus(),
      only: field,
    };

    return runFieldValidation(
      suite,
      focus,
      snapshot,
      validationOptions,
      destroyRef
    ).pipe(
      map((result) => {
        const warnings = extractFieldWarnings(result, field);

        // Store warnings in the fieldWarnings signal for access by control wrappers.
        // This is necessary because Angular marks a field as invalid when control.errors !== null.
        // By storing warnings separately, fields can remain valid while still displaying warnings.
        setFieldWarnings(context.fieldWarnings, field, warnings);

        const out = extractFieldErrors(result, field);

        // Ensure DOM validity classes update after async validation sets new
        // control errors. Angular's template-driven forms update
        // `ng-valid`/`ng-invalid` host classes during change detection, and
        // in a zoneless OnPush app no CD pass may be scheduled when the async
        // validator resolves. markForCheck() is the zoneless-idiomatic way to
        // request one: it marks the view dirty and notifies the scheduler
        // without running CD synchronously inside Angular's validation
        // pipeline (which detectChanges() would do, risking re-entrancy).
        // Calling it on a destroyed view is a safe no-op.
        cdr.markForCheck();

        return out;
      }),
      // `runFieldValidation` already applies `take(1)` and `takeUntilDestroyed`,
      // so no additional terminal operators are needed here.
      // A suite that throws (e.g. reading `model.a.b` while `a` is undefined)
      // fails closed: the field gets a generic error so the form cannot
      // submit, and the original error goes to Angular's ErrorHandler so it
      // is logged with its stack (and reaches a custom handler, if any).
      catchError((error: unknown) => {
        reportToErrorHandler(errorHandler, error);
        return of({ vestInternalError: 'Validation failed' });
      })
    );
  };
}
