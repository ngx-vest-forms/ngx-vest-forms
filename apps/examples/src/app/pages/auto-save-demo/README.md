# Auto-Save Draft Demo

Persist draft changes on blur while keeping validation and final submission
separate.

## Why this demo exists

Real applications often want to protect a user's in-progress work without
forcing the form to be valid first. This demo shows how to build a robust
blur-driven auto-save on top of `ngx-vest-forms` while keeping draft
persistence strictly independent of validation and final submit. It also
demonstrates how to keep that persistence layer resilient under rapid blur
events and a Reset that races an in-flight save.

## What it does

- Blurring a **changed** field queues a draft save. The save is debounced by
  identity: a serialized draft key dedupes unchanged blurs and saves that are
  already queued.
- Draft saves run through an RxJS `Subject` + `concatMap` pipeline so writes
  stay ordered even during a burst of blur events.
- Drafts persist to `sessionStorage` (`AutoSaveDemoService`). A draft is
  restored on page load and its status surfaced in the sidebar.
- A `#saveGeneration` counter is bumped on Reset. Any queued or in-flight save
  carrying an older generation is dropped before it can rewrite the cleared
  draft.
- Validation runs independently of persistence: a draft can be saved while the
  form is still invalid. The explicit "Save" button, by contrast, requires a
  valid form.
- Project name `fail` triggers a simulated save failure to exercise the retry
  path.

## ngx-vest-forms APIs showcased

- `NgxVestForms` directive bundle on the form body.
- `NgxFieldBlurEvent<T>` — the `(fieldBlur)` payload exposing `field`,
  `formValue`, and `dirty` used to drive blur-based saving.
- `createValidationConfig<T>()` with `.bidirectional('quantity',
  'quantityJustification')` and `.whenChanged('preferredContactMethod',
  'email')` for coordinated dependent validation.
- `FormDirective` view-child state: `formState()`, `fieldWarnings()`,
  `touchedFieldPaths()`, plus `resetForm()`.
- Vest `warn()` for non-blocking `notes` guidance.
- `fieldWarningsToRecord` / `createEmptyFormState` helpers for presentational
  state.

## Key files

- `auto-save-demo.page.ts` — orchestration: blur handling, save queue,
  generation counter, reset, restored-draft status.
- `auto-save-demo.form.ts` / `.form.html` — the form body and exposed state.
- `auto-save-demo.validations.ts` — Vest suite (dependent pair, conditional
  email, notes warning).
- `auto-save-demo.service.ts` — `sessionStorage`-backed draft store with
  simulated latency and failure.
- `auto-save-demo.content.ts` — in-app "What this demonstrates / learn" cards.

## Behavior notes

- Saving a draft never implies the form is valid; the two concerns are kept
  separate by design.
- Untouched dependent fields stay visually quiet until their own blur even
  though the underlying rule may already require them.
- Resetting clears the stored draft and guarantees no stale queued save can
  resurrect it.
