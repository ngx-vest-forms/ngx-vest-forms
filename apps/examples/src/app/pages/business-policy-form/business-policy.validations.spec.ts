import { ROOT_FORM } from 'ngx-vest-forms';
import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessPolicyModel } from './business-policy.model';
import {
  businessPolicyErrorRulesByField,
  businessPolicySuite,
  businessPolicyWarningRulesByField,
} from './business-policy.validations';

const personal: BusinessPolicyModel = {
  accountType: 'personal',
  legalName: 'Ada Lovelace',
  country: 'US',
  requestedCreditLimit: 1000,
  paymentTermsDays: 30,
};

const business: BusinessPolicyModel = {
  accountType: 'business',
  legalName: 'Analytical Engines BV',
  country: 'US',
  annualRevenue: 500000,
  requestedCreditLimit: 20000,
  paymentTermsDays: 30,
};

describe('Business Policy Validations', () => {
  beforeEach(() => {
    businessPolicySuite.reset();
  });

  it('accepts a complete personal account', () => {
    const result = businessPolicySuite.run(personal);

    expect(result.isValid()).toBe(true);
    expect(result.hasErrors()).toBe(false);
  });

  it('accepts a complete non-EU business account without a VAT ID', () => {
    const result = businessPolicySuite.run(business);

    expect(result.isValid()).toBe(true);
  });

  it('requires account type, legal name and country', () => {
    const result = businessPolicySuite.run({});

    expect(result.getErrors('accountType')).toContain(
      'Account type is required'
    );
    expect(result.getErrors('legalName')).toContain('Legal name is required');
    expect(result.getErrors('country')).toContain('Country is required');
  });

  describe('VAT ID', () => {
    it('is required for a business account in an EU country', () => {
      const result = businessPolicySuite.run({ ...business, country: 'DE' });

      expect(result.getErrors('vatId')).toContain(
        'VAT ID is required for EU-based business accounts'
      );
    });

    it('is satisfied by entering a VAT ID', () => {
      const result = businessPolicySuite.run({
        ...business,
        country: 'DE',
        vatId: 'DE123456789',
      });

      expect(result.hasErrors('vatId')).toBe(false);
    });

    it('is not required for a business account outside the EU', () => {
      const result = businessPolicySuite.run({ ...business, country: 'US' });

      expect(result.hasErrors('vatId')).toBe(false);
    });

    it('is not required for a personal account in an EU country', () => {
      const result = businessPolicySuite.run({ ...personal, country: 'DE' });

      expect(result.hasErrors('vatId')).toBe(false);
    });
  });

  describe('credit limit and payment terms', () => {
    it('requires a credit limit above zero', () => {
      const result = businessPolicySuite.run({
        ...personal,
        requestedCreditLimit: 0,
      });

      expect(result.getErrors('requestedCreditLimit')).toContain(
        'Requested credit limit must be greater than 0'
      );
    });

    it.each([0, 14, 30, 60])('allows payment terms of %i days', (days) => {
      const result = businessPolicySuite.run({
        ...personal,
        paymentTermsDays: days,
      });

      expect(result.hasErrors('paymentTermsDays')).toBe(false);
    });

    it('rejects payment terms outside the allowed set', () => {
      const result = businessPolicySuite.run({
        ...personal,
        paymentTermsDays: 45,
      });

      expect(result.getErrors('paymentTermsDays')).toContain(
        'Payment terms must be one of 0, 14, 30 or 60 days'
      );
    });
  });

  describe('revenue band rule on ROOT_FORM', () => {
    it('blocks a low-revenue business asking for a high credit limit', () => {
      const result = businessPolicySuite.run({
        ...business,
        annualRevenue: 40000,
        requestedCreditLimit: 20000,
      });

      expect(result.getErrors(ROOT_FORM)).toContain(
        'Credit limit exceeds policy for this revenue band'
      );
      expect(result.isValid()).toBe(false);
    });

    it('allows the same credit limit with revenue of 50000 or more', () => {
      const result = businessPolicySuite.run({
        ...business,
        annualRevenue: 50000,
        requestedCreditLimit: 20000,
      });

      expect(result.hasErrors(ROOT_FORM)).toBe(false);
    });

    it('allows a low-revenue business a credit limit of 10000 or less', () => {
      const result = businessPolicySuite.run({
        ...business,
        annualRevenue: 40000,
        requestedCreditLimit: 10000,
      });

      expect(result.hasErrors(ROOT_FORM)).toBe(false);
    });

    it('does not apply to personal accounts', () => {
      const result = businessPolicySuite.run({
        ...personal,
        annualRevenue: 1000,
        requestedCreditLimit: 20000,
      });

      expect(result.hasErrors(ROOT_FORM)).toBe(false);
    });

    it('is not attached to any single field', () => {
      const result = businessPolicySuite.run({
        ...business,
        annualRevenue: 40000,
        requestedCreditLimit: 20000,
      });

      expect(result.hasErrors('requestedCreditLimit')).toBe(false);
      expect(result.hasErrors('annualRevenue')).toBe(false);
    });
  });

  describe('advisory warnings never block the form', () => {
    it('warns when the credit limit is high relative to revenue', () => {
      const result = businessPolicySuite.run({
        ...business,
        annualRevenue: 100000,
        requestedCreditLimit: 60000,
      });

      expect(result.getWarnings('requestedCreditLimit')).toContain(
        'Requested credit limit is high relative to revenue — expect manual review'
      );
      expect(result.hasErrors('requestedCreditLimit')).toBe(false);
      expect(result.isValid()).toBe(true);
    });

    it('does not warn when the credit limit is at most half the revenue', () => {
      const result = businessPolicySuite.run({
        ...business,
        annualRevenue: 100000,
        requestedCreditLimit: 50000,
      });

      expect(result.hasWarnings('requestedCreditLimit')).toBe(false);
    });

    it('warns as soon as the credit limit passes half the revenue', () => {
      const result = businessPolicySuite.run({
        ...business,
        annualRevenue: 100000,
        requestedCreditLimit: 50001,
      });

      expect(result.hasWarnings('requestedCreditLimit')).toBe(true);
    });

    it('does not compare against revenue when no revenue is entered', () => {
      const result = businessPolicySuite.run({
        ...business,
        annualRevenue: undefined,
        requestedCreditLimit: 60000,
      });

      expect(result.hasWarnings('requestedCreditLimit')).toBe(false);
    });

    it.each([0, 14, 30, 59])(
      'does not warn about payment terms of %i days',
      (days) => {
        const result = businessPolicySuite.run({
          ...personal,
          paymentTermsDays: days,
        });

        expect(result.hasWarnings('paymentTermsDays')).toBe(false);
      }
    );

    it('warns about long payment terms but keeps the field valid', () => {
      const result = businessPolicySuite.run({
        ...personal,
        paymentTermsDays: 60,
      });

      expect(result.getWarnings('paymentTermsDays')).toContain(
        'Long payment terms may slow onboarding'
      );
      expect(result.hasErrors('paymentTermsDays')).toBe(false);
      expect(result.isValid()).toBe(true);
    });

    it('warns when a personal account requests more than 5000', () => {
      const result = businessPolicySuite.run({
        ...personal,
        requestedCreditLimit: 6000,
      });

      expect(result.getWarnings('requestedCreditLimit')).toContain(
        'Personal accounts above 5000 usually need a business upgrade'
      );
      expect(result.isValid()).toBe(true);
    });

    it('does not give business accounts the personal upgrade hint', () => {
      const result = businessPolicySuite.run({
        ...business,
        requestedCreditLimit: 6000,
      });

      expect(result.hasWarnings('requestedCreditLimit')).toBe(false);
    });

    it('does not warn a personal account at exactly 5000', () => {
      const result = businessPolicySuite.run({
        ...personal,
        requestedCreditLimit: 5000,
      });

      expect(result.hasWarnings('requestedCreditLimit')).toBe(false);
    });

    it('warns a personal account just above 5000', () => {
      const result = businessPolicySuite.run({
        ...personal,
        requestedCreditLimit: 5001,
      });

      expect(result.hasWarnings('requestedCreditLimit')).toBe(true);
    });
  });

  it('leaves other fields untested in a focused run', () => {
    const result = businessPolicySuite.only('legalName').run({});

    expect(result.getErrors('legalName')).toContain('Legal name is required');
    expect(result.isTested('country')).toBe(false);
    expect(result.hasErrors(ROOT_FORM)).toBe(false);
  });

  it('keeps the exported rule-message maps in step with the suite', () => {
    // The form-state card lists these messages as the policy; they must be the
    // ones the suite really produces.
    const models: BusinessPolicyModel[] = [
      {},
      { accountType: 'business', country: 'DE' },
      { accountType: 'personal', requestedCreditLimit: 6000 },
      { requestedCreditLimit: 1, paymentTermsDays: 45 },
      {
        accountType: 'business',
        annualRevenue: 1000,
        requestedCreditLimit: 20000,
        paymentTermsDays: 60,
      },
    ];
    const results = models.map((model) => {
      businessPolicySuite.reset();
      return businessPolicySuite.run(model);
    });

    const merge = (runs: Record<string, string[]>[]) => {
      const merged: Record<string, string[]> = {};
      for (const run of runs) {
        for (const [field, messages] of Object.entries(run)) {
          merged[field] = [...new Set([...(merged[field] ?? []), ...messages])];
        }
      }
      return Object.fromEntries(
        Object.entries(merged).map(([field, m]) => [field, m.sort()])
      );
    };
    const sortedCopy = (map: Record<string, string[]>) =>
      Object.fromEntries(
        Object.entries(map).map(([field, m]) => [field, [...m].sort()])
      );

    expect(merge(results.map((r) => r.getErrors()))).toEqual(
      sortedCopy(businessPolicyErrorRulesByField)
    );
    expect(merge(results.map((r) => r.getWarnings()))).toEqual(
      sortedCopy(businessPolicyWarningRulesByField)
    );
  });
});
