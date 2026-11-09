import { Component, input, output, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  type FormDirective,
  type NgxSubmitSettledEvent,
  NgxVestForms,
  type NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  signalFormsInteropContract,
  type SignalFormsInteropModel,
} from '../../models/signal-forms-interop.model';
import { ConsentSwitchComponent } from './consent-switch.component';
import { SeatStepperComponent } from './seat-stepper.component';

@Component({
  selector: 'ngx-signal-forms-interop-form-body',
  imports: [NgxVestForms, SeatStepperComponent, ConsentSwitchComponent],
  templateUrl: './signal-forms-interop.form.html',
  providers: [provideFormContract(signalFormsInteropContract)],
})
export class SignalFormsInteropFormBody {
  readonly formValue = input.required<SignalFormsInteropModel>();
  readonly suite = input.required<NgxVestSuite<SignalFormsInteropModel>>();

  readonly formValueChange = output<SignalFormsInteropModel>();
  readonly submitted = output<NgxSubmitSettledEvent<SignalFormsInteropModel>>();
  readonly resetRequested = output();

  private readonly vestForm =
    viewChild<FormDirective<SignalFormsInteropModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  resetFormState(value: SignalFormsInteropModel): void {
    this.vestForm()?.resetForm(value);
  }
}
