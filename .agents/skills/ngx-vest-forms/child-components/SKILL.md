---
name: child-components
description: Splitting an ngx-vest-forms form into child components with `vestFormsViewProviders`, nested `ngModelGroup`s and prefixed validation helpers. Read it for reusable form sections, multi-step forms, or a child whose controls never reach the parent's `formValue`.
---

# ngx-vest-forms child components

The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## The rule

Every component that renders `ngModel` or `ngModelGroup` for a parent `<form ngxVestForm>` declares `viewProviders: [vestFormsViewProviders]`, at every nesting level. Without it Angular's `ngModel` cannot see the parent form across the component boundary, so the child's controls silently stay out of the form value and validation. Only the top-level component holds the `<form>`.

## Build a section

1. Pass the model slice in with a signal `input()`, and the group's path segment when the section is reusable.
2. Put `[ngModelGroup]="groupName()"` on an `<ngx-form-group-wrapper>`; the group name joined with the parents' names must equal the Field Path in the parent model.
3. Wrap each control in `<ngx-control-wrapper>` with `name` relative to the group.
4. Derive `id`s from the group name, so two instances on one page stay unique.
5. Validate with a helper that takes the slice and the full path prefix, so test names match the Field Paths.

```ts
import { Component, input } from '@angular/core';
import {
  NgxVestForms,
  vestFormsViewProviders,
  type NgxDeepPartial,
} from 'ngx-vest-forms';

@Component({
  selector: 'app-address-section',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  template: `
    <ngx-form-group-wrapper [ngModelGroup]="groupName()">
      <ngx-control-wrapper>
        <label [for]="groupName() + '-street'">Street</label>
        <input
          [id]="groupName() + '-street'"
          name="street"
          [ngModel]="address()?.street"
        />
      </ngx-control-wrapper>
    </ngx-form-group-wrapper>
  `,
})
export class AddressSectionComponent {
  readonly groupName = input.required<string>();
  readonly address = input<NgxDeepPartial<Address>>();
}
```

```html
<!-- parent, inside <form ngxVestForm> -->
<app-address-section groupName="billing" [address]="formValue().billing" />
<app-address-section groupName="shipping" [address]="formValue().shipping" />
```

```ts
// suite
export function addressValidations(
  address: NgxDeepPartial<Address> | undefined,
  prefix: string
): void {
  test(`${prefix}.street`, 'Street is required', () => {
    enforce(address?.street).isNotBlank();
  });
}

export const checkoutSuite: NgxVestSuite<Checkout> = create((model) => {
  addressValidations(model.billing, 'billing');
  addressValidations(model.shipping, 'shipping');
});
```

Value edits inside the child reach the parent through the form's `(formValueChange)`; structural changes the child makes (adding a row) go out through an `output()` the parent applies to its signal.

For a section nested deeper, pass the full dotted prefix to the validation helper (`'order.billing'`) while each component's `ngModelGroup` carries only its own segment.

## References

- [`CHILD-COMPONENTS.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/CHILD-COMPONENTS.md)
- [`COMPOSABLE-VALIDATIONS.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/COMPOSABLE-VALIDATIONS.md)
