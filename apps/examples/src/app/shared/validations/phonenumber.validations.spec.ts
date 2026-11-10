import { create } from 'vest';
import type { PhoneNumberModel } from '../models/phonenumber.model';
import { phonenumberValidations } from './phonenumber.validations';

const createSuite = () =>
  create((model: PhoneNumberModel) => {
    phonenumberValidations(model, 'phonenumbers');
  });

describe('phonenumberValidations', () => {
  it('reports a blank row and the empty list', () => {
    const suite = createSuite();

    suite.run({ values: { '0': '', '1': '555' } });
    expect(suite.get().getErrors('phonenumbers.values.0')).toEqual([
      'Should be a valid phonenumber',
    ]);
    expect(suite.get().hasErrors('phonenumbers.values.1')).toBe(false);

    suite.reset();
    suite.run({ values: {} });
    expect(suite.get().getErrors('phonenumbers')).toEqual([
      'You should have at least one phonenumber',
    ]);
  });

  it('keeps reporting a row that stays blank when a focused run skips it', () => {
    const suite = createSuite();

    suite.run({ values: { '0': '', '1': '555' } });
    suite.only('phonenumbers').run({ values: { '0': '', '1': '555' } });

    expect(suite.get().hasErrors('phonenumbers.values.0')).toBe(true);
  });
});
