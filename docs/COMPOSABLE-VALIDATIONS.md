# Composable validations

Break large Vest 6 suites into small, reusable validation functions that you can share across forms, test in isolation, and run on both client and server.

All examples below use Vest 6 model-only callbacks (`create((model) => { ... })`). If you are upgrading from Vest 5 (`only(field)` inside the callback), see [MIGRATION-v2.x-to-v3.0.0.md](./migration/MIGRATION-v2.x-to-v3.0.0.md).

## Writing a reusable validation helper

Accept the slice of the model (which may be `undefined`) and its dotted field path prefix:

```ts
import { enforce, test } from 'vest';
import type { AddressModel } from '../models/address.model';

export function addressValidations(
  model: AddressModel | undefined,
  fieldPrefix: string
): void {
  test(`${fieldPrefix}.street`, 'Street is required', () => {
    enforce(model?.street).isNotBlank();
  });
  test(`${fieldPrefix}.city`, 'City is required', () => {
    enforce(model?.city).isNotBlank();
  });
  test(`${fieldPrefix}.zipcode`, 'Zipcode is required', () => {
    enforce(model?.zipcode).isNotBlank();
  });
  test(`${fieldPrefix}.number`, 'Number is required', () => {
    enforce(model?.number).isNotBlank();
  });
  test(`${fieldPrefix}.country`, 'Country is required', () => {
    enforce(model?.country).isNotBlank();
  });
}
```

Call the helper from a parent suite for each section:

```ts
import type { NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test } from 'vest';
import { addressValidations } from './address.validations';

type PurchaseFormModel = NgxDeepPartial<{
  addresses: {
    billingAddress: AddressModel;
    shippingAddress: AddressModel;
    shippingAddressDifferentFromBillingAddress: boolean;
  };
}>;

export const purchaseSuite: NgxVestSuite<PurchaseFormModel> = create(
  (model) => {
    addressValidations(
      model.addresses?.billingAddress,
      'addresses.billingAddress'
    );

    omitWhen(
      !model.addresses?.shippingAddressDifferentFromBillingAddress,
      () => {
        addressValidations(
          model.addresses?.shippingAddress,
          'addresses.shippingAddress'
        );

        test('addresses', 'Billing and shipping addresses must differ', () => {
          enforce(JSON.stringify(model.addresses?.billingAddress)).notEquals(
            JSON.stringify(model.addresses?.shippingAddress)
          );
        });
      }
    );
  }
);
```

Pair conditional `omitWhen` blocks with `[validationConfig]` so dependent fields re-run when the controlling toggle changes. See [ValidationConfig builder](./VALIDATION-CONFIG-BUILDER.md).

## Nesting and async helpers

Helpers can compose other helpers and include async tests with Vest's `AbortSignal`:

```ts
import { enforce, skipWhen, test } from 'vest';

export function emailValidations(
  email: string | undefined,
  field: string,
  checkAvailability = true
): void {
  test(field, 'Email is required', () => {
    enforce(email).isNotBlank();
  });

  test(field, 'Invalid email format', () => {
    enforce(email ?? '').matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  if (checkAvailability) {
    skipWhen((res) => res.hasErrors(field), () => {
      test(field, 'Email is already taken', async ({ signal }) => {
        await checkEmailAvailability(email, { signal });
      });
    });
  }
}
```

## Memoizing expensive checks

Wrap deterministic expensive or remote checks in `memo()` from `vest/memo` so repeated runs with the same dependency value reuse the previous result while still honoring `{ signal }` cancellation:

```ts
import { create, enforce, skipWhen, test } from 'vest';
import { memo } from 'vest/memo';

export function userIdAvailabilityValidations(
  userId: string | undefined,
  field: 'userId'
): void {
  const normalizedUserId = userId?.trim();

  test(field, 'User ID is required', () => {
    enforce(normalizedUserId).isNotBlank();
  });

  skipWhen((res) => res.hasErrors(field) || !normalizedUserId, () => {
    memo(() => {
      test(field, 'User ID is already taken', async ({ signal }) => {
        const response = await fetch(
          `/api/users/${encodeURIComponent(normalizedUserId!)}`,
          { signal }
        );
        const { exists } = await response.json();
        enforce(exists).isFalsy();
      });
    }, [normalizedUserId]);
  });
}

export const profileSuite = create((model: ProfileModel) => {
  userIdAvailabilityValidations(model.userId, 'userId');
});
```

Use `memo()` selectively for expensive checks, not around every rule.

## Testing composable helpers in isolation

Wrap the helper in a local `create()` call inside your unit test (no Angular `TestBed` needed):

```ts
import { create } from 'vest';
import { addressValidations } from './address.validations';

describe('addressValidations', () => {
  it('requires street', () => {
    const suite = create((model: AddressModel) => {
      addressValidations(model, 'address');
    });

    const result = suite.run({ street: '' });
    expect(result.hasErrors('address.street')).toBe(true);
  });

  it('passes with a complete address', () => {
    const suite = create((model: AddressModel) => {
      addressValidations(model, 'address');
    });

    const result = suite.run({
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

## Scoping multi-step suites with `validationFocus`

When a single suite covers multiple steps using Vest's `group()` blocks, pass `[validationFocus]` to `<form ngxVestForm>` so field validation only runs rules in the active group:

```ts
type NgxValidationFocus = {
  only?: string;
  skip?: string;
  onlyGroup?: string | readonly string[];
  skipGroup?: string | readonly string[];
};
```

ngx-vest-forms merges `validationFocus` with each field's focused run (the field's own `only` path is always preserved). Group names in `onlyGroup` and `skipGroup` must match names passed to Vest's `group(...)`:

```ts
import { create, enforce, group, test } from 'vest';

export const wizardSuite = create((model: WizardModel) => {
  group('account', () => {
    test('email', 'Email is required', () => enforce(model.email).isNotBlank());
  });

  group('profile', () => {
    test('firstName', 'First name is required', () =>
      enforce(model.firstName).isNotBlank()
    );
  });

  group('review', () => {
    test('acceptTerms', 'You must accept the terms', () =>
      enforce(model.acceptTerms).equals(true)
    );
  });
});
```

```html
<form
  ngxVestForm
  [suite]="suite"
  [formValue]="formValue()"
  [validationFocus]="{ onlyGroup: currentGroup() }"
  (formValueChange)="formValue.set($event)"
>
  <!-- controls for the active step -->
</form>
```

Changing `[validationFocus]` does not automatically re-run field validators. Call `triggerFormValidation()` (or `triggerFormValidation(groupPath)`) after switching focus so mounted controls revalidate under the new scope.

> **Multi-step wizard caveat:** In a single `<form ngxVestForm>`, `ngSubmit` marks every mounted control touched and Vest keeps results for fields outside the focused group. Using `validationFocus` to gate step-by-step submits requires manually managing untouched state and clearing errors for other steps. For multi-step wizards today, give each step its own `<form ngxVestForm>` and per-step suite, as in `apps/examples/src/app/pages/wizard-form`.

## Practical guidelines

- Put one domain concept per file (for example `address.validations.ts`, `contact.validations.ts`).
- Accept `undefined` slices and read properties with optional chaining (`model?.street`).
- Pass the dotted `fieldPrefix` so the same helper validates `billingAddress` and `shippingAddress`.
- Keep field focus at the run site (`suite.only(field).run(model)`), never inside a helper.
