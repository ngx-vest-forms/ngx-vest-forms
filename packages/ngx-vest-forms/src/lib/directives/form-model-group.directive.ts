import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  NgModelGroup,
  ValidationErrors,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { getFormGroupField } from '../utils/form-utils';
import { runAsyncValidationBridge } from './async-validator-bridge';
import { registerGroupElement } from './field-element-registry';
import { FormDirective } from './form.directive';
import { ValidationOptions } from './validation-options';

/**
 * Hooks into `ngModelGroup`/`ngxModelGroup` and runs async group-level validation
 * through the parent `FormDirective` Vest suite bridge.
 */
@Directive({
  selector: '[ngModelGroup],[ngxModelGroup]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: FormModelGroupDirective,
      multi: true,
    },
  ],
})
export class FormModelGroupDirective implements AsyncValidator, OnInit {
  /**
   * Per-group async validation options.
   *
   * Defaults to no debounce (`{ debounceTime: 0 }`).
   */
  validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  private readonly formDirective: FormDirective<
    Record<string, unknown>
  > | null = inject(FormDirective, { optional: true });

  readonly #injector = inject(Injector);
  readonly #elementRef = inject<ElementRef<Element>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Register the host element so blur handling can map it back to this
    // control's path without reading Angular internals. Resolved here, not
    // in the constructor: NgModelGroup injects this directive as an async validator,
    // so injecting it back during construction would be a DI cycle.
    const group = this.#injector.get(NgModelGroup, null, {
      self: true,
      optional: true,
    });
    const ngForm = this.formDirective?.ngForm;
    if (group && ngForm) {
      this.#destroyRef.onDestroy(
        registerGroupElement(ngForm, this.#elementRef.nativeElement, group)
      );
    }
  }

  /**
   * Runs async validation for the current model-group control.
   *
   * Returns `null` (fail-open) when used outside an `ngxVestForm` context.
   */
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return runAsyncValidationBridge(
      control,
      this.formDirective,
      (currentControl) => {
        const context = this.formDirective;
        if (!context) return '';
        return getFormGroupField(context.ngForm.control, currentControl);
      },
      this.validationOptions(),
      'FormModelGroupDirective'
    );
  }
}
