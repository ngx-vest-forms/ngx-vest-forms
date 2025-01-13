/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { StaticSuite } from 'vest';
import { cloneDeep, set } from '../utils/form-utils';
import { ValidationOptions } from './validation-options';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'form[validateRootForm][formValue][suite]',
  standalone: true,
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
  public readonly suite = input<StaticSuite<
    string,
    string,
    (model: T, field: string) => void
  > | null>(null);

  /**
   * Whether the root form should be validated or not
   * This will use the field rootForm
   */
  public readonly validateRootForm = input(false);

  /**
   * Used to debounce formValues to make sure vest isn't triggered all the time
   */
  private readonly formValueCache: Record<
    string,
    Partial<{
      sub$$: ReplaySubject<unknown>;
      debounced: Observable<any>;
    }>
  > = {};

  public validate(
    control: AbstractControl<any, any>,
  ): Observable<ValidationErrors | null> {
    if (!this.suite() || !this.formValue()) {
      return of(null);
    }
    return this.createAsyncValidator(
      'rootForm',
      this.validationOptions(),
    )(control.getRawValue()) as Observable<ValidationErrors | null>;
  }

  public createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions,
  ): AsyncValidatorFn {
    if (!this.suite()) {
      return () => of(null);
    }
    return (value: any) => {
      if (!this.formValue()) {
        return of(null);
      }
      const mod = cloneDeep(value as T);
      set(mod as object, field, value); // Update the property with path
      if (!this.formValueCache[field]) {
        this.formValueCache[field] = {
          sub$$: new ReplaySubject(1), // Keep track of the last model
        };
        this.formValueCache[field].debounced = this.formValueCache[
          field
        ].sub$$!.pipe(debounceTime(validationOptions.debounceTime));
      }
      // Next the latest model in the cache for a certain field
      this.formValueCache[field].sub$$!.next(mod);

      return this.formValueCache[field].debounced!.pipe(
        // When debounced, take the latest value and perform the asynchronous vest validation
        take(1),
        switchMap(() => {
          return new Observable((observer) => {
            this.suite()!(mod, field).done((result) => {
              const errors = result.getErrors()[field];
              observer.next(errors ? { error: errors[0], errors } : null);
              observer.complete();
            });
          }) as Observable<ValidationErrors | null>;
        }),
        takeUntil(this.destroy$$),
      );
    };
  }

  public ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
