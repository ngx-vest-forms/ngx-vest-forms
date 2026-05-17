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
  NgxValidationConfig,
  NgxVestForms,
  NgxVestSuite,
  provideFormContract,
} from 'ngx-vest-forms';
import {
  businessPolicyContract,
  BusinessPolicyModel,
} from '../../models/business-policy.model';
import { Card } from '../../ui/card/card.component';
import { FormSectionComponent } from '../../ui/form-section/form-section.component';
import { EU_COUNTRIES } from './business-policy.validations';

/**
 * The form body for the business-policy demo.
 *
 * Mirrors the validation-config-demo split: the page owns the form value, the
 * suite and the validation config; this component only renders fields and
 * re-exposes the packaged feedback signals. The conditional VAT-ID field is
 * shown with `@if` when the account is a business based in the EU.
 */
@Component({
  selector: 'ngx-business-policy-form-body',
  imports: [NgxVestForms, Card, FormSectionComponent],
  templateUrl: './business-policy.form.html',
  providers: [provideFormContract(businessPolicyContract)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessPolicyFormBody {
  readonly formValue = input.required<BusinessPolicyModel>();
  readonly suite = input.required<NgxVestSuite<BusinessPolicyModel>>();
  readonly validationConfig =
    input.required<NgxValidationConfig<BusinessPolicyModel>>();

  readonly formValueChange = output<BusinessPolicyModel>();
  readonly submitted = output();
  readonly resetRequested = output();

  /** EU country options that trigger the conditional VAT-ID rule. */
  protected readonly euCountries = EU_COUNTRIES;

  private readonly vestForm =
    viewChild<FormDirective<BusinessPolicyModel>>('vestForm');
  readonly feedback = createFormFeedbackSignals(this.vestForm);

  /** True when the EU country set contains the selected country. */
  protected isEuCountry(country: string | undefined): boolean {
    return !!country && (this.euCountries as readonly string[]).includes(
      country
    );
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onReset(): void {
    this.resetRequested.emit();
  }

  resetFormState(value: BusinessPolicyModel): void {
    this.vestForm()?.resetForm(value);
  }
}
