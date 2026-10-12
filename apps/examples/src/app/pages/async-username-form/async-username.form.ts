import {
  Component,
  computed,
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
  AsyncUsernameModel,
  asyncUsernameShape,
} from '../../models/async-username.model';

@Component({
  selector: 'ngx-async-username-form-body',
  imports: [NgxVestForms],
  templateUrl: './async-username.form.html',
  providers: [provideFormContract(asyncUsernameShape)],
})
export class AsyncUsernameFormBody {
  readonly formValue = input.required<AsyncUsernameModel>();
  readonly suite = input.required<NgxVestSuite<AsyncUsernameModel>>();

  readonly formValueChange = output<AsyncUsernameModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<AsyncUsernameModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  private readonly usernameErrors = computed(
    () => this.feedback.formState()?.errors['username'] ?? []
  );

  protected readonly usernameResolved = computed(() => {
    const validated = this.feedback.validatedFields() ?? [];
    return (
      !this.feedback.pending() &&
      validated.includes('username') &&
      this.usernameErrors().length === 0 &&
      !!this.formValue().username
    );
  });

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: AsyncUsernameModel): void {
    this.vestForm()?.resetForm(value);
  }
}
