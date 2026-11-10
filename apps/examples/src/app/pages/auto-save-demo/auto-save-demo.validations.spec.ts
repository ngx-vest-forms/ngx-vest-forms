import { beforeEach, describe, expect, it } from 'vitest';
import {
  autoSaveDemoSuite,
  autoSaveDemoValidationErrorRulesByField,
  autoSaveDemoValidationWarningRulesByField,
} from './auto-save-demo.validations';

/** Messages per field, deduplicated and sorted, merged over several runs. */
function mergeMessages(runs: Record<string, string[]>[]) {
  const merged: Record<string, string[]> = {};
  for (const run of runs) {
    for (const [field, messages] of Object.entries(run)) {
      merged[field] = [...new Set([...(merged[field] ?? []), ...messages])];
    }
  }
  return Object.fromEntries(
    Object.entries(merged).map(([field, m]) => [field, m.sort()])
  );
}

function sortedCopy(map: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(map).map(([field, m]) => [field, [...m].sort()])
  );
}

const validModel = {
  projectName: 'Roadmap',
  preferredContactMethod: 'in-app' as const,
};

describe('Auto Save Demo Validations', () => {
  beforeEach(() => {
    autoSaveDemoSuite.reset();
  });

  it('accepts a minimal draft that chose in-app updates', () => {
    const result = autoSaveDemoSuite.run(validModel);

    expect(result.isValid()).toBe(true);
  });

  it('requires a project name of at least 3 characters', () => {
    const empty = autoSaveDemoSuite.only('projectName').run({});
    expect(empty.getErrors('projectName')).toContain(
      'Project name is required'
    );

    autoSaveDemoSuite.reset();
    const short = autoSaveDemoSuite
      .only('projectName')
      .run({ projectName: 'ab' });
    expect(short.getErrors('projectName')).toEqual([
      'Project name must be at least 3 characters',
    ]);

    autoSaveDemoSuite.reset();
    const ok = autoSaveDemoSuite
      .only('projectName')
      .run({ projectName: 'abc' });
    expect(ok.hasErrors('projectName')).toBe(false);
  });

  it('requires a contact method', () => {
    const result = autoSaveDemoSuite
      .only('preferredContactMethod')
      .run({ preferredContactMethod: undefined });

    expect(result.getErrors('preferredContactMethod')).toContain(
      'Choose how draft updates should reach you'
    );
  });

  describe('quantity and justification depend on each other', () => {
    it('does not ask for either when both are empty', () => {
      const result = autoSaveDemoSuite.run(validModel);

      expect(result.hasErrors('quantity')).toBe(false);
      expect(result.hasErrors('quantityJustification')).toBe(false);
    });

    it('asks for a justification once a quantity is entered', () => {
      const result = autoSaveDemoSuite.run({ ...validModel, quantity: '5' });

      expect(result.getErrors('quantityJustification')).toContain(
        'Justification is required when quantity is provided'
      );
      expect(result.hasErrors('quantity')).toBe(false);
    });

    it('asks for a quantity once a justification is entered', () => {
      const result = autoSaveDemoSuite.run({
        ...validModel,
        quantityJustification: 'Launch week',
      });

      expect(result.getErrors('quantity')).toContain(
        'Quantity is required when a justification is provided'
      );
      expect(result.hasErrors('quantityJustification')).toBe(false);
    });

    it('accepts both together', () => {
      const result = autoSaveDemoSuite.run({
        ...validModel,
        quantity: '5',
        quantityJustification: 'Launch week',
      });

      expect(result.hasErrors('quantity')).toBe(false);
      expect(result.hasErrors('quantityJustification')).toBe(false);
    });
  });

  describe('email is only validated when email updates are chosen', () => {
    it('requires an email for email updates', () => {
      const result = autoSaveDemoSuite.run({
        ...validModel,
        preferredContactMethod: 'email',
      });

      expect(result.getErrors('email')).toContain(
        'Email is required when email updates are selected'
      );
    });

    it('rejects a malformed email for email updates', () => {
      const result = autoSaveDemoSuite.run({
        ...validModel,
        preferredContactMethod: 'email',
        email: 'not-an-email',
      });

      expect(result.getErrors('email')).toContain(
        'Enter a valid email address'
      );
    });

    it('accepts a valid email for email updates', () => {
      const result = autoSaveDemoSuite.run({
        ...validModel,
        preferredContactMethod: 'email',
        email: 'ada@example.com',
      });

      expect(result.hasErrors('email')).toBe(false);
      expect(result.isValid()).toBe(true);
    });

    it.each([undefined, '', 'not-an-email'])(
      'ignores the email %j for in-app updates',
      (email) => {
        const result = autoSaveDemoSuite.run({
          ...validModel,
          preferredContactMethod: 'in-app',
          email,
        });

        expect(result.hasErrors('email')).toBe(false);
        expect(result.isValid()).toBe(true);
      }
    );
  });

  describe('notes', () => {
    it('warns about short notes without invalidating the draft', () => {
      const result = autoSaveDemoSuite.run({ ...validModel, notes: 'todo' });

      expect(result.hasWarnings('notes')).toBe(true);
      expect(result.hasErrors('notes')).toBe(false);
      expect(result.isValid()).toBe(true);
    });

    it('does not warn about empty notes', () => {
      const result = autoSaveDemoSuite.run(validModel);

      expect(result.hasWarnings('notes')).toBe(false);
    });

    it('does not warn once the notes reach 20 characters', () => {
      const result = autoSaveDemoSuite.run({
        ...validModel,
        notes: 'n'.repeat(20),
      });

      expect(result.hasWarnings('notes')).toBe(false);
    });
  });

  it('leaves other fields untested in a focused run', () => {
    const result = autoSaveDemoSuite.only('projectName').run({});

    expect(result.getErrors('projectName')).toContain(
      'Project name is required'
    );
    expect(result.isTested('preferredContactMethod')).toBe(false);
    expect(result.hasErrors('preferredContactMethod')).toBe(false);
  });

  it('keeps the exported rule-message maps in step with the suite', () => {
    // The page lists these messages as the policy; they must be the ones the
    // suite really produces. Run models that trigger every rule and collect.
    const models = [
      {},
      { projectName: 'ab' },
      { quantity: '5', quantityJustification: '' },
      { quantity: '', quantityJustification: 'why' },
      { preferredContactMethod: 'email' as const },
      { preferredContactMethod: 'email' as const, email: 'nope' },
      { notes: 'short' },
    ];
    const results = models.map((model) => {
      autoSaveDemoSuite.reset();
      return autoSaveDemoSuite.run(model);
    });

    expect(mergeMessages(results.map((r) => r.getErrors()))).toEqual(
      sortedCopy(autoSaveDemoValidationErrorRulesByField)
    );
    expect(mergeMessages(results.map((r) => r.getWarnings()))).toEqual(
      sortedCopy(autoSaveDemoValidationWarningRulesByField)
    );
  });
});
