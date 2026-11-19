# Auto-save on blur

`ngx-vest-forms` keeps persistence out of the library and exposes `FormDirective.fieldBlur` so your application can trigger draft auto-save, analytics, or other blur-driven side effects.

## Separate validation from draft persistence

Validation and draft auto-save answer different questions:

- **Validation** checks whether the form is ready for final submission.
- **Auto-save** saves work in progress so the user does not lose edits.

For most forms, save drafts on blur even when fields are incomplete, and keep blocking validation for final submission.

## The `fieldBlur` output

`(fieldBlur)` emits whenever a named control inside `<form ngxVestForm>` loses focus:

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

`field` is the control's full dotted path, including controls inside dynamic `[ngModelGroup]` bindings and custom controls whose inner input blurs.

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NgxVestForms,
  type NgxDeepPartial,
  type NgxFieldBlurEvent,
} from 'ngx-vest-forms';

type DraftFormModel = NgxDeepPartial<{
  projectName: string;
  notes: string;
}>;

@Component({
  selector: 'app-draft-form',
  imports: [NgxVestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

    this.saveDraft(event.formValue);
  }

  private saveDraft(draft: DraftFormModel): void {
    // Persist to API, sessionStorage, IndexedDB, etc.
  }
}
```

Treat `event.pending` as informational metadata rather than a blocker for draft saves. Gating saves on `!event.pending` drops a draft save whenever an async validator is still running on blur.

## Choosing a persistence policy

### Policy A: always save drafts on blur (recommended for drafts)

Save whenever `event.formValue` is present and `event.dirty` is `true`, deduplicating against the last saved snapshot. Best for long forms, multi-step flows, and crash recovery.

### Policy B: save only when valid

Check `event.valid` (blurred control) or `this.vestForm().formState().valid` (whole form) when your backend rejects partial payloads or blur triggers a strict commit:

```ts
protected handleFieldBlur(event: NgxFieldBlurEvent<DraftFormModel>): void {
  if (!event.formValue || !event.dirty || !event.valid) {
    return;
  }

  this.saveDraft(event.formValue);
}
```

For temporary client-only drafts, `sessionStorage` (per tab) or `localStorage` works well. For cross-device or collaborative workflows, persist drafts to your backend.

## Combining dependent validation with blur auto-save

When editing field A makes field B required, you usually want field B to become invalid immediately while staying visually quiet until the user blurs field B or submits the form.

Pair `[validationConfig]` with the default `'on-blur-or-submit'` error display mode on `<ngx-control-wrapper>`:

```ts
protected readonly validationConfig = createValidationConfig<FormModel>()
  .whenChanged('quantity', 'quantityJustification')
  .build();
```

```html
<ngx-control-wrapper>
  <label for="quantity">Quantity</label>
  <input id="quantity" name="quantity" [ngModel]="formValue().quantity" />
</ngx-control-wrapper>

<ngx-control-wrapper>
  <label for="quantityJustification">Quantity justification</label>
  <textarea
    id="quantityJustification"
    name="quantityJustification"
    [ngModel]="formValue().quantityJustification"
  ></textarea>
</ngx-control-wrapper>
```

Do not call `triggerFormValidation()` inside field blur handlers to force this timing. `validationConfig` handles dependent revalidation, wrapper display modes handle error visibility, and `(fieldBlur)` handles persistence.

## Accessibility notes

- Announce save status in a polite live region (`role="status"`) rather than an assertive alert unless a failure blocks the user.
- Keep the final submit button enabled and separate from draft saves.
- Communicate conditional requirements in labels or helper text so users know why a field became required before blurring it.

## Runnable example

See `/auto-save-demo` in `apps/examples`:

- `apps/examples/src/app/pages/auto-save-demo/auto-save-demo.page.ts`
- `apps/examples/src/app/pages/auto-save-demo/auto-save-demo.form.ts`
- `apps/examples/src/app/pages/auto-save-demo/auto-save-demo.service.ts`

It demonstrates the always-save draft policy, snapshot deduplication, `sessionStorage` restore, retry on failure, and quiet dependent validation.

## Related guides

- [ValidationConfig vs root-form](./VALIDATION-CONFIG-VS-ROOT-FORM.md)
- [Accessibility](./ACCESSIBILITY.md)
- [Complete example](./COMPLETE-EXAMPLE.md)
