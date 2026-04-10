import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Composite value for the date range adapter.
 * Uses named fields instead of positional tuples for clarity.
 */
export type DateRangeValue = {
  departureDate?: string;
  returnDate?: string;
};

let nextId = 0;

/**
 * Pure presentational adapter for a composite date range control.
 *
 * **Why this component handles its own error display:**
 * `<ngx-control-wrapper>` discovers a single `NgModel` child via `contentChild(NgModel)`.
 * A composite adapter maps one UI widget to _multiple_ flat model fields
 * (`departureDate` + `returnDate`), so there is no single NgModel for the wrapper
 * to bind to. The parent form body passes field-specific errors and warnings into
 * the adapter, which renders a shared visible summary plus input-specific
 * descriptions for assistive technology.
 *
 * **Display mode gating:** The adapter mimics the library's default `on-blur-or-submit`
 * display mode. Errors and warnings are only shown for the specific input that has
 * been blurred, or for all inputs after form submission. This prevents untouched
 * sibling fields from showing errors too early.
 *
 * If your date fields can be presented as two independent controls, prefer wrapping
 * each in its own `<ngx-control-wrapper>` instead — the library handles ARIA wiring,
 * display modes, pending states, and warnings automatically.
 */
@Component({
  selector: 'ngx-date-range-adapter',
  template: `
    <fieldset class="space-y-4" role="group" [attr.aria-labelledby]="legendId">
      <legend [id]="legendId" class="label-text font-semibold">
        Travel Date Range
      </legend>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div class="form-field">
          <label [for]="departureInputId">
            <span class="label-text">Departure Date</span>
            <input
              [id]="departureInputId"
              type="date"
              class="input-field"
              [class.input-field--invalid]="shouldShowDepartureErrors()"
              [value]="departureValue()"
              [attr.aria-invalid]="shouldShowDepartureErrors() || null"
              [attr.aria-describedby]="departureAriaDescribedBy()"
              (input)="onDepartureChange($event)"
              (blur)="onBlur('departure')"
            />
          </label>
        </div>

        <div class="form-field">
          <label [for]="returnInputId">
            <span class="label-text">Return Date</span>
            <input
              [id]="returnInputId"
              type="date"
              class="input-field"
              [class.input-field--invalid]="shouldShowReturnErrors()"
              [value]="returnValue()"
              [attr.aria-invalid]="shouldShowReturnErrors() || null"
              [attr.aria-describedby]="returnAriaDescribedBy()"
              (input)="onReturnChange($event)"
              (blur)="onBlur('return')"
            />
          </label>
        </div>
      </div>

      <div
        [id]="visibleErrorRegionId"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @for (error of visibleErrors(); track error) {
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        }
      </div>

      <div
        [id]="visibleWarningRegionId"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @for (warning of visibleWarnings(); track warning) {
          <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
            {{ warning }}
          </p>
        }
      </div>

      <div [id]="departureErrorRegionId" class="sr-only">
        @for (error of departureDisplayErrors(); track error) {
          <p>{{ error }}</p>
        }
      </div>

      <div [id]="departureWarningRegionId" class="sr-only">
        @for (warning of departureDisplayWarnings(); track warning) {
          <p>{{ warning }}</p>
        }
      </div>

      <div [id]="returnErrorRegionId" class="sr-only">
        @for (error of returnDisplayErrors(); track error) {
          <p>{{ error }}</p>
        }
      </div>

      <div [id]="returnWarningRegionId" class="sr-only">
        @for (warning of returnDisplayWarnings(); track warning) {
          <p>{{ warning }}</p>
        }
      </div>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeAdapterComponent {
  private readonly uid = nextId++;

  protected readonly legendId = `date-range-legend-${this.uid}`;
  protected readonly departureInputId = `departure-date-${this.uid}`;
  protected readonly returnInputId = `return-date-${this.uid}`;
  protected readonly visibleErrorRegionId = `date-range-errors-${this.uid}`;
  protected readonly visibleWarningRegionId = `date-range-warnings-${this.uid}`;
  protected readonly departureErrorRegionId = `departure-errors-${this.uid}`;
  protected readonly departureWarningRegionId = `departure-warnings-${this.uid}`;
  protected readonly returnErrorRegionId = `return-errors-${this.uid}`;
  protected readonly returnWarningRegionId = `return-warnings-${this.uid}`;

  readonly value = input<DateRangeValue>({});
  readonly departureErrors = input<string[]>([]);
  readonly returnErrors = input<string[]>([]);
  readonly departureWarnings = input<string[]>([]);
  readonly returnWarnings = input<string[]>([]);
  readonly formSubmitted = input(false);

  private readonly departureTouched = signal(false);
  private readonly returnTouched = signal(false);

  /** Mimics the library's default `on-blur-or-submit` display mode. */
  protected readonly shouldShowDepartureErrors = computed(
    () =>
      (this.departureTouched() || this.formSubmitted()) &&
      this.departureErrors().length > 0
  );

  protected readonly shouldShowReturnErrors = computed(
    () =>
      (this.returnTouched() || this.formSubmitted()) &&
      this.returnErrors().length > 0
  );

  protected readonly shouldShowDepartureWarnings = computed(
    () =>
      (this.departureTouched() || this.formSubmitted()) &&
      this.departureWarnings().length > 0
  );

  protected readonly shouldShowReturnWarnings = computed(
    () =>
      (this.returnTouched() || this.formSubmitted()) &&
      this.returnWarnings().length > 0
  );

  protected readonly departureDisplayErrors = computed(() =>
    Array.from(
      new Set(this.shouldShowDepartureErrors() ? this.departureErrors() : [])
    )
  );

  protected readonly returnDisplayErrors = computed(() =>
    Array.from(
      new Set(this.shouldShowReturnErrors() ? this.returnErrors() : [])
    )
  );

  protected readonly departureDisplayWarnings = computed(() =>
    Array.from(
      new Set(
        this.shouldShowDepartureWarnings() ? this.departureWarnings() : []
      )
    )
  );

  protected readonly returnDisplayWarnings = computed(() =>
    Array.from(
      new Set(this.shouldShowReturnWarnings() ? this.returnWarnings() : [])
    )
  );

  protected readonly visibleErrors = computed(() =>
    Array.from(
      new Set([...this.departureDisplayErrors(), ...this.returnDisplayErrors()])
    )
  );

  protected readonly visibleWarnings = computed(() =>
    Array.from(
      new Set([
        ...this.departureDisplayWarnings(),
        ...this.returnDisplayWarnings(),
      ])
    )
  );

  protected readonly departureAriaDescribedBy = computed(() => {
    const ids: string[] = [];
    if (this.departureDisplayErrors().length > 0) {
      ids.push(this.departureErrorRegionId);
    }
    if (this.departureDisplayWarnings().length > 0) {
      ids.push(this.departureWarningRegionId);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  });

  protected readonly returnAriaDescribedBy = computed(() => {
    const ids: string[] = [];
    if (this.returnDisplayErrors().length > 0) {
      ids.push(this.returnErrorRegionId);
    }
    if (this.returnDisplayWarnings().length > 0) {
      ids.push(this.returnWarningRegionId);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  });

  readonly valueChange = output<DateRangeValue>();

  protected readonly departureValue = computed(
    () => this.value().departureDate ?? ''
  );
  protected readonly returnValue = computed(
    () => this.value().returnDate ?? ''
  );

  protected onBlur(field: 'departure' | 'return'): void {
    if (field === 'departure') {
      this.departureTouched.set(true);
      return;
    }

    this.returnTouched.set(true);
  }

  /** Reset touched state (called by form body on form reset). */
  resetTouched(): void {
    this.departureTouched.set(false);
    this.returnTouched.set(false);
  }

  protected onDepartureChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value || undefined;
    this.valueChange.emit({ ...this.value(), departureDate: val });
  }

  protected onReturnChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value || undefined;
    this.valueChange.emit({ ...this.value(), returnDate: val });
  }
}
