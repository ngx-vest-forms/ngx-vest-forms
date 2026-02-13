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
  createEmptyFormState,
  FormDirective,
  NgxDeepRequired,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { ValidationDemoModel } from '../../models/validation-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';
import { mapWarningsToRecord } from '../../utils/form-warnings.util';

@Component({
  selector: 'ngx-validation-config-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './validation-config-demo.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationConfigDemoFormBody {
  readonly formValue = input.required<ValidationDemoModel>();
  readonly shape = input.required<NgxDeepRequired<ValidationDemoModel>>();
  readonly suite = input.required<NgxVestSuite<ValidationDemoModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<ValidationDemoModel>>();

  readonly formValueChange = output<ValidationDemoModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<ValidationDemoModel>>('vestForm');

  /**
   * Errors updated via the directive's (errorsChange) event binding.
   * The event fires on *every* StatusChangeEvent, making it more reactive
   * than formState.errors when the form's overall status stays the same.
   */
  protected readonly currentErrors = signal<Record<string, string[]>>({});

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = computed(() => {
    const state = this.vestForm()?.formState();
    if (!state) return createEmptyFormState<ValidationDemoModel>();
    return { ...state, errors: this.currentErrors() };
  });

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = computed(() =>
    mapWarningsToRecord(this.vestForm()?.fieldWarnings() ?? new Map())
  );

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: ValidationDemoModel): void {
    this.vestForm()?.resetForm(value);
  }
}
