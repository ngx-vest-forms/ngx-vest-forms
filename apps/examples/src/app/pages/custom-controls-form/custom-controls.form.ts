import {
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
  customControlsContract,
  CustomControlsModel,
} from '../../models/custom-controls.model';
import { SegmentedControlComponent } from './segmented-control.component';
import { StarRatingComponent } from './star-rating.component';
import { TagInputComponent } from './tag-input.component';

@Component({
  selector: 'ngx-custom-controls-form-body',
  imports: [
    NgxVestForms,
    StarRatingComponent,
    SegmentedControlComponent,
    TagInputComponent,
  ],
  templateUrl: './custom-controls.form.html',
  providers: [provideFormContract(customControlsContract)],
})
export class CustomControlsFormBody {
  readonly formValue = input.required<CustomControlsModel>();
  readonly suite = input.required<NgxVestSuite<CustomControlsModel>>();

  readonly formValueChange = output<CustomControlsModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<CustomControlsModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: CustomControlsModel): void {
    this.vestForm()?.resetForm(value);
  }

  focusFirstInvalidControl(): void {
    this.vestForm()?.focusFirstInvalidControl();
  }
}
