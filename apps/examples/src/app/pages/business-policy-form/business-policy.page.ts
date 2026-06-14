import {
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { createValidationConfig } from 'ngx-vest-forms';
import { BusinessPolicyModel } from '../../models/business-policy.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { businessPolicyContent } from './business-policy.content';
import { BusinessPolicyFormBody } from './business-policy.form';
import {
  businessPolicyErrorRulesByField,
  businessPolicySuite,
  businessPolicyWarningRulesByField,
} from './business-policy.validations';

/**
 * Vest-First Business Policy demo.
 *
 * The page owns the form value signal, the suite and the validation config
 * (mirrors validation-config-demo). It showcases expressive conditional rules
 * and non-blocking advisory guidance: errors gate submission, `warn()` tests
 * never do. A form carrying only warnings still submits.
 */
@Component({
  selector: 'ngx-business-policy-page',
  imports: [
    AlertPanel,
    Card,
    ExampleCardsComponent,
    FormPageLayout,
    FormStateCardComponent,
    PageTitle,
    BusinessPolicyFormBody,
  ],
  templateUrl: './business-policy.page.html',
})
export class BusinessPolicyPageComponent {
  protected readonly feedback = computed(() => this.formBody()?.feedback);
  protected readonly exampleContent = businessPolicyContent;
  protected readonly suite = businessPolicySuite;
  protected readonly errorRules = businessPolicyErrorRulesByField;
  protected readonly warningRules = businessPolicyWarningRulesByField;

  /** The form value is the single source of truth, owned by the page. */
  protected readonly formValue = signal<BusinessPolicyModel>({});
  protected readonly submittedValue = signal<BusinessPolicyModel | null>(null);

  private readonly formBody = viewChild(BusinessPolicyFormBody);

  /**
   * Revalidate the conditional VAT-ID field whenever the inputs that gate it
   * change, and keep the revenue/credit-limit pair in sync for the ROOT_FORM
   * policy rule and the relative-size warning.
   */
  protected readonly validationConfig =
    createValidationConfig<BusinessPolicyModel>()
      .whenChanged('accountType', ['vatId', 'requestedCreditLimit'])
      .whenChanged('country', 'vatId')
      .bidirectional('annualRevenue', 'requestedCreditLimit')
      .build();

  protected onSubmit(): void {
    // Warnings are advisory and never block submit — only errors gate it.
    if (!this.feedback()?.formState()?.valid) {
      this.submittedValue.set(null);
      return;
    }
    this.submittedValue.set(structuredClone(this.formValue()));
  }

  protected reset(): void {
    this.submittedValue.set(null);
    this.formBody()?.resetFormState({});
    this.formValue.set({});
  }
}
