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
  createFormFeedbackSignals,
  FormDirective,
  NgxDeepRequired,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { ZodSchemaDemoModel } from '../../models/zod-schema-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';

@Component({
  selector: 'ngx-zod-schema-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './zod-schema-demo.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZodSchemaDemoFormBody {
  readonly formValue = input.required<ZodSchemaDemoModel>();
  readonly shape = input.required<NgxDeepRequired<ZodSchemaDemoModel>>();
  readonly suite = input.required<NgxVestSuite<ZodSchemaDemoModel>>();

  readonly formValueChange = output<ZodSchemaDemoModel>();
  readonly submitted = output();

  private readonly vestForm = viewChild('vestForm', {
    read: FormDirective<ZodSchemaDemoModel>,
  });

  /**
   * Errors updated via the directive's (errorsChange) event binding.
   * The event fires on *every* StatusChangeEvent, making it more reactive
   * than formState.errors when the form's overall status stays the same.
   */
  protected readonly currentErrors = signal<Record<string, string[]>>({});
  private readonly formFeedback = createFormFeedbackSignals(this.vestForm, {
    formState: computed(() => {
      const state = this.vestForm()?.formState();
      if (!state) return createEmptyFormState<ZodSchemaDemoModel>();
      return { ...state, errors: this.currentErrors() };
    }),
  });

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = this.formFeedback.formState;

  /** Exposes field warnings as a plain Record for presentational components. */
  readonly warnings = this.formFeedback.warnings;

  /** Field paths that have been validated (touched/blurred or submitted). */
  readonly validatedFields = this.formFeedback.validatedFields;

  /** True while async validation is in progress. */
  readonly pending = this.formFeedback.pending;

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
