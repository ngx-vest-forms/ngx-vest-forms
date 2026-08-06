---
name: field-blur-events
description: Helps developers use `fieldBlur` and `NgxFieldBlurEvent` correctly in ngx-vest-forms. Use this whenever the user mentions draft auto-save, blur-save, field-level persistence, draft recovery, analytics on blur, blur-driven side effects, or asks how to save on blur without mixing persistence policy into validation timing.
---

# ngx-vest-forms field blur workflow

Use this skill when the task is about **application-level work that should happen when a named control blurs**.

## First principle

Keep **validation** and **persistence/side effects** separate.

- Validation answers whether the current form state is valid.
- Blur-driven persistence answers whether the app should save or act on the current draft now.

Do not treat draft auto-save as a disguised submit button.

## Public API to prefer

Recommend consumer-facing imports from `'ngx-vest-forms'`:

- `NgxVestForms`
- `NgxFieldBlurEvent`
- `createValidationConfig` when dependent fields are involved

Use the package-root import rule in `../SKILL.md` for blur-related examples.

## Default recommendation

For draft persistence, prefer the form's `fieldBlur` output:

1. listen to `(fieldBlur)` on the form
2. require `event.formValue`
3. require `event.dirty`
4. optionally dedupe against the last saved or queued draft snapshot
5. save the draft independently of validation completion

Treat `event.pending` as metadata unless the product explicitly wants strict valid-only blur commits.

If the form also runs asynchronous Vest tests, keep the blur-save policy
independent of completion. Consult the `vestjs` `async-and-warnings` workflow
for `AbortSignal`, stale-request, and pending-state guidance.

When the user asks for “the right pattern” or “best practice”, ground the answer
in the documented blur-save materials instead of answering only at the API level:

- point to `docs/AUTO-SAVE-ON-BLUR.md`
- mention the examples app route `/auto-save-demo`
- use the auto-save demo files as the preferred concrete implementation reference

## Recommended blur-save policies

### Draft policy: save incomplete drafts on blur

This is the default for recovery-oriented UX, long forms, and multi-step flows.

```ts
protected handleFieldBlur(event: NgxFieldBlurEvent<FormModel>): void {
  if (!event.formValue || !event.dirty) {
    return;
  }

  this.saveDraft(event.formValue);
}
```

Use this when the saved value is explicitly a draft.

### Strict policy: save only acceptable state

This fits field-level commits or side effects that should only run when validation has passed.

```ts
protected handleFieldBlur(event: NgxFieldBlurEvent<FormModel>): void {
  if (!event.formValue || !event.dirty || !event.valid || event.pending) {
    return;
  }

  this.saveDraft(event.formValue);
}
```

If the product means “whole form valid”, check the form state rather than assuming `event.valid` represents the whole form.

## Interaction with dependent validation

If field A makes field B required, the calm UX is usually:

1. field B becomes logically invalid immediately
2. the draft can still be saved on blur
3. field B stays visually quiet until its own blur or submit policy allows messages

That usually means combining:

- `validationConfig` for dependency timing
- wrapper display modes such as `errorDisplayMode="on-blur"`
- `fieldBlur` for persistence or analytics

Do not recommend `(blur)` handlers that call `triggerFormValidation()` to force this behavior. That couples persistence policy to validation reruns and often causes noisy async behavior.

## What to avoid

Correct these patterns when you see them:

- listening to native `(blur)` on every control to orchestrate library validation
- calling `triggerFormValidation()` from blur handlers for dependent-field timing
- blocking draft auto-save on `event.pending`
- describing `fieldBlur` as validation logic rather than as an event for application policy

## Output style

When answering the user:

1. name the blur policy first: draft-save vs valid-only commit
2. show the `fieldBlur` handler and the form binding together
3. if dependent fields are involved, show the `validationConfig` and wrapper display mode beside the blur handler
4. keep examples on the public API surface
5. when the user wants a complete pattern, mention the auto-save guide and `/auto-save-demo` so the answer is anchored to a documented workflow

## Consumer references

- `../../../../docs/AUTO-SAVE-ON-BLUR.md`
- `../../../../docs/VALIDATION-CONFIG-VS-ROOT-FORM.md`
- `../../../../README.md`
- `../../../../projects/examples/src/app/pages/auto-save-demo/auto-save-demo.page.ts`
- `../../../../projects/examples/src/app/pages/auto-save-demo/auto-save-demo.form.ts`

Use the auto-save demo as the complete example for blur-driven persistence and quiet dependent validation.

## Fast heuristic

If the user says “save on blur”, “draft auto-save”, “persist on blur”, “fieldBlur”, “blur analytics”, or “save the latest draft when a field loses focus”, this skill should trigger.
