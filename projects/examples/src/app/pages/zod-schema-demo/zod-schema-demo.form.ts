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
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { ZodSchemaDemoModel } from '../../models/zod-schema-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';
import { mapWarningsToRecord } from '../../utils/form-warnings.util';

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

  /** Exposes the directive's packaged form state with up-to-date errors. */
  readonly formState = computed(() => {
    const state = this.vestForm()?.formState();
    if (!state) return createEmptyFormState<ZodSchemaDemoModel>();
    return { ...state, errors: this.currentErrors() };
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

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
