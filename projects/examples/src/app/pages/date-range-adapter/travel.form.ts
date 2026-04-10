import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
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
  NgxTypedVestSuite,
  NgxValidationConfig,
  NgxVestForms,
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
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  #validationRefreshTimer?: ReturnType<typeof setTimeout>;

  readonly approach = input<TravelFormApproach>('split-wrappers');
  readonly formValue = input.required<TravelFormModel>();
  readonly shape = input.required<NgxDeepRequired<TravelFormModel>>();
  readonly suite = input.required<NgxTypedVestSuite<TravelFormModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<TravelFormModel>>();

  readonly formValueChange = output<TravelFormModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  readonly departureErrors = input<string[]>([]);
  readonly returnErrors = input<string[]>([]);
  readonly departureWarnings = input<string[]>([]);
  readonly returnWarnings = input<string[]>([]);

  private readonly vestForm =
    viewChild<FormDirective<TravelFormModel>>('vestForm');
  private readonly dateRangeAdapter = viewChild(DateRangeAdapterComponent);

  readonly formSubmitted = signal(false);

  constructor() {
    this.#destroyRef.onDestroy(() => {
      clearTimeout(this.#validationRefreshTimer);
    });
  }

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

    // Wait for the hidden proxy `[ngModel]` inputs to render, then schedule one
    // macrotask so NgModel's deferred sync has completed before we refresh validation.
    afterNextRender(
      () => {
        clearTimeout(this.#validationRefreshTimer);
        this.#validationRefreshTimer = setTimeout(() => {
          this.vestForm()?.triggerFormValidation();
        }, 0);
      },
      { injector: this.#injector }
    );
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
