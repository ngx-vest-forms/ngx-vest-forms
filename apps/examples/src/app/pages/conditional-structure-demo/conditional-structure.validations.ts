import type { NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test } from 'vest';
import { ConditionalStructureModel } from '../../models/conditional-structure.model';

export const conditionalStructureSuite: NgxVestSuite<ConditionalStructureModel> =
  create((model: ConditionalStructureModel) => {
    test('contactName', 'Contact name is required', () => {
      enforce(model.contactName).isNotBlank();
    });

    test('deliveryMode', 'Delivery method is required', () => {
      enforce(model.deliveryMode).isNotBlank();
    });

    omitWhen(model.deliveryMode !== 'shipment', () => {
      test('shippingAddress', 'Shipping address is required', () => {
        enforce(model.shippingAddress).isNotBlank();
      });
    });

    omitWhen(model.deliveryMode !== 'digital', () => {
      test('deliveryEmail', 'Delivery email is required', () => {
        enforce(model.deliveryEmail).isNotBlank();
      });

      omitWhen(!model.deliveryEmail, () => {
        test('deliveryEmail', 'Enter a valid delivery email', () => {
          enforce(model.deliveryEmail ?? '').matches(
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          );
        });
      });
    });
  });
