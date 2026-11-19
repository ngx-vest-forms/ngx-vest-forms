# Field clearing utilities

Immutable helpers for clearing hidden model fields when conditional sections unmount, keeping your `formValue` signal aligned with the controls mounted in the DOM.

## Why field clearing is needed

When an `@if` block hides a control (for example, switching from an `<input name="fieldA">` to static text `<p>No input needed</p>`), Angular removes the `FormControl` from `ngForm.form.value`, but your `formValue` signal still holds the old `fieldA` value. If that stale value stays in `formValue`, conditional Vest rules or form submission can read outdated data.

Pure form-to-form switches that reuse the same `name` attribute (such as changing an input's `type`) keep the same `FormControl` and do not need manual clearing.

## Available utilities

All three utilities operate on **top-level keys only** (`keyof T`) and return a new shallow copy without mutating the input object.

### `clearFieldsWhen(currentState, conditions)`

Sets each listed top-level key to `undefined` when its boolean condition is `true`.

```ts
function clearFieldsWhen<T extends Record<string, unknown>>(
  currentState: T,
  conditions: Readonly<Partial<Record<keyof T, boolean>>>
): T;
```

```ts
import { clearFieldsWhen } from 'ngx-vest-forms';

const next = clearFieldsWhen(value, {
  fieldA: value.procedureType !== 'typeA',
  fieldB: value.procedureType !== 'typeB',
  shippingAddress: !value.useShippingAddress,
});
```

### `clearFields(currentState, fieldsToClear)`

Unconditionally sets the listed top-level keys to `undefined`.

```ts
function clearFields<T extends Record<string, unknown>>(
  currentState: T,
  fieldsToClear: ReadonlyArray<keyof T>
): T;
```

```ts
import { clearFields } from 'ngx-vest-forms';

const cleaned = clearFields(value, ['temporaryData', 'draftNotes']);
```

### `keepFieldsWhen(currentState, conditions)`

Allowlist helper: returns a new object containing only the listed top-level keys whose condition is `true` and that exist on `currentState`. Keys whose condition is `false`, and any keys not listed in `conditions`, are omitted from the returned object.

```ts
function keepFieldsWhen<T extends Record<string, unknown>>(
  currentState: T,
  conditions: Readonly<Partial<Record<keyof T, boolean>>>
): Partial<T>;
```

```ts
import { keepFieldsWhen } from 'ngx-vest-forms';

const filtered = keepFieldsWhen(value, {
  basicInfo: true,
  addressInfo: needsAddress,
  paymentInfo: requiresPayment,
});
```

## Recommended usage inside `(formValueChange)`

Always apply field clearing inside your `(formValueChange)` handler rather than in a separate `(ngModelChange)` handler on the toggle control. Writing `formValue` from `(ngModelChange)` while `(formValueChange)` is bound causes a same-tick sync conflict (`[NGX-100]`).

Also call `vestForm().removeField(path)` for unmounted fields so Vest 6's stateful suite drops their validation history and cancels any pending async checks, and call `vestForm().triggerFormValidation()` when switching from inputs to static content.

```ts
// procedure.model.ts
import type { NgxDeepPartial } from 'ngx-vest-forms';

export type ProcedureFormModel = NgxDeepPartial<{
  procedureType: 'typeA' | 'typeB' | 'typeC';
  fieldA: string;
  fieldB: string;
}>;
```

```ts
// procedure-form.component.ts
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { clearFieldsWhen, FormDirective, NgxVestForms } from 'ngx-vest-forms';
import type { ProcedureFormModel } from './procedure.model';
import { procedureSuite } from './procedure.validations';

@Component({
  selector: 'app-procedure-form',
  imports: [NgxVestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="handleFormChange($event)"
      #vestForm="ngxVestForm"
    >
      <ngx-control-wrapper>
        <label for="procedureType">Procedure type</label>
        <select
          id="procedureType"
          name="procedureType"
          [ngModel]="formValue().procedureType"
        >
          <option value="typeA">Type A</option>
          <option value="typeB">Type B</option>
          <option value="typeC">Type C</option>
        </select>
      </ngx-control-wrapper>

      @if (formValue().procedureType === 'typeA') {
        <ngx-control-wrapper>
          <label for="fieldA">Field A</label>
          <input id="fieldA" name="fieldA" [ngModel]="formValue().fieldA" />
        </ngx-control-wrapper>
      } @else if (formValue().procedureType === 'typeB') {
        <ngx-control-wrapper>
          <label for="fieldB">Field B</label>
          <input id="fieldB" name="fieldB" [ngModel]="formValue().fieldB" />
        </ngx-control-wrapper>
      } @else if (formValue().procedureType === 'typeC') {
        <p>No additional input required for Type C.</p>
      }

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ProcedureFormComponent {
  private readonly vestForm =
    viewChild.required<FormDirective<ProcedureFormModel>>('vestForm');

  protected readonly suite = procedureSuite;
  protected readonly formValue = signal<ProcedureFormModel>({});

  protected handleFormChange(value: ProcedureFormModel): void {
    const hideA = value.procedureType !== 'typeA';
    const hideB = value.procedureType !== 'typeB';

    const next = clearFieldsWhen(value, {
      fieldA: hideA,
      fieldB: hideB,
    });

    if (hideA) {
      this.vestForm().removeField('fieldA');
    }
    if (hideB) {
      this.vestForm().removeField('fieldB');
    }

    this.formValue.set(next);
    this.vestForm().triggerFormValidation();
  }
}
```

## Top-level keys only

`clearFieldsWhen`, `clearFields`, and `keepFieldsWhen` accept top-level keys (`keyof T`), not dotted paths. Clearing a top-level key clears its entire nested object:

```ts
// Valid: clears the entire `shippingAddress` subtree
const cleaned = clearFieldsWhen(state, {
  shippingAddress: !showShipping,
});

// Type error: dotted nested paths are not supported
// clearFieldsWhen(state, { 'shippingAddress.street': !showShipping });
```

To clear a single nested property while keeping its siblings, spread the nested object and set that property to `undefined` (or call `clearFieldsWhen` on the nested slice itself).

## Pairing with Vest `omitWhen`

Skip validation for cleared fields in your Vest suite using `omitWhen`:

```ts
import type { NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test } from 'vest';
import type { ProcedureFormModel } from './procedure.model';

export const procedureSuite: NgxVestSuite<ProcedureFormModel> = create(
  (model) => {
    test('procedureType', 'Procedure type is required', () => {
      enforce(model.procedureType).isNotBlank();
    });

    omitWhen(model.procedureType !== 'typeA', () => {
      test('fieldA', 'Field A is required for Type A', () => {
        enforce(model.fieldA).isNotBlank();
      });
    });

    omitWhen(model.procedureType !== 'typeB', () => {
      test('fieldB', 'Field B is required for Type B', () => {
        enforce(model.fieldB).isNotBlank();
      });
    });
  }
);
```

## Related guides

- [Structure change detection](./STRUCTURE_CHANGE_DETECTION.md)
- [ValidationConfig vs root-form](./VALIDATION-CONFIG-VS-ROOT-FORM.md)
- [Troubleshooting `NGX-100`](./TROUBLESHOOTING.md#ngx-100-divergent-same-tick-formmodel-writes)
- Runnable demo: `/conditional-structure` (`apps/examples/src/app/pages/conditional-structure-demo`)
