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
  StarterFormModel,
  starterFormShape,
} from '../../models/starter-form.model';

@Component({
  selector: 'ngx-starter-form-body',
  imports: [NgxVestForms],
  templateUrl: './starter.form.html',
  providers: [provideFormContract(starterFormShape)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarterFormBody {
  readonly formValue = input.required<StarterFormModel>();
  readonly suite = input.required<NgxVestSuite<StarterFormModel>>();

  readonly formValueChange = output<StarterFormModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<StarterFormModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

        
  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: StarterFormModel): void {
    this.vestForm()?.resetForm(value);
  }

  focusFirstInvalidControl(): void {
    this.vestForm()?.focusFirstInvalidControl();
  }
}
