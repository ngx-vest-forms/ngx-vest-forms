import { beforeEach, describe, expect, it } from 'vitest';
import { conditionalStructureSuite } from './conditional-structure.validations';

describe('Conditional Structure Validations', () => {
  beforeEach(() => {
    conditionalStructureSuite.reset();
  });

  it('requires a contact name and a delivery method', () => {
    const result = conditionalStructureSuite.run({});

    expect(result.getErrors('contactName')).toContain(
      'Contact name is required'
    );
    expect(result.getErrors('deliveryMode')).toContain(
      'Delivery method is required'
    );
  });

  it('accepts pickup with just a contact name', () => {
    const result = conditionalStructureSuite.run({
      contactName: 'Ada',
      deliveryMode: 'pickup',
    });

    expect(result.isValid()).toBe(true);
  });

  describe('shipment', () => {
    it('requires a shipping address', () => {
      const result = conditionalStructureSuite.run({
        contactName: 'Ada',
        deliveryMode: 'shipment',
      });

      expect(result.getErrors('shippingAddress')).toContain(
        'Shipping address is required'
      );
    });

    it('does not ask for a delivery email', () => {
      const result = conditionalStructureSuite.run({
        contactName: 'Ada',
        deliveryMode: 'shipment',
        shippingAddress: '1 Main St',
      });

      expect(result.hasErrors('deliveryEmail')).toBe(false);
      expect(result.isValid()).toBe(true);
    });
  });

  describe('digital', () => {
    it('requires a delivery email', () => {
      const result = conditionalStructureSuite.run({
        contactName: 'Ada',
        deliveryMode: 'digital',
      });

      expect(result.getErrors('deliveryEmail')).toEqual([
        'Delivery email is required',
      ]);
    });

    it('rejects a malformed delivery email', () => {
      const result = conditionalStructureSuite.run({
        contactName: 'Ada',
        deliveryMode: 'digital',
        deliveryEmail: 'nope',
      });

      expect(result.getErrors('deliveryEmail')).toContain(
        'Enter a valid delivery email'
      );
    });

    it('accepts a valid delivery email and ignores the shipping address', () => {
      const result = conditionalStructureSuite.run({
        contactName: 'Ada',
        deliveryMode: 'digital',
        deliveryEmail: 'ada@example.com',
      });

      expect(result.hasErrors('shippingAddress')).toBe(false);
      expect(result.isValid()).toBe(true);
    });
  });

  it('stops validating a branch after the user switches away from it', () => {
    const digital = conditionalStructureSuite.run({
      contactName: 'Ada',
      deliveryMode: 'digital',
    });
    expect(digital.hasErrors('deliveryEmail')).toBe(true);

    const pickup = conditionalStructureSuite.run({
      contactName: 'Ada',
      deliveryMode: 'pickup',
    });
    expect(pickup.hasErrors('deliveryEmail')).toBe(false);
    expect(pickup.isValid()).toBe(true);
  });

  it('leaves other fields untested in a focused run', () => {
    const result = conditionalStructureSuite
      .only('shippingAddress')
      .run({ deliveryMode: 'shipment' });

    expect(result.getErrors('shippingAddress')).toContain(
      'Shipping address is required'
    );
    expect(result.isTested('contactName')).toBe(false);
  });
});
