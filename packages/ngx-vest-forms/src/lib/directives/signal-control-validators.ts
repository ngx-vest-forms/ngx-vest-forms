import { Injector } from '@angular/core';
import {
  NG_ASYNC_VALIDATORS,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgForm,
  NgModel,
} from '@angular/forms';

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
 * Whether Angular will bind this `NgModel` through its custom-control path.
 *
 * Mirrors the decision `NgControl` makes when the element is created: the
 * ControlValueAccessor path is taken when the element provides
 * `NG_VALUE_ACCESSOR` (unless it has the `ngNoCva` attribute) or when a
 * component set `ngControl.valueAccessor` itself. Native inputs and CVA hosts
 * are filtered out here, so they do no further work.
 */
export function usesCustomControlPath(
  ngModel: NgModel,
  injector: Injector,
  element: Element
): boolean {
  if (ngModel.valueAccessor !== null) {
    return false;
  }
  const accessors = injector.get(NG_VALUE_ACCESSOR, null, {
    self: true,
    optional: true,
  });
  return (
    !accessors || accessors.length === 0 || element.hasAttribute('ngNoCva')
  );
}

/**
 * Whether Angular has finished setting up this control. `NgForm` registers
 * the control and sets it up in the same synchronous step, so a control
 * reachable at its path is a set-up control. A standalone `NgModel` is set
 * up synchronously in its first `ngOnChanges()`.
 */
export function isControlSetUp(ngModel: NgModel, ngForm: NgForm): boolean {
  if (ngModel.options?.standalone) {
    return true;
  }
  return ngForm.form.get(ngModel.path) === ngModel.control;
}

type ValidatorChangeSource = {
  registerOnValidatorChange(fn: () => void): void;
};

/**
 * Attaches `NgModel`'s composed sync and async validators to its control
 * when Angular has not, the way `setUpValidators()` does for a CVA control.
 *
 * It compares by the exact function references Angular itself attaches
 * (`NgModel.validator` / `NgModel.asyncValidator`), so it is a no-op when
 * they are already there, including if a future Angular version attaches
 * them on the custom-control path, and Angular's own cleanup can still
 * remove them by identity.
 *
 * When it attached something, it also registers the revalidation callback
 * on the element's validator directives (such as a bound `[required]`), as
 * `setUpValidators()` would. Angular registered none on this path, so
 * there is no callback to chain. Then it revalidates the control with
 * events, so the first result reaches `statusChanges` and the ancestors'
 * status, as Angular's own emitting `setValue()` does after a CVA setup.
 *
 * Returns whether anything was attached.
 */
export function attachMissingValidators(
  ngModel: NgModel,
  injector: Injector
): boolean {
  const control = ngModel.control;
  const validator = ngModel.validator;
  const asyncValidator = ngModel.asyncValidator;
  let attached = false;

  if (validator && !control.hasValidator(validator)) {
    control.addValidators(validator);
    attached = true;
  }
  if (asyncValidator && !control.hasAsyncValidator(asyncValidator)) {
    control.addAsyncValidators(asyncValidator);
    attached = true;
  }
  if (!attached) {
    return false;
  }

  const revalidate = () => {
    ngModel.control.updateValueAndValidity();
  };
  for (const source of validatorChangeSources(injector)) {
    source.registerOnValidatorChange(revalidate);
  }
  control.updateValueAndValidity();
  return true;
}

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
