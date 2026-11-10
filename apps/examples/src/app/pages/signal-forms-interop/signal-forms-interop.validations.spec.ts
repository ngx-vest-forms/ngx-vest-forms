import { beforeEach, describe, expect, it } from 'vitest';
import { SEAT_LIMITS } from '../../models/signal-forms-interop.model';
import { signalFormsInteropSuite } from './signal-forms-interop.validations';

describe('Signal Forms Interop Validations', () => {
  beforeEach(() => {
    signalFormsInteropSuite.reset();
  });

  it('accepts a seat count in range with the terms accepted', () => {
    const result = signalFormsInteropSuite.run({
      seats: 2,
      acceptTerms: true,
    });

    expect(result.isValid()).toBe(true);
  });

  describe('seats', () => {
    it('requires a seat count', () => {
      const result = signalFormsInteropSuite.run({ acceptTerms: true });

      expect(result.getErrors('seats')).toEqual([
        'Choose how many seats you need',
      ]);
    });

    it.each([SEAT_LIMITS.min, SEAT_LIMITS.max])(
      'accepts the boundary of %i seats',
      (seats) => {
        const result = signalFormsInteropSuite.run({
          seats,
          acceptTerms: true,
        });

        expect(result.hasErrors('seats')).toBe(false);
      }
    );

    it.each([SEAT_LIMITS.min - 1, SEAT_LIMITS.max + 1])(
      'rejects %i seats as out of range',
      (seats) => {
        const result = signalFormsInteropSuite.run({
          seats,
          acceptTerms: true,
        });

        expect(result.getErrors('seats')).toEqual([
          `Book between ${SEAT_LIMITS.min} and ${SEAT_LIMITS.max} seats`,
        ]);
      }
    );

    it('is not validated while the stepper is locked', () => {
      const missing = signalFormsInteropSuite.run({
        lockSeats: true,
        acceptTerms: true,
      });
      expect(missing.hasErrors('seats')).toBe(false);

      signalFormsInteropSuite.reset();
      const outOfRange = signalFormsInteropSuite.run({
        lockSeats: true,
        seats: 99,
        acceptTerms: true,
      });
      expect(outOfRange.hasErrors('seats')).toBe(false);
      expect(outOfRange.isValid()).toBe(true);
    });
  });

  describe('acceptTerms', () => {
    it.each([undefined, false])(
      'is required when the value is %s',
      (accept) => {
        const result = signalFormsInteropSuite.run({
          seats: 2,
          acceptTerms: accept,
        });

        expect(result.getErrors('acceptTerms')).toContain(
          'Accept the booking terms to continue'
        );
      }
    );

    it('is still required while the stepper is locked', () => {
      const result = signalFormsInteropSuite.run({
        lockSeats: true,
        seats: 2,
      });

      expect(result.getErrors('acceptTerms')).toContain(
        'Accept the booking terms to continue'
      );
    });
  });

  it('leaves other fields untested in a focused run', () => {
    const result = signalFormsInteropSuite.only('acceptTerms').run({});

    expect(result.getErrors('acceptTerms')).toContain(
      'Accept the booking terms to continue'
    );
    expect(result.isTested('seats')).toBe(false);
  });
});
