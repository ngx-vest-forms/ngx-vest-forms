/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  booleanAttribute,
  DestroyRef,
  Directive,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidator,
  AsyncValidatorFn,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { debounceTime, Observable, of, take } from 'rxjs';
import { injectRootFormKey } from '../utils/form-token';
import { VestSuite } from '../utils/validation-suite';
import { ValidationOptions } from './validation-options';

/**
 * Directive responsible for adding root-level validation to an NgForm.
 * It's automatically applied by `FormDirective` via `hostDirectives`.
 *
 * This directive adds an AsyncValidator to the root `NgForm` that runs
 * the Vest suite specifically for root-level tests (tests not associated
 * with a specific field name, often identified using `ROOT_FORM` key).
 *
 * The validation is controlled by the `validateRootForm` input.
 * @see FormDirective
 * @see ROOT_FORM
 * @see injectRootFormKey
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'form[validateRootForm][formValue][vestSuite]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: ValidateRootFormDirective,
      multi: true,
    },
  ],
})
export class ValidateRootFormDirective<T> implements AsyncValidator {
  // @Input() validationOptions: ValidationOptions = { debounceTime: 0 }; // Removed
  readonly validationOptions = input<ValidationOptions>({ debounceTime: 0 }); // Added

  readonly #destroyRef = inject(DestroyRef);
  readonly #rootFormKey = injectRootFormKey(); // Inject here

  // @Input() formValue: T | null = null; // Removed
  readonly formValue = input<T | null>(null); // Added

  // @Input() vestSuite: VestSuite | null = null; // Removed
  readonly vestSuite = input<VestSuite | null>(null); // Added

  /**
   * Whether the root form should be validated or not.
   *
   * When true (default), the directive will add a root-level async validator using the key from injectRootFormKey().
   *
   * BREAKING CHANGE: The default is now true. If you do not want root-level validation, set [validateRootForm]="false".
   *
   * You might want to set this to false in these situations:
   *
   * - You only want field-level or group-level validation: If your form only needs validation on individual fields or groups, and you do not have any cross-field or form-wide rules, root form validation is unnecessary.
   * - Performance optimization: If root-level validation is expensive and not always needed, you may want to disable it by default and only enable it when required.
   * - Legacy or simple forms: If your form setup predates root-level validation or is very simple, you may not want to introduce extra validation logic.
   */
  readonly validateRootForm = input(true, { transform: booleanAttribute });

  /**
   * Used to debounce formValues to make sure vest isn't triggered all the time
   */
  // private readonly formValueCache: Record<
  //   string,
  //   Partial<{
  //     sub$$: ReplaySubject<unknown>;
  //     debounced: Observable<any>;
  //   }>
  // > = {};

  validate(
    control: AbstractControl<any, any>,
  ): Observable<ValidationErrors | null> {
    const currentVestSuite = this.vestSuite(); // Get signal value
    const currentFormValue = this.formValue(); // Get signal value
    if (!currentVestSuite || !currentFormValue) {
      return of(null);
    }
    return this.createAsyncValidator(
      this.#rootFormKey, // Use the injected key
      this.validationOptions(), // Get signal value
    )(control.getRawValue()) as Observable<ValidationErrors | null>;
  }

  createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions,
  ): AsyncValidatorFn {
    const currentVestSuite = this.vestSuite(); // Get signal value
    if (!currentVestSuite) {
      return () => of(null);
    }
    return () => {
      const currentFormValue = this.formValue(); // Get signal value
      if (!currentFormValue) {
        return of(null);
      }
      // Clone the current value to avoid direct mutation if it's an object/array
      const module_ = structuredClone(currentFormValue);

      return new Observable<ValidationErrors | null>((observer) => {
        // Use the suite obtained at the start of the function
        currentVestSuite(module_, field).done((result: any) => {
          const errors = result.getErrors()[field];
          observer.next(errors ? { error: errors[0], errors } : null);
          observer.complete();
        });
      }).pipe(
        debounceTime(validationOptions.debounceTime),
        take(1),
        takeUntilDestroyed(this.#destroyRef),
      );
    };
  }
}
