# Structure change detection

Handle form validity updates when conditional template branches switch between form controls and static content without a control value changing.

## When `triggerFormValidation()` is needed

When an `@if` branch replaces an `<input>` with non-form content such as `<p>` (without another control emitting a value change), Angular does not emit a `ValueChangeEvent`, so root form validity can stay stale.

```html
@if (formValue().procedureType === 'typeA') {
  <input name="fieldA" [ngModel]="formValue().fieldA" />
} @else if (formValue().procedureType === 'typeB') {
  <input name="fieldB" [ngModel]="formValue().fieldB" />
} @else if (formValue().procedureType === 'typeC') {
  <p>No additional input required for this procedure type.</p>
}
```

You do **not** need `triggerFormValidation()` when switching between two inputs (for example, changing `<input type="text">` to `<input type="number">`) because control value changes trigger validation automatically.

## API

```ts
triggerFormValidation(path?: string): void
```

- **Without `path`:** re-runs validators on every descendant control in the form tree (deepest first), then runs `updateValueAndValidity({ emitEvent: true })` on the root form. Every field and root validator re-evaluates, including async tests.
- **With `path`:** re-runs validators on every descendant under `path` (deepest first) if `path` points to an `ngModelGroup` or `FormArray`, then runs `updateValueAndValidity({ emitEvent: true })` on that target so its ancestors recalculate up to the root. Pass a field or group path (for example `'address'` or `'address.street'`) when only one section needs revalidation, such as after switching `[validationFocus]`. Passing an unknown path logs `[NGX-003]` in development mode and does nothing.

`triggerFormValidation()` never marks controls as touched and never reveals errors. To show errors programmatically (for example, submitting multiple forms with one button), call `markAllAsTouched()`. With the default `'on-blur-or-submit'` display mode, regular `(ngSubmit)` / `(submitSettled)` submissions call `markAllAsTouched()` automatically.

## Recommended pattern

Clear hidden fields and purge removed fields from Vest 6's stateful suite inside `(formValueChange)`. Do **not** update `formValue` from a separate `(ngModelChange)` handler alongside `(formValueChange)`, as simultaneous writes trigger `[NGX-100]` sync warnings.

```ts
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  clearFieldsWhen,
  FormDirective,
  NgxVestForms,
  type NgxDeepPartial,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import { create, enforce, omitWhen, test } from 'vest';

type ProcedureFormModel = NgxDeepPartial<{
  procedureType: 'typeA' | 'typeB' | 'typeC';
  fieldA: string;
  fieldB: string;
}>;

const procedureSuite: NgxVestSuite<ProcedureFormModel> = create((model) => {
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
});

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
          <option value="typeC">Type C (no input)</option>
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
        <p>No additional input required for this procedure type.</p>
      }
    </form>
  `,
})
export class ProcedureFormComponent {
  private readonly vestForm =
    viewChild.required<FormDirective<ProcedureFormModel>>('vestForm');

  protected readonly formValue = signal<ProcedureFormModel>({});
  protected readonly suite = procedureSuite;

  protected handleFormChange(value: ProcedureFormModel): void {
    const next = clearFieldsWhen(value, {
      fieldA: value.procedureType !== 'typeA',
      fieldB: value.procedureType !== 'typeB',
    });

    if (value.procedureType !== 'typeA') {
      this.vestForm().removeField('fieldA');
    }
    if (value.procedureType !== 'typeB') {
      this.vestForm().removeField('fieldB');
    }

    this.formValue.set(next);
    this.vestForm().triggerFormValidation();
  }
}
```

### `removeField()` vs `resetField()`

Vest 6 suites accumulate results across `suite.only(field).run(model)` calls:

- Call `vestForm().removeField(field)` when a control is unmounted (for example by `@if` or when deleting an array row). It calls Vest's `suite.remove(field)` (cancelling any pending async test for that field) and clears stored warnings.
- Call `vestForm().resetField(field)` when a control stays mounted but its value is reset programmatically. It calls Vest's `suite.resetField(field)`, clears warnings and held messages, and revalidates the control.

## FAQ: do I need `#group="ngModelGroup"` with wrappers?

No. Template references like `#group="ngModelGroup"` are standard Angular template-driven forms features and are optional.

Add a template reference only when you need direct access to the group's state in the template (for example disabling a section button while `billingGroup.pending || billingGroup.invalid`). For group containers, use `<ngx-form-group-wrapper ngModelGroup="...">` so ARIA attributes are not stamped onto child inputs.

```html
<ngx-form-group-wrapper ngModelGroup="addresses">
  <ngx-form-group-wrapper ngModelGroup="billing" #billingGroup="ngModelGroup">
    <!-- child controls -->
  </ngx-form-group-wrapper>

  <button type="button" [disabled]="billingGroup.pending || billingGroup.invalid">
    Save billing address
  </button>
</ngx-form-group-wrapper>
```

## Related guides

- [Field clearing utilities](./FIELD-CLEARING-UTILITIES.md)
- [ValidationConfig vs root-form](./VALIDATION-CONFIG-VS-ROOT-FORM.md)
- [Troubleshooting diagnostics](./TROUBLESHOOTING.md)
- Runnable demo: `/conditional-structure` (`apps/examples/src/app/pages/conditional-structure-demo`)
