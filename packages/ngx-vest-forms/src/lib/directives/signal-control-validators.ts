import { type Injector, isDevMode } from '@angular/core';
import {
  AbstractControl,
  type AsyncValidatorFn,
  NG_ASYNC_VALIDATORS,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type NgModel,
  type ValidatorFn,
} from '@angular/forms';
import {
  logDiagnostic,
  NGX_VEST_FORMS_DIAGNOSTICS,
} from '../errors/error-catalog';

/**
 * Support for `[ngModel]` on a Signal Forms custom control
 * (`FormValueControl` / `FormCheckboxControl` from `@angular/forms/signals`).
 *
 * Angular 22.2 binds such a control through `NgControl.setupCustomControl()`
 * instead of `setUpControlValueAccessor()`. That path never calls
 * `setUpValidators()`, so the validators collected from `NG_VALIDATORS` /
 * `NG_ASYNC_VALIDATORS` (including ngx-vest-forms' Vest bridge) are never
 * attached to the `FormControl`, and validator directives such as
 * `[required]` never get a change callback. Everything here uses public
 * Angular API only.
 */

/**
 * Whether the element certainly takes Angular's ControlValueAccessor path,
 * so `setUpValidators()` runs and there is nothing to check.
 *
 * Only the cheap, certain case is skipped: an `NG_VALUE_ACCESSOR` provider on
 * the element (native inputs, provider-based CVAs) without `ngNoCva`.
 * Everything else (Signal Forms controls, components that assign
 * `ngControl.valueAccessor` themselves, `ngNoCva` hosts) goes through the
 * idempotent attach check, which adds nothing where Angular already did.
 */
export function hasValueAccessorProvider(
  injector: Injector,
  element: Element
): boolean {
  const accessors = injector.get(NG_VALUE_ACCESSOR, null, {
    self: true,
    optional: true,
  });
  return (
    !!accessors && accessors.length > 0 && !element.hasAttribute('ngNoCva')
  );
}

/**
 * Whether Angular has finished setting up this control. A form container
 * registers the control and sets it up in the same synchronous step, so a
 * control reachable at its path in its own form is a set-up control. An
 * `NgModel` without a form (no parent container, or `standalone`) is set up
 * synchronously in its first `ngOnChanges()`.
 */
export function isControlSetUp(ngModel: NgModel): boolean {
  if (ngModel.options?.standalone) {
    return true;
  }
  const formDirective: unknown = ngModel.formDirective;
  const form = hasForm(formDirective) ? formDirective.form : null;
  if (!form) {
    return true;
  }
  return form.get(ngModel.path) === ngModel.control;
}

function hasForm(value: unknown): value is { form: AbstractControl } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'form' in value &&
    value.form instanceof AbstractControl
  );
}

/** Dev-mode diagnostic for a control that never registered in its form. */
export function reportNotRegistered(ngModel: NgModel): void {
  if (isDevMode()) {
    logDiagnostic(
      NGX_VEST_FORMS_DIAGNOSTICS.SIGNAL_CONTROL_NOT_REGISTERED,
      ngModel.name
    );
  }
}

/** What `attachMissingValidators()` added to a control. */
export type AttachedValidators = {
  control: AbstractControl;
  validator: ValidatorFn | null;
  asyncValidator: AsyncValidatorFn | null;
};

/**
 * Attaches `NgModel`'s composed sync and async validators to its control
 * when Angular has not, the way `setUpValidators()` does for a CVA control,
 * and registers the revalidation callback on the element's validator
 * directives (such as a bound `[required]`). Angular registered none on this
 * path, so there is no callback to chain.
 *
 * It compares by the exact function references Angular itself attaches
 * (`NgModel.validator` / `NgModel.asyncValidator`), so it is a no-op when
 * they are already there, including if a future Angular version attaches
 * them on the custom-control path. It does not revalidate.
 *
 * Returns what it added, or `null` when it added nothing.
 */
export function attachMissingValidators(
  ngModel: NgModel,
  injector: Injector
): AttachedValidators | null {
  const control = ngModel.control;
  const validator = ngModel.validator;
  const asyncValidator = ngModel.asyncValidator;
  const added: AttachedValidators = {
    control,
    validator: null,
    asyncValidator: null,
  };

  if (validator && !control.hasValidator(validator)) {
    control.addValidators(validator);
    added.validator = validator;
  }
  if (asyncValidator && !control.hasAsyncValidator(asyncValidator)) {
    control.addAsyncValidators(asyncValidator);
    added.asyncValidator = asyncValidator;
  }
  if (!added.validator && !added.asyncValidator) {
    return null;
  }

  const revalidate = () => {
    ngModel.control.updateValueAndValidity();
  };
  for (const source of validatorChangeSources(injector)) {
    source.registerOnValidatorChange(revalidate);
  }
  return added;
}

/**
 * Removes exactly what `attachMissingValidators()` added, by function
 * identity. Angular never attaches these functions on the custom-control
 * path, so nothing Angular attached is touched.
 */
export function detachValidators(attached: AttachedValidators): void {
  if (attached.validator) {
    attached.control.removeValidators(attached.validator);
  }
  if (attached.asyncValidator) {
    attached.control.removeAsyncValidators(attached.asyncValidator);
  }
}

type ValidatorChangeSource = {
  registerOnValidatorChange(fn: () => void): void;
};

function validatorChangeSources(injector: Injector): ValidatorChangeSource[] {
  const options = { self: true, optional: true } as const;
  const validators: readonly unknown[] = [
    ...(injector.get(NG_VALIDATORS, null, options) ?? []),
    ...(injector.get(NG_ASYNC_VALIDATORS, null, options) ?? []),
  ];
  return validators.filter((candidate) => isValidatorChangeSource(candidate));
}

function isValidatorChangeSource(
  candidate: unknown
): candidate is ValidatorChangeSource {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'registerOnValidatorChange' in candidate &&
    typeof candidate.registerOnValidatorChange === 'function'
  );
}
