import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createEmptyFormState,
  FormDirective,
  NgxFieldBlurEvent,
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import { AutoSaveDemoModel } from '../../models/auto-save-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';
import { mapWarningsToRecord } from '../../utils/form-warnings.util';

@Component({
  selector: 'ngx-auto-save-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './auto-save-demo.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoSaveDemoFormBody {
  readonly formValue = input.required<AutoSaveDemoModel>();
  readonly suite = input.required<NgxVestSuite<AutoSaveDemoModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<AutoSaveDemoModel>>();

  readonly formValueChange = output<AutoSaveDemoModel>();
  readonly submitted = output();
  readonly resetRequested = output();
  readonly fieldBlurred = output<NgxFieldBlurEvent<AutoSaveDemoModel>>();

  private readonly vestForm =
    viewChild<FormDirective<AutoSaveDemoModel>>('vestForm');

  readonly formState = computed(() => {
    const state = this.vestForm()?.formState();
    if (!state) return createEmptyFormState<AutoSaveDemoModel>();
    return state;
  });

  readonly warnings = computed(() =>
    mapWarningsToRecord(this.vestForm()?.fieldWarnings() ?? new Map())
  );

  readonly validatedFields = computed(
    () => this.vestForm()?.touchedFieldPaths() ?? []
  );

  readonly pending = computed(
    () => this.vestForm()?.ngForm.form.pending ?? false
  );

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: AutoSaveDemoModel): void {
    this.vestForm()?.resetForm(value);
  }
}
