import {
  AfterViewInit,
  booleanAttribute,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  take,
  tap,
} from 'rxjs';
import { ROOT_FORM } from '../constants';
import { scheduleMicrotask } from '../utils/destroy-scheduler';
import type { NgxVestSuite } from '../utils/validation-suite';
import { extractFieldErrors, runFieldValidation } from '../utils/vest-runner';
import { ValidationOptions } from './validation-options';

/**
 * Validates the root form (cross-field validation) using a Vest suite.
 *
 * Use this directive for form-wide validations that span multiple fields, such as:
 * - Password confirmation (`password` must match `confirmPassword`)
 * - Date range validation (`startDate` must be before `endDate`)
 * - Business rules like "at least one contact method required"
 *
 * @usageNotes
 *
 * ### Basic Usage
 * ```html
 * <form ngxVestForm ngxValidateRootForm [suite]="suite" (errorsChange)="errors.set($event)">
 *   <!-- form fields -->
 *   @if (errors()['rootForm']) {
 *     <div role="alert">{{ errors()['rootForm'][0] }}</div>
 *   }
 * </form>
 * ```
 *
 * ### Validation Modes
 * - `'submit'` (default): Validates only after form submission. Better UX for complex cross-field rules.
 * - `'live'`: Validates on every value change. Use sparingly for simple two-field comparisons.
 *
 * ```html
 * <form ngxVestForm ngxValidateRootForm [ngxValidateRootFormMode]="'live'">
 * ```
 *
 * ### Vest Suite Pattern
 * ```typescript
 * import { ROOT_FORM } from 'ngx-vest-forms';
 *
 * test(ROOT_FORM, 'Passwords must match', () => {
 *   enforce(model.confirmPassword).equals(model.password);
 * });
 * ```
 *
 * @see {@link https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/VALIDATION-CONFIG-VS-ROOT-FORM.md}
 *
 * @example
 * ```html
 * <form ngxVestForm
 *       ngxValidateRootForm
 *       [suite]="suite"
 *       [formValue]="formValue()"
 *       [ngxValidateRootFormMode]="'submit'"
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
 * export const suite = create((model) => {
 *   test(ROOT_FORM, 'Passwords must match', () => {
 *     enforce(model.confirmPassword).equals(model.password);
 *   });
 * });
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: 'form[ngxValidateRootForm]',

  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: ValidateRootFormDirective,
      multi: true,
    },
  ],
})
export class ValidateRootFormDirective<T>
  implements AsyncValidator, AfterViewInit
{
  readonly #injector = inject(Injector);
  readonly #destroyRef = inject(DestroyRef);
  readonly #lastControl = signal<NgForm | null>(null);
  validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  readonly #hasSubmitted = signal(false);

  readonly formValue = input<T | null>(null);
  readonly suite = input<NgxVestSuite<T> | null>(null);

  readonly ngxValidateRootForm = input(false, {
    transform: booleanAttribute,
  });

  /**
   * Validation mode:
   * - `'submit'` (effective default): Only validates after form submission.
   * - `'live'`: Validates on every value change.
   */
  readonly ngxValidateRootFormMode = input<'submit' | 'live' | undefined>(
    undefined
  );

  constructor() {
    // Trigger validation when hasSubmitted or formValue changes
    effect(() => {
      // Track dependencies
      this.#hasSubmitted();
      this.formValue();

      // Also track inputs that affect whether validation should run.
      // These can be set after the first validation pass and we want the
      // root form to re-evaluate once they become available.
      this.suite();
      this.ngxValidateRootForm();
      this.ngxValidateRootFormMode();
      this.validationOptions();

      // Trigger revalidation if form exists
      // Use emitEvent: true so the form directive can update its errors
      // Use untracked() to avoid making the effect reactive to lastControl changes
      const ngForm = untracked(() => this.#lastControl());
      if (ngForm?.control) {
        // Defer to the next microtask so Angular has a chance to finish
        // wiring up controls/groups (ngModel/ngModelGroup) on initial render.
        // The scheduleMicrotask primitive auto-cancels if the directive is
        // destroyed before the microtask fires.
        scheduleMicrotask(
          () => ngForm.control.updateValueAndValidity(),
          this.#destroyRef
        );
      }
    });
  }

  /**
   * Subscribe to form submit event using NgForm.ngSubmit EventEmitter
   * This approach avoids conflicts with component's (ngSubmit) handlers
   * Uses Injector to lazily get NgForm, avoiding circular dependency
   * (Directive → NgForm → AsyncValidators → Directive)
   */
  ngAfterViewInit(): void {
    // Lazily inject NgForm to avoid circular dependency
    const ngForm = this.#injector.get(NgForm, null);
    this.#lastControl.set(ngForm);

    if (!ngForm) {
      console.error(
        '[ValidateRootFormDirective] NgForm not found. Ensure the directive is used on a <form> element with the ngxVestForm directive. ' +
          'Common setup mistakes: (1) Missing ngxVestForm directive, (2) Directive on non-form element, (3) NgForm not imported in module/component.'
      );
      return;
    }

    // Ensure we run at least one validation pass after the form is ready.
    // This matters for 'live' mode root-form errors that should appear
    // without requiring a user interaction.
    scheduleMicrotask(
      () => ngForm.control.updateValueAndValidity(),
      this.#destroyRef
    );

    // Subscribe to form submission to set hasSubmitted flag
    ngForm.ngSubmit
      .pipe(
        tap(() => {
          this.#hasSubmitted.set(true);
        }),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();
  }

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // Skip validation if suite or formValue not set
    if (!this.suite() || !this.formValue()) {
      return of(null);
    }

    if (!this.ngxValidateRootForm()) {
      return of(null);
    }

    const mode = this.ngxValidateRootFormMode() ?? 'submit';

    // In 'submit' mode, skip validation until form is submitted
    if (mode === 'submit' && !this.#hasSubmitted()) {
      return of(null);
    }

    // Call the validator and return its Observable
    // Angular expects this to complete after emitting once
    const validationResult = this.createAsyncValidator(
      ROOT_FORM,
      this.validationOptions()
    )(control) as Observable<ValidationErrors | null>;

    return validationResult;
  }

  createAsyncValidator(
    field: typeof ROOT_FORM,
    validationOptions: ValidationOptions
  ): AsyncValidatorFn {
    if (!this.suite()) {
      return () => of(null);
    }

    // Note: AsyncValidatorFn requires (control: AbstractControl) signature,
    // but root form validation uses formValue input (typed model) instead of control.value.
    // This is intentional - cross-field validation operates on the complete form model,
    // not individual control values. The underscore prefix indicates intentional non-use.

    return (_control: AbstractControl) => {
      const suite = this.suite();
      if (!suite) {
        return of(null);
      }

      const currentFormValue = this.formValue();
      if (!currentFormValue) {
        return of(null);
      }
      // Use the formValue input which contains the actual model data
      const mod = structuredClone(currentFormValue) as T;

      return runFieldValidation(
        suite,
        { only: field },
        mod,
        validationOptions,
        this.#destroyRef
      ).pipe(
        map((result) => extractFieldErrors(result, field)),
        catchError((err) => {
          console.error('[validate-root-form] Observable error:', err);
          return of(null);
        }),
        take(1),
        takeUntilDestroyed(this.#destroyRef)
      );
    };
  }
}
