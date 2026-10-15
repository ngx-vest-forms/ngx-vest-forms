import { beforeEach, describe, expect, it } from 'vitest';
import { wizardStep1Suite, wizardStep2Suite } from './wizard.validations';

const INVALID_EMAIL = 'Please enter a valid email address';
const INVALID_PHONE = 'Please enter a valid phone number';

describe('Wizard validations', () => {
  // Vest 6 suites are stateful; reset so each case starts clean.
  beforeEach(() => {
    wizardStep1Suite.reset();
    wizardStep2Suite.reset();
  });

  describe('step 1 email format', () => {
    it('rejects an address without a domain', () => {
      const result = wizardStep1Suite.run({ email: 'invalid-email' });
      expect(result.getErrors('email')).toContain(INVALID_EMAIL);
    });

    it('accepts a well-formed address', () => {
      const result = wizardStep1Suite.run({ email: 'test@example.com' });
      expect(result.getErrors('email')).not.toContain(INVALID_EMAIL);
    });
  });

  describe('step 2 phone format', () => {
    it('rejects a number that is too short', () => {
      const result = wizardStep2Suite.run({ phone: '123' });
      expect(result.getErrors('phone')).toContain(INVALID_PHONE);
    });

    it('accepts a dashed ten-digit number', () => {
      const result = wizardStep2Suite.run({ phone: '123-456-7890' });
      expect(result.getErrors('phone')).not.toContain(INVALID_PHONE);
    });
  });
});
