import { ROOT_FORM } from 'ngx-vest-forms';
import { describe, expect, it } from 'vitest';
import { BusinessHourFormModel } from '../../models/business-hours-form.model';
import { businessHoursSuite } from './business-hours.validations';

const OVERLAP = 'There should be no overlap between business hours';

function run(...hours: BusinessHourFormModel[]) {
  const values = Object.fromEntries(hours.map((hour, i) => [String(i), hour]));
  return businessHoursSuite.run({ businessHours: { values } });
}

describe('Business hours validations', () => {
  it('accepts non-overlapping ranges added in start order', () => {
    const result = run(
      { from: '08:00', to: '10:00' },
      { from: '12:00', to: '14:00' }
    );
    expect(result.getErrors(ROOT_FORM)).not.toContain(OVERLAP);
  });

  it('accepts non-overlapping ranges added out of start order', () => {
    const result = run(
      { from: '12:00', to: '14:00' },
      { from: '08:00', to: '10:00' }
    );
    expect(result.getErrors(ROOT_FORM)).not.toContain(OVERLAP);
  });

  it('reports overlapping ranges regardless of order', () => {
    const result = run(
      { from: '11:00', to: '14:00' },
      { from: '08:00', to: '12:00' }
    );
    expect(result.getErrors(ROOT_FORM)).toContain(OVERLAP);
  });

  it('reports a range nested inside another', () => {
    const result = run(
      { from: '08:00', to: '18:00' },
      { from: '10:00', to: '11:00' },
      { from: '19:00', to: '20:00' }
    );
    expect(result.getErrors(ROOT_FORM)).toContain(OVERLAP);
  });

  it('leaves a malformed time to the field test instead of reporting overlap', () => {
    const result = run(
      { from: '08:00', to: '10:00' },
      { from: '25:00', to: '12:00' }
    );
    expect(result.getErrors(ROOT_FORM)).not.toContain(OVERLAP);
    expect(result.getErrors('businessHours.values.1.from')).toContain(
      'Should be a valid time'
    );
  });
});
