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
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';
import {
  NativeSchemaDemoModel,
  nativeSchemaDemoContract,
} from '../../models/native-schema-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';

@Component({
  selector: 'ngx-native-schema-demo-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './native-schema-demo.form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NativeSchemaDemoFormBody {
  readonly formValue = input.required<NativeSchemaDemoModel>();
  readonly suite = input.required<NgxVestSuite<NativeSchemaDemoModel>>();
  readonly formContract = nativeSchemaDemoContract;

  readonly formValueChange = output<NativeSchemaDemoModel>();
  readonly submitted = output();

  private readonly vestForm = viewChild('vestForm', {
    read: FormDirective<NativeSchemaDemoModel>,
  });

  protected readonly currentErrors = signal<Record<string, string[]>>({});
  readonly feedback = createFormFeedbackSignals(this.vestForm, {
    formState: computed(() => {
      const state = this.vestForm()?.formState();
      if (!state) return createEmptyFormState<NativeSchemaDemoModel>();
      return { ...state, errors: this.currentErrors() };
    }),
  });

        
  protected onSubmit(): void {
    this.submitted.emit();
  }
}
