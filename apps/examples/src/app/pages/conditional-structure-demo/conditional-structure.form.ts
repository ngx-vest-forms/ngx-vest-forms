import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  conditionalStructureContract,
  ConditionalStructureModel,
} from '../../models/conditional-structure.model';

@Component({
  selector: 'ngx-conditional-structure-form-body',
  imports: [NgxVestForms],
  templateUrl: './conditional-structure.form.html',
  providers: [provideFormContract(conditionalStructureContract)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalStructureFormBody {
  readonly formValue = input.required<ConditionalStructureModel>();
  readonly suite = input.required<NgxVestSuite<ConditionalStructureModel>>();

  readonly formValueChange = output<ConditionalStructureModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<ConditionalStructureModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: ConditionalStructureModel): void {
    this.vestForm()?.resetForm(value);
  }

  focusFirstInvalidControl(): void {
    this.vestForm()?.focusFirstInvalidControl();
  }

  triggerValidation(): void {
    this.vestForm()?.triggerFormValidation();
  }
}
