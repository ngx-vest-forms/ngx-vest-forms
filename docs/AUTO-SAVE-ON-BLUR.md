# Auto-Save on Blur

## Overview

`ngx-vest-forms` does **not** implement persistence for you, but it now exposes a
low-level primitive that makes blur-driven draft persistence straightforward:

- `FormDirective.fieldBlur`

This output emits whenever a named form control loses focus. It is designed for
application-level workflows such as:

- draft auto-save
- analytics
- field-level side effects
- progressive persistence in long forms

## Keep validation and persistence separate

Blur-driven persistence and validation are related, but they solve different
problems:

- **Validation** answers: “Is the current form state valid?”
- **Auto-save** answers: “Should we persist the current draft state now?”

For most forms, the recommended UX is:

1. save the **draft** on blur
2. allow the draft to be incomplete
3. reserve full blocking validation for final submission

This avoids turning auto-save into a disguised submit button.

## `fieldBlur` output

The `fieldBlur` output emits this payload:

```ts
type NgxFieldBlurEvent<T> = {
  field: string;
  value: unknown;
  formValue: T | null;
  dirty: boolean;
  touched: boolean;
  valid: boolean;
  pending: boolean;
};
```

### Example

```ts
import { Component, signal } from '@angular/core';
import {
  NgxFieldBlurEvent,
  NgxVestForms,
  type NgxDeepPartial,
} from 'ngx-vest-forms';

type DraftFormModel = NgxDeepPartial<{
  projectName: string;
  notes: string;
}>;

@Component({
  imports: [NgxVestForms],
  template: `
    <form
      ngxVestForm
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      (fieldBlur)="handleFieldBlur($event)"
    >
      <ngx-control-wrapper>
        <label for="projectName">Project name</label>
        <input
          id="projectName"
          name="projectName"
          [ngModel]="formValue().projectName"
        />
      </ngx-control-wrapper>
    </form>
  `,
})
export class DraftFormComponent {
  protected readonly formValue = signal<DraftFormModel>({});

  protected handleFieldBlur(event: NgxFieldBlurEvent<DraftFormModel>): void {
    if (!event.formValue || !event.dirty) {
      return;
    }

    // Persist the latest draft value here.
    this.saveDraft(event.formValue);
  }

  private saveDraft(draft: DraftFormModel): void {
    // API call, sessionStorage, IndexedDB, etc.
  }
}
```

The important bit is that draft persistence should usually key off `formValue`
and `dirty`, not `pending`. Async validation may still be in progress when the
user blurs a field, and blocking persistence on `pending` turns auto-save into a
validation gate instead of a draft-saving workflow.

In practice, a solid baseline is:

- require `event.formValue`
- require `event.dirty`
- optionally dedupe against the last saved/queued snapshot
- allow save + validation to proceed independently

## Recommended persistence strategy

For demos and simple workflows, temporary draft persistence in browser storage is
fine:

- `sessionStorage` for per-tab temporary drafts
- `localStorage` for longer-lived browser-only drafts

For production applications, server-side draft persistence is often the better
fit, especially when users switch devices or collaborate.

## Dependent validation + blur auto-save

If field **A** makes field **B** required, a good blur-save UX usually wants:

1. field **B** becomes logically invalid immediately
2. the draft can still be saved
3. field **B** stays visually quiet until the user blurs **B**

That works well with the regular `validationConfig` dependency map:

```ts
protected readonly validationConfig = createValidationConfig<FormModel>()
  .bidirectional('quantity', 'quantityJustification')
  .build();
```

Pair it with `on-blur` wrappers:

```html
<ngx-control-wrapper [errorDisplayMode]="'on-blur'">
  <label for="quantity">Quantity</label>
  <input id="quantity" name="quantity" [ngModel]="formValue().quantity" />
</ngx-control-wrapper>

<ngx-control-wrapper [errorDisplayMode]="'on-blur'">
  <label for="quantityJustification">Quantity justification</label>
  <textarea
    id="quantityJustification"
    name="quantityJustification"
    [ngModel]="formValue().quantityJustification"
  ></textarea>
</ngx-control-wrapper>
```

This gives you the calm UX discussed in issue #93:

- immediate revalidation
- accurate required state
- no premature inline error on untouched dependent fields

Avoid calling `triggerFormValidation()` from field blur handlers as part of this pattern.
That method is meant for structure changes and other explicit revalidation cases, not for
re-implementing dependent-field blur timing. For dependent fields, prefer the built-in
combination of `validationConfig` and wrapper display modes, and use `fieldBlur` only for
application-level side effects such as draft persistence.

## Example in this repository

See the examples app:

- route: `/auto-save-demo`

The demo stores the draft temporarily in:

- `sessionStorage`
- key: `ngx-vest-forms:auto-save-demo:draft`

It also demonstrates:

- blur-triggered draft persistence
- deduping queued saves by serialized draft snapshot
- dependent validation with on-blur error display
- reload restore behavior
- save failure + retry behavior

Relevant files:

- `projects/examples/src/app/pages/auto-save-demo/auto-save-demo.page.ts`
- `projects/examples/src/app/pages/auto-save-demo/auto-save-demo.form.ts`
- `projects/examples/src/app/pages/auto-save-demo/auto-save-demo.service.ts`

## Accessibility notes

- Keep save status messaging in a polite live region (`role="status"`) unless it
  blocks the workflow.
- Do not disable final submit just because auto-save exists.
- If a field becomes conditionally required, ensure the UI still communicates that
  state even when inline errors are deferred until blur.

## Related docs

- [ValidationConfig vs Root-Form](./VALIDATION-CONFIG-VS-ROOT-FORM.md)
- [Accessibility Guide](./ACCESSIBILITY.md)
- [Complete Example](./COMPLETE-EXAMPLE.md)
