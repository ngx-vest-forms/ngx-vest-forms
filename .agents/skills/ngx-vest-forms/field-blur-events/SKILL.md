---
name: field-blur-events
description: Blur-driven app work in ngx-vest-forms through the form's `fieldBlur` output and `NgxFieldBlurEvent`: draft auto-save, field-level persistence, analytics. Read it when something should happen when a field loses focus.
---

# ngx-vest-forms field blur events

`(fieldBlur)` on `<form ngxVestForm>` emits once per named control blur. It is an event for application policy (saving, analytics); validation timing stays with the suite, `validationConfig` and the wrapper display modes. The invariants live in the router, [`../SKILL.md`](../SKILL.md).

The payload, `NgxFieldBlurEvent<Model>`, carries `field` (the dotted Field Path), `value`, `formValue`, `dirty`, `touched`, `valid` (that field only) and `pending`.

## Pick the policy first

Name the policy in the answer before the code.

**Draft save** is the default for long forms, multi-step flows and recovery UX: save whatever the user has, valid or not. Treat `pending` as metadata, since gating on it can drop the latest draft while an async test runs.

```ts
protected onFieldBlur(event: NgxFieldBlurEvent<PurchaseForm>): void {
  if (!event.formValue || !event.dirty) {
    return;
  }
  this.drafts.save(event.formValue); // dedupe against the last saved snapshot if saves are costly
}
```

**Valid-only commit** fits side effects that must only see accepted values, such as a per-field PATCH:

```ts
protected onFieldBlur(event: NgxFieldBlurEvent<PurchaseForm>): void {
  if (!event.formValue || !event.dirty || !event.valid || event.pending) {
    return;
  }
  this.api.patchField(event.field, event.value);
}
```

`event.valid` describes the blurred field. When the policy means "the whole form is valid", read the directive's `valid()` or `formState().valid` instead.

```html
<form
  ngxVestForm
  [suite]="suite"
  [formValue]="formValue()"
  (formValueChange)="formValue.set($event)"
  (fieldBlur)="onFieldBlur($event)"
></form>
```

## Dependent fields stay quiet

When field A makes field B required, the calm UX is: B is invalid at once, the draft still saves on blur, and B shows its message only after its own blur or a submit. That needs three pieces side by side:

- `validationConfig` with `.whenChanged('quantity', 'quantityJustification')` for the timing ([`../validation-config-builder/SKILL.md`](../validation-config-builder/SKILL.md));
- `[errorDisplayMode]="'on-blur'"` on B's `<ngx-control-wrapper>` for the visibility;
- `(fieldBlur)` for the save.

Native `(blur)` listeners on each control and blur handlers that call `triggerFormValidation()` are the patterns to replace: they couple persistence to validation reruns and restart async tests.

## References

The canonical implementation is the examples app's `/auto-save-demo`; point users at it when they ask for "the right pattern".

- [`AUTO-SAVE-ON-BLUR.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/AUTO-SAVE-ON-BLUR.md)
- [`auto-save-demo` source](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/apps/examples/src/app/pages/auto-save-demo)
