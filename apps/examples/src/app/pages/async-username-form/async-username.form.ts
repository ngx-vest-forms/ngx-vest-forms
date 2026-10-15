import { Component, computed, input, output, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NGX_PENDING_LABEL,
  NGX_VALIDATION_DEBOUNCE_PRESETS,
  NgxSubmitSettledEvent,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
  ValidationOptions,
} from 'ngx-vest-forms';
import {
  AsyncUsernameModel,
  asyncUsernameShape,
} from '../../models/async-username.model';

@Component({
  selector: 'ngx-async-username-form-body',
  imports: [NgxVestForms],
  templateUrl: './async-username.form.html',
  providers: [
    provideFormContract(asyncUsernameShape),
    // The wrappers' pending message; provide it app-wide to translate it.
    { provide: NGX_PENDING_LABEL, useValue: 'Checking availability…' },
  ],
})
export class AsyncUsernameFormBody {
  readonly formValue = input.required<AsyncUsernameModel>();
  readonly suite = input.required<NgxVestSuite<AsyncUsernameModel>>();

  readonly formValueChange = output<AsyncUsernameModel>();
  readonly submitted = output<NgxSubmitSettledEvent<AsyncUsernameModel>>();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<AsyncUsernameModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  /** Wait until typing pauses before calling the availability endpoint. */
  protected readonly usernameValidationOptions: ValidationOptions = {
    debounceTime: NGX_VALIDATION_DEBOUNCE_PRESETS.async,
  };

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

  protected onSubmitSettled(
    event: NgxSubmitSettledEvent<AsyncUsernameModel>
  ): void {
    this.submitted.emit(event);
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: AsyncUsernameModel): void {
    this.vestForm()?.resetForm(value);
  }
}
