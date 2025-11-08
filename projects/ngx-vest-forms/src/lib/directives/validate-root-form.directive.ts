import { Directive, input, OnDestroy, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  AsyncValidatorFn,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import {
  debounceTime,
  map,
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  take,
  takeUntil,
  timer,
} from 'rxjs';
import { setValueAtPath } from '../utils/form-utils';
import { NgxVestSuite } from '../utils/validation-suite';
import { ValidationOptions } from './validation-options';

@Directive({
  selector: 'form[validateRootForm][formValue][suite]',
  host: {
    '(ngSubmit)': 'onSubmit()',
  },
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: ValidateRootFormDirective,
      multi: true,
    },
  ],
})
export class ValidateRootFormDirective<T> implements AsyncValidator, OnDestroy {
  public validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  private readonly destroy$$ = new Subject<void>();
  private readonly hasSubmitted = signal(false);
  private lastControl: AbstractControl | null = null;

  public readonly formValue = input<T | null>(null);
  public readonly suite = input<NgxVestSuite<T> | null>(null);

  /**
   * Whether the root form should be validated or not
   * This will use the field rootForm
   */
  public readonly validateRootForm = input(false);

  /**
   * Validation mode:
   * - 'submit' (default): Only validates after form submission
   * - 'live': Validates on every value change
   */
  public readonly validateRootFormMode = input<'submit' | 'live'>('submit');

  /**
   * Host binding for form submit event
   * Triggers revalidation after first submit in 'submit' mode
   */
  public onSubmit(): void {
    this.hasSubmitted.set(true);
    this.lastControl?.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  public validate(
    control: AbstractControl<any, any>
  ): Observable<ValidationErrors | null> {
    // Cache control for revalidation after submit
    this.lastControl = control;

    // Skip validation if suite or formValue not set
    if (!this.suite() || !this.formValue()) {
      return of(null);
    }

    // In 'submit' mode, skip validation until form is submitted
    if (this.validateRootFormMode() === 'submit' && !this.hasSubmitted()) {
      return of(null);
    }

    return this.createAsyncValidator(
      'rootForm',
      this.validationOptions()
    )(control) as Observable<ValidationErrors | null>;
  }

  public createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions
  ): AsyncValidatorFn {
    if (!this.suite()) {
      return () => of(null);
    }
    return (control: AbstractControl) => {
      if (!this.formValue()) {
        return of(null);
      }
      const value = control.getRawValue();
      const mod = structuredClone(value) as T;
      setValueAtPath(mod as object, field, value); // Update the property with path

      // Use timer() pattern instead of ReplaySubject cache
      return timer(validationOptions.debounceTime ?? 0).pipe(
        map(() => mod),
        switchMap((model) => {
          return new Observable((observer) => {
            this.suite()!(model, field).done((result) => {
              const errors = result.getErrors()[field];
              observer.next(errors ? { error: errors[0], errors } : null);
              observer.complete();
            });
          }) as Observable<ValidationErrors | null>;
        }),
        take(1),
        takeUntil(this.destroy$$)
      );
    };
  }

  public ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
