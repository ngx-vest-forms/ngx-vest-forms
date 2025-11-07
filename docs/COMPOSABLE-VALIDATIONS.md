# Composable Validations

Compose validation suites with reusable sub-functions to keep your validation logic maintainable, testable, and DRY (Don't Repeat Yourself).

## Why Composable Validations?

- **Reusability** - Share validation logic across different forms
- **Maintainability** - Keep suites small and focused
- **Testability** - Test validation functions in isolation
- **Cross-framework** - Use the same validation logic on frontend and backend
- **Readability** - Clear, self-documenting validation structure

## Basic Composable Function

Create reusable validation functions that can be called from any suite:

```typescript
export function addressValidations(
  model: AddressModel | undefined,
  field: string
): void {
  test(`${field}.street`, 'Street is required', () => {
    enforce(model?.street).isNotBlank();
  });
  test(`${field}.city`, 'City is required', () => {
    enforce(model?.city).isNotBlank();
  });
  test(`${field}.zipcode`, 'Zipcode is required', () => {
    enforce(model?.zipcode).isNotBlank();
  });
  test(`${field}.number`, 'Number is required', () => {
    enforce(model?.number).isNotBlank();
  });
  test(`${field}.country`, 'Country is required', () => {
    enforce(model?.country).isNotBlank();
  });
}
```

## Using Composable Validations in Suites

Call your reusable functions from the main suite:

```typescript
import { enforce, only, staticSuite } from 'vest';
import { NgxVestSuite, NgxDeepPartial } from 'ngx-vest-forms';
import { addressValidations } from './address.validations';

type PurchaseFormModel = NgxDeepPartial<{
  addresses: {
    billingAddress: AddressModel;
    shippingAddress: AddressModel;
  };
}>;

export const purchaseSuite: NgxVestSuite<PurchaseFormModel> = staticSuite(
  (model, field?) => {
    only(field);

    addressValidations(
      model.addresses?.billingAddress,
      'addresses.billingAddress'
    );
    addressValidations(
      model.addresses?.shippingAddress,
      'addresses.shippingAddress'
    );
  }
);
```

## Combining Conditional and Composable Patterns

Use `omitWhen` with composable validations for conditional logic:

```typescript
import { enforce, omitWhen, only, staticSuite, test } from 'vest';

export const purchaseSuite: NgxVestSuite<PurchaseFormModel> = staticSuite(
  (model, field?) => {
    only(field);

    // Always validate billing address
    addressValidations(
      model.addresses?.billingAddress,
      'addresses.billingAddress'
    );

    // Only validate shipping address when checkbox is checked
    omitWhen(
      !model.addresses?.shippingAddressDifferentFromBillingAddress,
      () => {
        addressValidations(
          model.addresses?.shippingAddress,
          'addresses.shippingAddress'
        );

        // Ensure addresses are different
        test('addresses', 'The addresses appear to be the same', () => {
          enforce(JSON.stringify(model.addresses?.billingAddress)).notEquals(
            JSON.stringify(model.addresses?.shippingAddress)
          );
        });
      }
    );
  }
);
```

This gives you validation on:

- ✅ The addresses form field (they can't be equal)
- ✅ The shipping address field (only required when checkbox is checked)
- ✅ All the address fields (street, number, etc) on both addresses

## Organizing Validation Files

Structure your validations by domain or entity:

```
src/
  validations/
    address.validations.ts      # Address-specific validations
    contact.validations.ts      # Contact-specific validations
    payment.validations.ts      # Payment-specific validations
    purchase-form.suite.ts      # Main suite that composes them
```

### Example: contact.validations.ts

```typescript
import { test, enforce } from 'vest';
import { ContactModel } from '../models/contact.model';

export function contactValidations(
  model: ContactModel | undefined,
  field: string
): void {
  test(`${field}.email`, 'Email is required', () => {
    enforce(model?.email).isNotBlank();
  });

  test(`${field}.email`, 'Email format is invalid', () => {
    enforce(model?.email).isEmail();
  });

  test(`${field}.phone`, 'Phone is required', () => {
    enforce(model?.phone).isNotBlank();
  });

  test(`${field}.phone`, 'Phone must be 10 digits', () => {
    enforce(model?.phone).matches(/^\d{10}$/);
  });
}
```

### Example: Main suite composing multiple validations

```typescript
import { staticSuite, only } from 'vest';
import { NgxVestSuite, NgxDeepPartial } from 'ngx-vest-forms';
import { addressValidations } from './address.validations';
import { contactValidations } from './contact.validations';
import { paymentValidations } from './payment.validations';

type OrderFormModel = NgxDeepPartial<{
  contact: ContactModel;
  billing: AddressModel;
  shipping: AddressModel;
  payment: PaymentModel;
}>;

export const orderSuite: NgxVestSuite<OrderFormModel> = staticSuite(
  (model, field?) => {
    only(field);

    contactValidations(model.contact, 'contact');
    addressValidations(model.billing, 'billing');
    addressValidations(model.shipping, 'shipping');
    paymentValidations(model.payment, 'payment');
  }
);
```

## Advanced Pattern: Nested Composable Validations

Composable functions can call other composable functions:

```typescript
// Base validation
export function phoneNumberValidation(
  phone: string | undefined,
  field: string
): void {
  test(field, 'Phone is required', () => {
    enforce(phone).isNotBlank();
  });

  test(field, 'Invalid phone format', () => {
    enforce(phone).matches(/^\d{10}$/);
  });
}

// Composite validation that uses the base
export function businessContactValidations(
  model: BusinessContactModel | undefined,
  field: string
): void {
  test(`${field}.companyName`, 'Company name is required', () => {
    enforce(model?.companyName).isNotBlank();
  });

  // Reuse phone validation
  phoneNumberValidation(model?.officePhone, `${field}.officePhone`);
  phoneNumberValidation(model?.mobilePhone, `${field}.mobilePhone`);
}
```

## Async Composable Validations

Composable functions work seamlessly with async validations:

```typescript
export function emailValidations(
  email: string | undefined,
  field: string,
  checkAvailability = true
): void {
  test(field, 'Email is required', () => {
    enforce(email).isNotBlank();
  });

  test(field, 'Invalid email format', () => {
    enforce(email).isEmail();
  });

  if (checkAvailability) {
    skipWhen(
      (res) => res.hasErrors(field),
      () => {
        test(field, 'Email is already taken', async ({ signal }) => {
          await checkEmailAvailability(email, { signal });
        });
      }
    );
  }
}
```

## Testing Composable Validations

Test your validation functions in isolation:

```typescript
import { create, test, enforce } from 'vest';
import { addressValidations } from './address.validations';

describe('addressValidations', () => {
  it('should require street', () => {
    const suite = create((model: AddressModel) => {
      addressValidations(model, 'address');
    });

    const result = suite({ street: '' });
    expect(result.hasErrors('address.street')).toBe(true);
  });

  it('should pass with complete address', () => {
    const suite = create((model: AddressModel) => {
      addressValidations(model, 'address');
    });

    const result = suite({
      street: '123 Main St',
      city: 'New York',
      zipcode: '10001',
      number: '456',
      country: 'USA',
    });

    expect(result.isValid()).toBe(true);
  });
});
```

## Benefits Summary

| Benefit             | Description                                        |
| ------------------- | -------------------------------------------------- |
| **Code Reuse**      | Write once, use in multiple forms                  |
| **Maintainability** | Update validation logic in one place               |
| **Testing**         | Test validation functions independently            |
| **Readability**     | Clear, self-documenting structure                  |
| **Scalability**     | Easily add new validations without bloating suites |
| **Cross-framework** | Use same logic on frontend/backend, Angular/React  |

## Best Practices

1. **One entity per file** - Keep validation functions focused on a single domain concept
2. **Accept undefined** - Always handle `undefined` models gracefully with optional chaining
3. **Use field parameter** - Pass the field prefix for nested validations
4. **Document parameters** - Make it clear what each validation function expects
5. **Export for testing** - Make composable functions easy to test independently
6. **Consistent naming** - Use `*Validations` suffix for composable functions
