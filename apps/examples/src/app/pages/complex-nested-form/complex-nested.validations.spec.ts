import { beforeEach, describe, expect, it } from 'vitest';
import { TeamMemberModel } from '../../models/complex-nested.model';
import { complexNestedSuite } from './complex-nested.validations';

const valid: TeamMemberModel = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'Engineer',
};

function run(teamMembers: Record<string, TeamMemberModel>) {
  return complexNestedSuite.run({ teamMembers });
}

/** Lets Vest's deferred "tests called in different order" error surface. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Complex nested validations', () => {
  // Vest 6 suites are stateful; reset so each case starts clean.
  beforeEach(() => {
    complexNestedSuite.reset();
  });

  it('keeps the remaining rows correct after a middle row is removed', async () => {
    run({
      '0': valid,
      '1': { ...valid, email: 'not-an-email' },
      '2': { ...valid, role: '' },
    });

    const result = run({
      '1': { ...valid, email: 'not-an-email' },
      '2': { ...valid, role: '' },
    });
    await flush();

    expect(result.getErrors('teamMembers.0.fullName')).toEqual([]);
    expect(result.getErrors('teamMembers.1.email')).toEqual([
      'Enter a valid email address',
    ]);
    expect(result.getErrors('teamMembers.2.role')).toEqual([
      'Role is required',
    ]);
  });
});
