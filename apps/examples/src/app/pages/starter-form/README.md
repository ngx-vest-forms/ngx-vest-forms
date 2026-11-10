# Starter Contact Form

The canonical "start here" demo. It is the smallest honest ngx-vest-forms
setup: copy two files into a new app and you have a working, validated,
accessible form.

## Why this demo exists

New visitors need one trustworthy baseline rather than a tour of advanced
features. The larger demos split a page from a form body; this one does not,
so it shows how little code the library needs.

## What it shows

- One standalone component (`StarterFormComponent`) that owns the `formValue`
  signal, the `<form ngxVestForm>` template (inline) and the submit handler.
  The page hosts that same component, so the form you see is the form you
  copy.
- A single `ngxVestForm` directive on a native `<form>`, kept in sync through
  `(formValueChange)`. No reactive forms, no `FormGroup`.
- A typed model (`StarterFormModel`) declared with `NgxDeepPartial`, and its
  matching contract supplied through `provideFormContract` so the directive
  can warn (in dev) about `name` attributes that drift from the model.
- A plain Vest suite wired in through the `[suite]` input. It has no Angular
  dependency and is unit-testable on its own:
  `starterFormSuite.runStatic({ name: '' })`.
- `ngx-control-wrapper` with `ariaRequired` rendering label, input and error
  message with the default on-blur error timing.
- A submit decided in `(submitSettled)`: the handler records `event.value`
  only when `event.valid` is true.
- A non-blocking `warn()` rule on the message field.
- Packaged form state via `createFormFeedbackSignals`, which the page reads
  through a `viewChild` to feed the live state card.

## Public API used

`NgxVestForms`, `FormDirective`, `provideFormContract`,
`createFormFeedbackSignals`, `NgxDeepPartial`, `NgxDeepRequired`,
`NgxSubmitSettledEvent`, `NgxVestSuite`.

## Key files

| File | Responsibility |
| --- | --- |
| `starter.form.ts` | The copyable component: state, template, submit, reset |
| `starter.validations.ts` | Model type and Vest suite (testable in isolation) |
| `starter.page.ts` / `.html` | Page chrome: intro, form-state card, example cards |
| `starter.content.ts` | "What this demonstrates / learn" cards |

Only the first two files are meant to be copied. They import Angular,
`'ngx-vest-forms'` and `vest`, nothing from this app. The CSS classes in the
template (`input-field`, `btn`, `label-text`, `label-required`, ...) come from
the app's global styles and are cosmetic only.

## Behavior

Submitting while invalid keeps the success message hidden and surfaces field
errors on the touched fields. Submitting a valid form shows a success message
echoing the submitted name and email. Reset clears both the form and the
success message.
