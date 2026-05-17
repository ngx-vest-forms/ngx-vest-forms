import { NgxVestSuite, ROOT_FORM } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test, warn } from 'vest';
import { BusinessPolicyModel } from '../../models/business-policy.model';

/**
 * EU member-state country codes that trigger the conditional VAT-ID rule.
 * A small representative set is enough for the demo.
 */
export const EU_COUNTRIES = [
  'AT',
  'BE',
  'DE',
  'ES',
  'FR',
  'IE',
  'IT',
  'NL',
  'PL',
  'SE',
] as const;

/** Allowed payment-term values, in days. */
export const ALLOWED_PAYMENT_TERMS = [0, 14, 30, 60] as const;

const isEuCountry = (country: string | undefined): boolean =>
  !!country && (EU_COUNTRIES as readonly string[]).includes(country);

/**
 * The Vest suite for the business-policy form.
 *
 * It is a plain Vest spec — no Angular dependency — so it can be unit-tested in
 * isolation by calling `businessPolicySuite(model)` directly. All policy logic
 * lives here:
 *
 * - ERROR tests block submission (required fields, conditional VAT ID,
 *   credit-limit floor, allowed payment terms, plus a cross-field ROOT_FORM
 *   revenue-band rule).
 * - WARN tests (`warn()`) are advisory only and never block submission — they
 *   model "expect manual review" style guidance separately from hard errors.
 */
export const businessPolicySuite: NgxVestSuite<BusinessPolicyModel> = create(
  (model: BusinessPolicyModel) => {
    // ── Blocking errors ────────────────────────────────────────────────
    test('accountType', 'Account type is required', () => {
      enforce(model.accountType).isNotBlank();
    });

    test('legalName', 'Legal name is required', () => {
      enforce(model.legalName).isNotBlank();
    });

    test('country', 'Country is required', () => {
      enforce(model.country).isNotBlank();
    });

    // Conditional rule: VAT ID is required ONLY for business accounts based in
    // the EU. omitWhen keeps the rule out of the suite entirely otherwise, so
    // it never reports an error for personal or non-EU accounts.
    omitWhen(
      model.accountType !== 'business' || !isEuCountry(model.country),
      () => {
        test(
          'vatId',
          'VAT ID is required for EU-based business accounts',
          () => {
            enforce(model.vatId).isNotBlank();
          }
        );
      }
    );

    test('requestedCreditLimit', 'Requested credit limit must be greater than 0', () => {
      enforce(Number(model.requestedCreditLimit ?? 0)).greaterThan(0);
    });

    test(
      'paymentTermsDays',
      'Payment terms must be one of 0, 14, 30 or 60 days',
      () => {
        enforce(
          (ALLOWED_PAYMENT_TERMS as readonly number[]).includes(
            Number(model.paymentTermsDays)
          )
        ).isTruthy();
      }
    );

    // Cross-field policy expressed as a ROOT_FORM error: a low-revenue business
    // account cannot request a high credit limit.
    omitWhen(model.accountType !== 'business', () => {
      test(
        ROOT_FORM,
        'Credit limit exceeds policy for this revenue band',
        () => {
          const revenue = Number(model.annualRevenue ?? 0);
          const creditLimit = Number(model.requestedCreditLimit ?? 0);
          enforce(revenue < 50000 && creditLimit > 10000).isFalsy();
        }
      );
    });

    // ── Advisory warnings (never block submit) ────────────────────────
    omitWhen(
      !model.requestedCreditLimit || !model.annualRevenue,
      () => {
        test(
          'requestedCreditLimit',
          'Requested credit limit is high relative to revenue — expect manual review',
          () => {
            warn();
            enforce(
              Number(model.requestedCreditLimit ?? 0) >
                Number(model.annualRevenue ?? 0) * 0.5
            ).isFalsy();
          }
        );
      }
    );

    omitWhen(!model.paymentTermsDays, () => {
      test(
        'paymentTermsDays',
        'Long payment terms may slow onboarding',
        () => {
          warn();
          enforce(Number(model.paymentTermsDays ?? 0)).lessThan(60);
        }
      );
    });

    omitWhen(model.accountType !== 'personal', () => {
      test(
        'requestedCreditLimit',
        'Personal accounts above 5000 usually need a business upgrade',
        () => {
          warn();
          enforce(Number(model.requestedCreditLimit ?? 0)).lessThanOrEquals(
            5000
          );
        }
      );
    });
  }
);

/**
 * Blocking error rules per field path. Mirrors the auto-save-demo map; used by
 * the form-state card to show the policy that hasn't been triggered yet.
 */
export const businessPolicyErrorRulesByField: Record<string, string[]> = {
  accountType: ['Account type is required'],
  legalName: ['Legal name is required'],
  country: ['Country is required'],
  vatId: ['VAT ID is required for EU-based business accounts'],
  requestedCreditLimit: ['Requested credit limit must be greater than 0'],
  paymentTermsDays: ['Payment terms must be one of 0, 14, 30 or 60 days'],
  [ROOT_FORM]: ['Credit limit exceeds policy for this revenue band'],
};

/**
 * Advisory (non-blocking) `warn()` rules per field path. These never prevent
 * submission — they are surfaced separately from errors in the UI.
 */
export const businessPolicyWarningRulesByField: Record<string, string[]> = {
  requestedCreditLimit: [
    'Requested credit limit is high relative to revenue — expect manual review',
    'Personal accounts above 5000 usually need a business upgrade',
  ],
  paymentTermsDays: ['Long payment terms may slow onboarding'],
};
