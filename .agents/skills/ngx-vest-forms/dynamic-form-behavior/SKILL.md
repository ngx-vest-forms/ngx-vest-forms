---
name: dynamic-form-behavior
description: Runtime structure changes in ngx-vest-forms forms: clearing hidden values with `clearFieldsWhen`/`clearFields`/`keepFieldsWhen`, dropping stale Vest results with `removeField`, and when `triggerFormValidation()` is needed. Read it when sections show and hide, inputs swap for static content, or errors stay after the layout changed.
---

# ngx-vest-forms dynamic forms

Most dynamic-form bugs are stale state ownership: the model still holds values for controls that are gone, or the suite still holds their results. The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## First name what changed

| Change                                                    | What it needs                                                                                         |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| one input swapped for another input                       | nothing extra; the new control's value change reruns validation                                       |
| an input replaced by static content, or a section removed | clear the values, remove the fields from the suite, rerun validation                                  |
| a field became required because another field changed     | `validationConfig` → [`../validation-config-builder/SKILL.md`](../validation-config-builder/SKILL.md) |
| the rule is about the whole form                          | `ROOT_FORM` → [`../root-form-validation/SKILL.md`](../root-form-validation/SKILL.md)                  |

## Handle a removed section

Do these together, in one handler; the change is handled when the model, the suite and the template agree on which fields exist:

1. **Model:** clear what no longer applies and write the result back to the `formValue` signal; a write made from a `(formValueChange)` handler is applied, not dropped. The field-clearing helpers work on top-level keys of the model:
   - `clearFieldsWhen(value, { shippingAddress: !useShipping })` clears each key whose condition is `true`;
   - `clearFields(value, ['fieldA', 'fieldB'])` clears unconditionally;
   - `keepFieldsWhen(value, { fieldA: isTypeA, type: true })` keeps only the keys whose condition is `true`.
2. **Suite:** call `removeField(path)` on the `FormDirective` for each path that is gone for good, so Vest forgets its results; `resetField(path)` instead when the field stays and only its validation history should restart.
3. **Rules:** mirror the template condition in the suite with `omitWhen(condition, () => { … })`, so hidden fields have no tests.
4. **Rerun:** call `triggerFormValidation()` (optionally with a path) when no remaining control will emit a change, which is the input-to-static-content case. It reruns validation only; it does not mark controls touched or reveal errors.

```ts
protected onDeliveryChange(method: 'ship' | 'pickup'): void {
  this.formValue.update((value) =>
    clearFieldsWhen({ ...value, method }, { shippingAddress: method === 'pickup' })
  );
  if (method === 'pickup') {
    this.vestForm().removeField('shippingAddress');
  }
  this.vestForm().triggerFormValidation();
}
```

`triggerFormValidation()` belongs to structure changes. Ordinary input-to-input edits already revalidate, dependent timing belongs to `validationConfig`, and blur-driven saving belongs to [`../field-blur-events/SKILL.md`](../field-blur-events/SKILL.md).

## References

- [`FIELD-CLEARING-UTILITIES.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/FIELD-CLEARING-UTILITIES.md)
- [`STRUCTURE_CHANGE_DETECTION.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/STRUCTURE_CHANGE_DETECTION.md)
