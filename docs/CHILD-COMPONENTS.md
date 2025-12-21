# Child Form Components

Split large forms into smaller, reusable child components while maintaining access to the parent form's validation context.

## Why Use Child Components?

- **Modularity** - Break large forms into manageable pieces
- **Reusability** - Use the same component in multiple forms
- **Maintainability** - Easier to test and update individual sections
- **Organization** - Clear separation of concerns

## The Key: `vestFormsViewProviders`

For child components to access the parent form's `NgForm`, they must include `vestFormsViewProviders` in their `viewProviders`:

```typescript
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import {
  NgxVestForms,
  vestFormsViewProviders,
  NgxDeepPartial,
} from 'ngx-vest-forms';

type AddressModel = NgxDeepPartial<{
  street: string;
  city: string;
  zipcode: string;
  country: string;
}>;

@Component({
  selector: 'ngx-address-form',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders], // CRITICAL: Required for child components
  template: `
    <div [ngModelGroup]="groupName()">
      <label [for]="groupName() + '-street'">Street</label>
      <input
        [id]="groupName() + '-street'"
        name="street"
        type="text"
        [ngModel]="address()?.street"
      />

      <label [for]="groupName() + '-city'">City</label>
      <input
        [id]="groupName() + '-city'"
        name="city"
        type="text"
        [ngModel]="address()?.city"
      />

      <label [for]="groupName() + '-zipcode'">Zipcode</label>
      <input
        [id]="groupName() + '-zipcode'"
        name="zipcode"
        type="text"
        [ngModel]="address()?.zipcode"
      />

      <label [for]="groupName() + '-country'">Country</label>
      <input
        [id]="groupName() + '-country'"
        name="country"
        type="text"
        [ngModel]="address()?.country"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressFormComponent {
  /**
   * Name of the `ngModelGroup`.
   *
   * This must match the property path in the parent form model (e.g. "billingAddress").
   *
   * It is also used to keep input IDs unique when multiple address components are rendered
   * on the same page (e.g. billing + shipping).
   */
  readonly groupName = input.required<string>();
  readonly address = input<AddressModel>();
}
```

## Using Child Components in Parent Form

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgxVestForms, NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only } from 'vest';
import { AddressFormComponent } from './address-form.component';

type OrderFormModel = NgxDeepPartial<{
  customerName: string;
  billingAddress: AddressModel;
  shippingAddress: AddressModel;
}>;

@Component({
  selector: 'ngx-order-form',
  imports: [NgxVestForms, AddressFormComponent],
  template: `
    <form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <label>Customer Name</label>
      <input name="customerName" [ngModel]="formValue().customerName" />

      <h3>Billing Address</h3>
      <ngx-address-form
        groupName="billingAddress"
        [address]="formValue().billingAddress"
      />

      <h3>Shipping Address</h3>
      <ngx-address-form
        groupName="shippingAddress"
        [address]="formValue().shippingAddress"
      />

      <button type="submit">Submit Order</button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderFormComponent {
  protected readonly formValue = signal<OrderFormModel>({});
  protected readonly suite = orderSuite;
}
```

## Dynamic Field Names with Inputs

Pass the field name as an input when you need different `ngModelGroup` names:

```typescript
@Component({
  selector: 'ngx-address-form',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  template: `
    <div [ngModelGroup]="groupName()">
      <label [for]="groupName() + '-street'">Street</label>
      <input
        [id]="groupName() + '-street'"
        name="street"
        [ngModel]="address()?.street"
      />
      <!-- Other fields... -->
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressFormComponent {
  readonly groupName = input.required<string>();
  readonly address = input<AddressModel>();
}
```

Usage:

```typescript
<ngx-address-form
  groupName="billingAddress"
  [address]="formValue().billingAddress"
/>

<ngx-address-form
  groupName="shippingAddress"
  [address]="formValue().shippingAddress"
/>
```

## Child Components with Error Display

Child components can include their own error display using `ngx-control-wrapper` for individual fields:

```typescript
@Component({
  selector: 'ngx-contact-form',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  template: `
    <div ngModelGroup="contact">
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          [ngModel]="contact()?.email"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="phone">Phone</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          [ngModel]="contact()?.phone"
        />
      </ngx-control-wrapper>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactFormComponent {
  readonly contact = input<ContactModel>();
}
```

### Using `ngx-form-group-wrapper` (Recommended)

For group-level error display plus individual field wrappers, use `ngx-form-group-wrapper` with `ngModelGroup` directly on it:

```typescript
@Component({
  selector: 'ngx-address-form',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  template: `
    <!-- ngModelGroup directly on the wrapper (recommended) -->
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
    </ngx-form-group-wrapper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressFormComponent {
  readonly groupName = input.required<string>();
  readonly address = input<AddressModel>();
}
```

**Benefits of this pattern:**

- **Less DOM nesting** - No extra `<div>` needed for the `ngModelGroup`
- **Group-level errors** - `ngx-form-group-wrapper` can display errors for the entire group
- **Per-field errors** - Each `ngx-control-wrapper` handles its own field's errors
- **Accessible** - Group wrapper doesn't stamp ARIA attributes on descendant controls

````

## Nested Child Components

Child components can contain other child components - all need `vestFormsViewProviders`:

```typescript
// Grandchild component
@Component({
  selector: 'ngx-phone-input',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders], // Required
  template: `
    <div ngx-control-wrapper>
      <label [for]="fieldName()">{{ label() }}</label>
      <input
        [id]="fieldName()"
        [name]="fieldName()"
        type="tel"
        [ngModel]="value()"
      />
    </div>
  `,
})
export class PhoneInputComponent {
  readonly fieldName = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input<string>();
}

// Child component using grandchild
@Component({
  selector: 'ngx-contact-form',
  imports: [NgxVestForms, PhoneInputComponent],
  viewProviders: [vestFormsViewProviders], // Required
  template: `
    <div ngModelGroup="contact">
      <ngx-phone-input
        fieldName="homePhone"
        label="Home Phone"
        [value]="contact()?.homePhone"
      />
      <ngx-phone-input
        fieldName="mobilePhone"
        label="Mobile Phone"
        [value]="contact()?.mobilePhone"
      />
    </div>
  `,
})
export class ContactFormComponent {
  readonly contact = input<ContactModel>();
}
````

## Conditional Child Components

Child components work seamlessly with conditional rendering:

```typescript
@Component({
  template: `
    <form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <label>
        <input
          type="checkbox"
          name="includeShipping"
          [ngModel]="formValue().includeShipping"
        />
        Different shipping address
      </label>

      <ngx-address-form
        groupName="billingAddress"
        [address]="formValue().billingAddress"
      />

      @if (formValue().includeShipping) {
        <ngx-address-form
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
}
```

## Validation with Child Components

Validation suites can use composable validations for child component fields:

```typescript
import { staticSuite, only } from 'vest';
import { addressValidations } from './address.validations';

export const orderSuite: NgxVestSuite<OrderFormModel> = staticSuite(
  (model, field?) => {
    only(field);

    test('customerName', 'Customer name is required', () => {
      enforce(model.customerName).isNotBlank();
    });

    // Validate billing address fields
    addressValidations(model.billingAddress, 'billingAddress');

    // Validate shipping address fields
    addressValidations(model.shippingAddress, 'shippingAddress');
  }
);
```

## Common Patterns

### Pattern 1: Reusable Form Section

```typescript
// Reusable component
@Component({
  selector: 'ngx-name-section',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  template: `
    <div [ngModelGroup]="groupName()">
      <input name="firstName" [ngModel]="person()?.firstName" />
      <input name="lastName" [ngModel]="person()?.lastName" />
    </div>
  `,
})
export class NameSectionComponent {
  readonly groupName = input.required<string>();
  readonly person = input<PersonModel>();
}

// Used in multiple forms
<ngx-name-section groupName="primary" [person]="formValue().primary" />
<ngx-name-section groupName="spouse" [person]="formValue().spouse" />
```

### Pattern 2: Complex Multi-Step Form

```typescript
// Step components
@Component({ viewProviders: [vestFormsViewProviders], ... })
export class Step1Component { }

@Component({ viewProviders: [vestFormsViewProviders], ... })
export class Step2Component { }

// Parent
@Component({
  template: `
    <form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      @if (currentStep() === 1) {
        <ngx-step1 [data]="formValue().step1" />
      }
      @if (currentStep() === 2) {
        <ngx-step2 [data]="formValue().step2" />
      }
    </form>
  `,
})
export class MultiStepFormComponent {
  protected readonly currentStep = signal(1);
  protected readonly formValue = signal<FormModel>({});
}
```

## Troubleshooting

### Issue: "Cannot read property 'form' of undefined"

**Cause**: Missing `vestFormsViewProviders` in child component.

**Solution**: Add `viewProviders: [vestFormsViewProviders]` to the `@Component` decorator.

### Issue: Validation not working on child component fields

**Cause**: Field names in validation suite don't match the nested structure.

**Solution**: Ensure validation tests use the full path including the `ngModelGroup` name:

```typescript
// If component uses ngModelGroup="billingAddress"
test('billingAddress.street', 'Street is required', () => {
  enforce(model.billingAddress?.street).isNotBlank();
});
```

## Best Practices

1. **Always use `vestFormsViewProviders`** - Required for any component with `ngModel` or `ngModelGroup`
2. **Use signals for inputs** - Modern Angular pattern with `input()` function
3. **Match validation paths** - Ensure validation suite field names match the nested structure
4. **Keep components focused** - Each child component should represent a logical form section
5. **Document inputs** - Make it clear what data structure the component expects
6. **Use ChangeDetection.OnPush** - Better performance with signals
7. **Test independently** - Child components should be testable in isolation

## When to Use Child Components

Use child form components when you:

- ✅ Have repeated form sections (addresses, contacts, etc.)
- ✅ Want to split large forms for maintainability
- ✅ Need to reuse form sections across different forms
- ✅ Have multi-step forms with separate components per step
- ✅ Want to organize complex forms by domain concept
