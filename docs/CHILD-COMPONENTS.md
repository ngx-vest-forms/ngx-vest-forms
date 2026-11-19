# Child form components

Split large forms into reusable child components while keeping all controls registered with the parent `<form ngxVestForm>`.

## Registering child controls with `vestFormsViewProviders`

Without a `ControlContainer` view provider, Angular does not register controls inside a child component with the parent `NgForm`, so parent validity and `formValueChange` miss those controls. Add `viewProviders: [vestFormsViewProviders]` to every child component that renders `ngModel` or `ngModelGroup`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  NgxVestForms,
  vestFormsViewProviders,
  type NgxDeepPartial,
} from 'ngx-vest-forms';

export type AddressModel = NgxDeepPartial<{
  street: string;
  city: string;
  zipcode: string;
  country: string;
}>;

@Component({
  selector: 'app-address-form',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-form-group-wrapper [ngModelGroup]="groupName()">
      <ngx-control-wrapper>
        <label [for]="groupName() + '-street'">Street</label>
        <input
          [id]="groupName() + '-street'"
          name="street"
          type="text"
          [ngModel]="address()?.street"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label [for]="groupName() + '-city'">City</label>
        <input
          [id]="groupName() + '-city'"
          name="city"
          type="text"
          [ngModel]="address()?.city"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label [for]="groupName() + '-zipcode'">Zipcode</label>
        <input
          [id]="groupName() + '-zipcode'"
          name="zipcode"
          type="text"
          [ngModel]="address()?.zipcode"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label [for]="groupName() + '-country'">Country</label>
        <input
          [id]="groupName() + '-country'"
          name="country"
          type="text"
          [ngModel]="address()?.country"
        />
      </ngx-control-wrapper>
    </ngx-form-group-wrapper>
  `,
})
export class AddressFormComponent {
  // Matches the property key in the parent model (for example "billingAddress")
  // and keeps input IDs unique when multiple instances appear on the same page.
  readonly groupName = input.required<string>();
  readonly address = input<AddressModel>();
}
```

Placing `[ngModelGroup]` directly on `<ngx-form-group-wrapper>` renders group-level errors and avoids an extra wrapper `<div>`. `<ngx-form-group-wrapper>` does not stamp ARIA attributes onto descendant controls, so each child `<ngx-control-wrapper>` manages its own field.

## Using child components in a parent form

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NgxVestForms,
  type NgxDeepPartial,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';
import { AddressFormComponent, type AddressModel } from './address-form';
import { addressValidations } from './address.validations';

type OrderFormModel = NgxDeepPartial<{
  customerName: string;
  billingAddress: AddressModel;
  shippingAddress: AddressModel;
}>;

const orderSuite: NgxVestSuite<OrderFormModel> = create((model) => {
  test('customerName', 'Customer name is required', () => {
    enforce(model.customerName).isNotBlank();
  });

  addressValidations(model.billingAddress, 'billingAddress');
  addressValidations(model.shippingAddress, 'shippingAddress');
});

@Component({
  selector: 'app-order-form',
  imports: [NgxVestForms, AddressFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <ngx-control-wrapper>
        <label for="customerName">Customer name</label>
        <input
          id="customerName"
          name="customerName"
          [ngModel]="formValue().customerName"
        />
      </ngx-control-wrapper>

      <h3>Billing address</h3>
      <app-address-form
        groupName="billingAddress"
        [address]="formValue().billingAddress"
      />

      <h3>Shipping address</h3>
      <app-address-form
        groupName="shippingAddress"
        [address]="formValue().shippingAddress"
      />

      <button type="submit">Submit order</button>
    </form>
  `,
})
export class OrderFormComponent {
  protected readonly formValue = signal<OrderFormModel>({});
  protected readonly suite = orderSuite;
}
```

## Nested child components

Every level in the component tree that renders form controls must include `viewProviders: [vestFormsViewProviders]`:

```ts
@Component({
  selector: 'app-phone-input',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-control-wrapper>
      <label [for]="fieldName()">{{ label() }}</label>
      <input
        [id]="fieldName()"
        [name]="fieldName()"
        type="tel"
        [ngModel]="value()"
      />
    </ngx-control-wrapper>
  `,
})
export class PhoneInputComponent {
  readonly fieldName = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input<string>();
}

@Component({
  selector: 'app-contact-form',
  imports: [NgxVestForms, PhoneInputComponent],
  viewProviders: [vestFormsViewProviders],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div ngModelGroup="contact">
      <app-phone-input
        fieldName="homePhone"
        label="Home phone"
        [value]="contact()?.homePhone"
      />
      <app-phone-input
        fieldName="mobilePhone"
        label="Mobile phone"
        [value]="contact()?.mobilePhone"
      />
    </div>
  `,
})
export class ContactFormComponent {
  readonly contact = input<ContactModel>();
}
```

## Conditional child components and multi-step forms

When `@if` hides a child component, clear its hidden slice inside `(formValueChange)` and call `vestForm().removeField(path)` for any removed fields so Vest 6's stateful suite does not retain stale errors or warnings for unmounted controls:

```ts
@Component({
  selector: 'app-checkout-form',
  imports: [NgxVestForms, AddressFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="handleFormChange($event)"
    >
      <label>
        <input
          type="checkbox"
          name="includeShipping"
          [ngModel]="formValue().includeShipping"
        />
        Different shipping address
      </label>

      <app-address-form
        groupName="billingAddress"
        [address]="formValue().billingAddress"
      />

      @if (formValue().includeShipping) {
        <app-address-form
          groupName="shippingAddress"
          [address]="formValue().shippingAddress"
        />
      }
    </form>
  `,
})
export class CheckoutFormComponent {
  protected readonly formValue = signal<CheckoutFormModel>({});
  protected readonly suite = checkoutSuite;
  private readonly vestForm = viewChild(FormDirective<CheckoutFormModel>);

  protected handleFormChange(value: CheckoutFormModel): void {
    const next = clearFieldsWhen(value, {
      shippingAddress: !value.includeShipping,
    });
    if (!value.includeShipping) {
      for (const key of ['street', 'city', 'zipcode', 'country']) {
        this.vestForm()?.removeField(`shippingAddress.${key}`);
      }
    }
    this.formValue.set(next);
  }
}
```

For multi-step forms that share one parent `<form ngxVestForm>` and one suite partitioned with Vest `group()` blocks, combine conditional step components with `[validationFocus]="{ onlyGroup: currentGroup() }"`. See [Composable validations](./COMPOSABLE-VALIDATIONS.md#scoping-multi-step-suites-with-validationfocus) and [Field clearing utilities](./FIELD-CLEARING-UTILITIES.md).

## Standalone helper inputs inside child components

If a child component needs an auxiliary input (such as a filter box or an "add item" draft input) that should not register with the parent form, mark it standalone:

```html
<div [ngModelGroup]="groupName()">
  <!-- Registered in the parent form -->
  <input name="primary" [ngModel]="phones()?.primary" />

  <!-- Local UI helper: excluded from parent form value and validation -->
  <input
    [ngModel]="draftPhone()"
    [ngModelOptions]="{ standalone: true }"
    (ngModelChange)="draftPhone.set($event)"
    placeholder="Add another phone"
  />
</div>
```

## Troubleshooting

- **Controls missing from `formValue` or parent validity stays `VALID`:** Add `viewProviders: [vestFormsViewProviders]` to the child component (and any intermediate wrapper components between it and `<form ngxVestForm>`).
- **Child controls do not validate:** Verify that the Vest `test()` field paths include every enclosing `ngModelGroup` name (for example `billingAddress.street`, not `street`).
