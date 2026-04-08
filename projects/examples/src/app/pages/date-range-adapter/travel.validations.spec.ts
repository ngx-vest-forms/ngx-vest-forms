import { describe, expect, it } from 'vitest';
import { travelValidationSuite } from './travel.validations';

describe('Travel Validations', () => {
  it('should require departureDate', () => {
    const result = travelValidationSuite({}, 'departureDate');
    expect(result.hasErrors('departureDate')).toBe(true);
    expect(result.getErrors('departureDate')).toContain(
      'Departure date is required'
    );
  });

  it('should require returnDate', () => {
    const result = travelValidationSuite({}, 'returnDate');
    expect(result.hasErrors('returnDate')).toBe(true);
    expect(result.getErrors('returnDate')).toContain(
      'Return date is required'
    );
  });

  it('should pass when both dates are valid and in correct order', () => {
    const result = travelValidationSuite(
      { departureDate: '2026-06-01', returnDate: '2026-06-10' },
      'returnDate'
    );
    expect(result.hasErrors('returnDate')).toBe(false);
  });

  it('should fail when returnDate is before departureDate', () => {
    const result = travelValidationSuite(
      { departureDate: '2026-06-10', returnDate: '2026-06-01' },
      'returnDate'
    );
    expect(result.hasErrors('returnDate')).toBe(true);
    expect(result.getErrors('returnDate')).toContain(
      'Return date must be after departure date'
    );
  });

  it('should fail when returnDate equals departureDate', () => {
    const result = travelValidationSuite(
      { departureDate: '2026-06-10', returnDate: '2026-06-10' },
      'returnDate'
    );
    expect(result.hasErrors('returnDate')).toBe(true);
    expect(result.getErrors('returnDate')).toContain(
      'Return date must be after departure date'
    );
  });

  it('should skip cross-field check when departureDate is missing', () => {
    const result = travelValidationSuite(
      { returnDate: '2026-06-10' },
      'returnDate'
    );
    // Only required check runs, cross-field is omitted
    expect(result.hasErrors('returnDate')).toBe(false);
  });

  it('should pass departureDate when valid', () => {
    const result = travelValidationSuite(
      { departureDate: '2026-06-01' },
      'departureDate'
    );
    expect(result.hasErrors('departureDate')).toBe(false);
  });

  it('should warn when dates are less than 3 days apart', () => {
    const result = travelValidationSuite(
      { departureDate: '2026-06-01', returnDate: '2026-06-02' },
      'returnDate'
    );
    expect(result.hasErrors('returnDate')).toBe(false);
    expect(result.hasWarnings('returnDate')).toBe(true);
    expect(result.getWarnings('returnDate')).toContain(
      'Consider allowing at least 3 days between dates'
    );
  });

  it('should not warn when dates are 3 or more days apart', () => {
    const result = travelValidationSuite(
      { departureDate: '2026-06-01', returnDate: '2026-06-04' },
      'returnDate'
    );
    expect(result.hasErrors('returnDate')).toBe(false);
    expect(result.hasWarnings('returnDate')).toBe(false);
  });
});
