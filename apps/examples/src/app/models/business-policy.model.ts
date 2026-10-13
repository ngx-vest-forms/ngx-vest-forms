import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

/**
 * A business account application.
 *
 * `NgxDeepPartial` keeps every field optional — the template owns the truth and
 * fields populate progressively. The interesting bit is the policy layer in
 * `business-policy.validations.ts`: most rules are conditional and several are
 * advisory-only `warn()` checks that never block submit.
 */
export type BusinessPolicyModel = NgxDeepPartial<{
  accountType: 'personal' | 'business';
  legalName: string;
  country: string;
  vatId: string;
  annualRevenue: number;
  requestedCreditLimit: number;
  paymentTermsDays: number;
}>;

/**
 * The form contract: the fully-required mirror of the model. Providing it via
 * `provideFormContract` lets ngx-vest-forms warn (in dev) about `name`
 * attributes that don't line up with the model shape.
 */
export const businessPolicyContract: NgxDeepRequired<BusinessPolicyModel> = {
  accountType: 'personal',
  legalName: '',
  country: '',
  vatId: '',
  annualRevenue: 0,
  requestedCreditLimit: 0,
  paymentTermsDays: 0,
};
