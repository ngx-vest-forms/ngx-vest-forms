import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  ControlWrapperComponent,
  createEmptyFormState,
  FormDirective,
  NgxDeepRequired,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
  setValueAtPath,
} from 'ngx-vest-forms';
import { TravelFormModel } from '../../models/travel-form.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';
import { mapWarningsToRecord } from '../../utils/form-warnings.util';
import {
  DateRangeAdapterComponent,
  DateRangeValue,
} from './date-range-adapter.component';

export type TravelFormApproach = 'composite-adapter' | 'split-wrappers';

@Component({
  selector: 'ngx-travel-form-body',
  imports: [
    NgxVestForms,
    Card,
    FormSectionComponent,
    DateRangeAdapterComponent,
    ControlWrapperComponent,
  ],
  templateUrl: './travel.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TravelFormBody {
  readonly approach = input<TravelFormApproach>('split-wrappers');
  readonly formValue = input.required<TravelFormModel>();
  readonly shape = input.required<NgxDeepRequired<TravelFormModel>>();
  readonly suite = input.required<NgxVestSuite<TravelFormModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<TravelFormModel>>();

  readonly formValueChange = output<TravelFormModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  /** Aggregated errors for the composite adapter, provided by the page. */
  readonly rangeErrors = input<string[]>([]);
  /** Aggregated warnings for the composite adapter, provided by the page. */
  readonly rangeWarnings = input<string[]>([]);

  private readonly vestForm =
    viewChild<FormDirective<TravelFormModel>>('vestForm');
  private readonly dateRangeAdapter = viewChild(DateRangeAdapterComponent);

  readonly formSubmitted = signal(false);

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = computed(() => {
    const state = this.vestForm()?.formState();
    if (!state) return createEmptyFormState<TravelFormModel>();
    return state;
  });

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = computed(() =>
    mapWarningsToRecord(this.vestForm()?.fieldWarnings() ?? new Map())
  );

  /** Field paths that have been validated (touched/blurred or submitted). */
  readonly validatedFields = computed(
    () => this.vestForm()?.touchedFieldPaths() ?? []
  );

  /** True while async validation is in progress. */
  readonly pending = computed(
    () => this.vestForm()?.ngForm.form.pending ?? false
  );

  protected onRangeChange(range: DateRangeValue): void {
    const next = structuredClone(this.formValue());
    setValueAtPath(next, 'departureDate', range.departureDate);
    setValueAtPath(next, 'returnDate', range.returnDate);
    this.formValueChange.emit(next);
    this.#refreshFormGroupAfterProxyValidation();
  }

  /**
   * After proxy `[ngModel]` bindings propagate new values to their FormControls
   * (via NgModel's deferred `_updateValue` microtask) and the async validators
   * complete (via `timer(0)`), the validator's `setErrors()` uses `onlySelf: true`.
   * This prevents `StatusChangeEvent` from propagating to the NgForm FormGroup,
   * so `formState.errors` stays stale.
   *
   * This method forces the FormGroup to re-evaluate after validators settle,
   * ensuring `formState.errors` reflects the current validation state.
   */
  #proxyRefreshTimer?: ReturnType<typeof setTimeout>;

  #refreshFormGroupAfterProxyValidation(): void {
    clearTimeout(this.#proxyRefreshTimer);
    this.#proxyRefreshTimer = setTimeout(() => {
      const form = this.vestForm()?.ngForm?.form;
      if (!form) return;
      form.updateValueAndValidity({ emitEvent: true });
    }, 100);
  }

  protected onSubmit(): void {
    this.formSubmitted.set(true);
    this.submitted.emit();
  }

  protected onReset(): void {
    this.formSubmitted.set(false);
    this.resetRequested.emit();
  }

  resetFormState(value: TravelFormModel): void {
    this.formSubmitted.set(false);
    this.dateRangeAdapter()?.resetTouched();
    this.vestForm()?.resetForm(value);
  }
}
