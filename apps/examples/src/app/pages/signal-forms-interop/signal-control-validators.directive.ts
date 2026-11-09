import { Directive, inject, OnInit } from '@angular/core';
import { NgModel } from '@angular/forms';

/**
 * WORKAROUND for an Angular 22.2 gap. Required for now: without this
 * directive, Vest never runs for a Signal Forms control bound with
 * `[ngModel]`. The field shows no errors and the form reports it valid.
 *
 * When `[ngModel]` sits on a Signal Forms control (`FormValueControl` or
 * `FormCheckboxControl`) instead of a `ControlValueAccessor`, Angular's
 * `NgModel` takes its custom-control path (`setupCustomControl()`), which
 * never calls `setUpValidators()`. The validators provided on the element
 * through `NG_VALIDATORS` / `NG_ASYNC_VALIDATORS` are collected by `NgModel`
 * but never attached to its `FormControl`. That drops ngx-vest-forms' Vest
 * validator (provided as an async validator by the `[ngModel]` directive),
 * and also Angular's own `required` attribute validator: the control stays
 * `VALID` whatever its value.
 *
 * This directive attaches `NgModel`'s composed validators to the control
 * itself, with public Angular API only. Put it on Signal Forms controls only;
 * a native input or a ControlValueAccessor host already gets its validators.
 *
 * A fix inside ngx-vest-forms is planned, so `[ngModel]` on a Signal Forms
 * control gets the Vest validator without this directive. Remove the
 * directive from this example when that fix lands (or when Angular wires
 * validators on the custom-control path, whichever comes first).
 */
@Directive({
  selector: '[ngModel][ngxSignalControlValidators]',
})
export class SignalControlValidatorsDirective implements OnInit {
  readonly #ngModel = inject(NgModel, { self: true });

  ngOnInit(): void {
    const control = this.#ngModel.control;
    const validator = this.#ngModel.validator;
    const asyncValidator = this.#ngModel.asyncValidator;

    if (validator && !control.hasValidator(validator)) {
      control.addValidators(validator);
    }
    if (asyncValidator && !control.hasAsyncValidator(asyncValidator)) {
      control.addAsyncValidators(asyncValidator);
    }
    // NgForm registers the control in a microtask and revalidates it then, so
    // the first Vest run sees the control at its field path.
    control.updateValueAndValidity({ emitEvent: false });
  }
}
