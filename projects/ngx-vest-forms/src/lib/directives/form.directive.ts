import { Directive, inject, input, OnDestroy, Output } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AsyncValidatorFn,
  NgForm,
  PristineChangeEvent,
  StatusChangeEvent,
  ValidationErrors,
  ValueChangeEvent,
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  ReplaySubject,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  zip,
} from 'rxjs';
import { StaticSuite } from 'vest';
import { DeepRequired } from '../utils/deep-required';
import {
  cloneDeep,
  getAllFormErrors,
  mergeValuesAndRawValues,
  set,
} from '../utils/form-utils';
import { validateShape } from '../utils/shape-validation';
import { ValidationOptions } from './validation-options';

@Directive({
  selector: 'form[scVestForm]',
  standalone: true,
})
export class FormDirective<T extends Record<string, any>> implements OnDestroy {
  public readonly ngForm = inject(NgForm, { self: true, optional: false });

  /**
   * The value of the form, this is needed for the validation part
   */
  public readonly formValue = input<T | null>(null);

  /**
   * Static vest suite that will be used to feed our angular validators
   */
  public readonly suite = input<StaticSuite<
    string,
    string,
    (model: T, field: string) => void
  > | null>(null);

  /**
   * The shape of our form model. This is a deep required version of the form model
   * The goal is to add default values to the shape so when the template-driven form
   * contains values that shouldn't be there (typo's) that the developer gets run-time
   * errors in dev mode
   */
  public readonly formShape = input<DeepRequired<T> | null>(null);

  /**
   * Updates the validation config which is a dynamic object that will be used to
   * trigger validations on the dependant fields
   * Eg: ```typescript
   * validationConfig = {
   *     'passwords.password': ['passwords.confirmPassword']
   * }
   * ```
   *
   * This will trigger the updateValueAndValidity on passwords.confirmPassword every time the passwords.password gets a new value
   *
   * @param v
   */
  public readonly validationConfig = input<{ [key: string]: string[] } | null>(
    null,
  );

  private readonly pending$ = this.ngForm.form.events.pipe(
    filter((v) => v instanceof StatusChangeEvent),
    map((v) => (v as StatusChangeEvent).status),
    filter((v) => v === 'PENDING'),
    distinctUntilChanged(),
  );

  /**
   * Emits every time the form status changes in a state
   * that is not PENDING
   * We need this to assure that the form is in 'idle' state
   */
  public readonly idle$ = this.ngForm.form.events.pipe(
    filter((v) => v instanceof StatusChangeEvent),
    map((v) => (v as StatusChangeEvent).status),
    filter((v) => v !== 'PENDING'),
    distinctUntilChanged(),
  );

  /**
   * Triggered as soon as the form value changes
   * Also every time Angular creates a new control or group
   * It also contains the disabled values (raw values)
   */
  @Output() public readonly formValueChange = this.ngForm.form.events.pipe(
    filter((v) => v instanceof ValueChangeEvent),
    map((v) => (v as ValueChangeEvent<any>).value),
    map(() => mergeValuesAndRawValues<T>(this.ngForm.form)),
  );

  /**
   * Emits an object with all the errors of the form
   * every time a form control or form groups changes its status to valid or invalid
   */
  @Output() public readonly errorsChange = this.ngForm.form.events.pipe(
    filter((v) => v instanceof StatusChangeEvent),
    map((v) => (v as StatusChangeEvent).status),
    filter((v) => v !== 'PENDING'),
    map(() => getAllFormErrors(this.ngForm.form)),
  );

  /**
   * Triggered as soon as the form becomes dirty
   */
  @Output() public readonly dirtyChange = this.ngForm.form.events.pipe(
    filter((v) => v instanceof PristineChangeEvent),
    map((v) => !(v as PristineChangeEvent).pristine),
    startWith(this.ngForm.form.dirty),
    distinctUntilChanged(),
  );
  private readonly destroy$$ = new Subject<void>();

  /**
   * Fired when the status of the root form changes.
   */
  private readonly statusChanges$ = this.ngForm.form.statusChanges.pipe(
    startWith(this.ngForm.form.status),
    distinctUntilChanged(),
  );

  /**
   * Triggered When the form becomes valid but waits until the form is idle
   */
  @Output() public readonly validChange = this.statusChanges$.pipe(
    filter((e) => e === 'VALID' || e === 'INVALID'),
    map((v) => v === 'VALID'),
    distinctUntilChanged(),
  );

  /**
   * Used to debounce formValues to make sure vest isn't triggered all the time
   */
  private readonly formValueCache: {
    [field: string]: Partial<{
      sub$$: ReplaySubject<unknown>;
      debounced: Observable<any>;
    }>;
  } = {};

  public constructor() {
    // When the validation config changes
    // Listen to changes of the left-side of the config and trigger the updateValueAndValidity
    // function on the dependant controls or groups at the right-side of the config
    toObservable(this.validationConfig)
      .pipe(
        filter((conf) => !!conf),
        switchMap((conf) => {
          if (!conf) {
            return of(null);
          }
          const streams = Object.keys(conf).map((key) => {
            return this.ngForm?.form.get(key)?.valueChanges.pipe(
              // Wait until something is pending
              switchMap(() => this.pending$),
              // Wait until the form is not pending anymore
              switchMap(() => this.idle$),
              map(() => this.ngForm?.form.get(key)?.value),
              takeUntil(this.destroy$$),
              tap((v) => {
                conf[key]?.forEach((path: string) => {
                  this.ngForm?.form.get(path)?.updateValueAndValidity({
                    onlySelf: true,
                    emitEvent: true,
                  });
                });
              }),
            );
          });
          return zip(streams);
        }),
      )
      .subscribe();

    /**
     * Trigger shape validations if the form gets updated
     * This is how we can throw run-time errors
     */
    this.formValueChange.pipe(takeUntil(this.destroy$$)).subscribe((v) => {
      if (this.formShape()) {
        validateShape(v, this.formShape() as DeepRequired<T>);
      }
    });

    /**
     * Mark all the fields as touched when the form is submitted
     */
    this.ngForm.ngSubmit.subscribe(() => {
      this.ngForm.form.markAllAsTouched();
    });
  }

  /**
   * This will feed the formValueCache, debounce it till the next tick
   * and create an asynchronous validator that runs a vest suite
   * @param field
   * @param validationOptions
   * @returns an asynchronous validator function
   */
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
      const mod = cloneDeep(this.formValue() as T);
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
