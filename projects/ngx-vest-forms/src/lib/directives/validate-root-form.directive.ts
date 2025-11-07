import { Directive, input, OnDestroy } from '@angular/core';
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

  public readonly formValue = input<T | null>(null);
  public readonly suite = input<NgxVestSuite<T> | null>(null);

  /**
   * Whether the root form should be validated or not
   * This will use the field rootForm
   */
  public readonly validateRootForm = input(false);

  public validate(
    control: AbstractControl<any, any>
  ): Observable<ValidationErrors | null> {
    if (!this.suite() || !this.formValue()) {
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

      // Use timer() pattern like v2 instead of ReplaySubject cache
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
