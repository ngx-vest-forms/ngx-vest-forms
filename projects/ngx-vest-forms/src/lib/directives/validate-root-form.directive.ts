import {
  AfterViewInit,
  booleanAttribute,
  Directive,
  effect,
  inject,
  Injector,
  input,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidator,
  AsyncValidatorFn,
  NG_ASYNC_VALIDATORS,
  NgForm,
  ValidationErrors,
} from '@angular/forms';
import {
  catchError,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { NgxVestSuite } from '../utils/validation-suite';
import { ValidationOptions } from './validation-options';

/**
 * Validates the root form (cross-field validation) using a Vest suite.
 *
 * @remarks
 * Root form validation is for cross-field rules like password confirmation,
 * form-wide business logic, or validations that span multiple fields.
 *
 * Contract:
 * - Inputs:
 *   - `validateRootForm`: boolean. Enables root form validation.
 *   - `validateRootFormMode`: 'submit' | 'live'. Default 'submit'.
 *     - 'submit': Validates only after first form submission (better UX)
 *     - 'live': Validates on every value change (immediate feedback)
 *   - `formValue`: Current form model (required)
 *   - `suite`: Vest validation suite (required)
 *   - `validationOptions`: { debounceTime?: number } to debounce validation
 * - Output:
 *   - Errors placed at 'rootForm' key: `{ error: string, errors: string[] }`
 *   - When no errors: `null`
 *
 * @example
 * ```html
 * <form scVestForm
 *       validateRootForm
 *       [suite]="suite"
 *       [formValue]="formValue()"
 *       [validateRootFormMode]="'submit'"
 *       (errorsChange)="errors.set($event)"
 *       #form="ngForm">
 *   <!-- form fields -->
 *   @if (errors()['rootForm']) {
 *     <div role="alert">{{ errors()['rootForm'][0] }}</div>
 *   }
 * </form>
 * ```
 *
 * @example
 * Validation suite:
 * ```typescript
 * import { ROOT_FORM } from 'ngx-vest-forms';
 *
 * export const suite = staticSuite((model, field?) => {
 *   only(field);
 *
 *   test(ROOT_FORM, 'Passwords must match', () => {
 *     enforce(model.confirmPassword).equals(model.password);
 *   });
 * });
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: 'form[validateRootForm]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: ValidateRootFormDirective,
      multi: true,
    },
  ],
})
export class ValidateRootFormDirective<T>
  implements AsyncValidator, AfterViewInit, OnDestroy
{
  private readonly injector = inject(Injector);
  private readonly lastControl = signal<NgForm | null>(null);
  public validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  private readonly destroy$$ = new Subject<void>();
  private readonly hasSubmitted = signal(false);
  private readonly hasSubmitted$: Observable<boolean>;
  private readonly formValue$: Observable<T | null>;

  public readonly formValue = input<T | null>(null);
  public readonly suite = input<NgxVestSuite<T> | null>(null);

  /**
   * Whether the root form should be validated or not
   * This will use the field rootForm
   */
  readonly validateRootForm = input(false, {
    transform: booleanAttribute,
  });

  /**
   * Validation mode:
   * - 'submit' (default): Only validates after form submission
   * - 'live': Validates on every value change
   */
  public readonly validateRootFormMode = input<'submit' | 'live'>('submit');

  constructor() {
    // Convert signals to Observables in injection context
    this.hasSubmitted$ = toObservable(this.hasSubmitted);
    this.formValue$ = toObservable(this.formValue);

    // Trigger validation when hasSubmitted or formValue changes
    effect(() => {
      // Track dependencies
      this.hasSubmitted();
      this.formValue();

      // Trigger revalidation if form exists
      // Use emitEvent: true so the form directive can update its errors
      // Use untracked() to avoid making the effect reactive to lastControl changes
      const ngForm = untracked(() => this.lastControl());
      if (ngForm?.control) {
        ngForm.control.updateValueAndValidity();
      }
    });
  }

  /**
   * Subscribe to form submit event using NgForm.ngSubmit EventEmitter
   * This approach avoids conflicts with component's (ngSubmit) handlers
   * Uses Injector to lazily get NgForm, avoiding circular dependency
   * (Directive → NgForm → AsyncValidators → Directive)
   */
  public ngAfterViewInit(): void {
    // Lazily inject NgForm to avoid circular dependency
    const ngForm = this.injector.get(NgForm, null);
    this.lastControl.set(ngForm);

    if (!ngForm) {
      console.error(
        '[ValidateRootFormDirective] NgForm not found. Ensure the directive is used on a <form> element with the scVestForm directive. ' +
        'Common setup mistakes: (1) Missing scVestForm directive, (2) Directive on non-form element, (3) NgForm not imported in module/component.'
      );
      return;
    }

    // Subscribe to form submission to set hasSubmitted flag
    ngForm.ngSubmit
      .pipe(
        tap(() => {
          this.hasSubmitted.set(true);
        }),
        takeUntil(this.destroy$$)
      )
      .subscribe();
  }

  public validate(
    control: AbstractControl<any, any>
  ): Observable<ValidationErrors | null> {
    // Skip validation if suite or formValue not set
    if (!this.suite() || !this.formValue()) {
      return of(null);
    }

    // In 'submit' mode, skip validation until form is submitted
    if (this.validateRootFormMode() === 'submit' && !this.hasSubmitted()) {
      return of(null);
    }

    // Call the validator and return its Observable
    // Angular expects this to complete after emitting once
    const validationResult = this.createAsyncValidator(
      'rootForm',
      this.validationOptions()
    )(control) as Observable<ValidationErrors | null>;

    return validationResult;
  }

  public createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions
  ): AsyncValidatorFn {
    if (!this.suite()) {
      return () => of(null);
    }
    return (control: AbstractControl) => {
      const currentFormValue = this.formValue();
      if (!currentFormValue) {
        return of(null);
      }
      // Use the formValue input which contains the actual model data
      const mod = structuredClone(currentFormValue) as T;

      // Use timer() pattern instead of ReplaySubject cache
      return timer(validationOptions.debounceTime ?? 0).pipe(
        map(() => mod),
        switchMap((model) => {
          return new Observable((observer) => {
            try {
              this.suite()!(model, field).done((result) => {
                const errors = result.getErrors()[field];
                // Return { errors: string[] } format expected by getAllFormErrors()
                observer.next(errors ? { errors } : null);
                observer.complete();
              });
            } catch (err) {
              console.error(
                '[validate-root-form] Validation suite error:',
                err
              );
              observer.next(null);
              observer.complete();
            }
          }) as Observable<ValidationErrors | null>;
        }),
        catchError((err) => {
          console.error('[validate-root-form] Observable error:', err);
          return of(null);
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
