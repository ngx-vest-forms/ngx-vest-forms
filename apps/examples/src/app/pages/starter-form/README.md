# Starter Contact Form

The canonical "start here" demo. It is the smallest honest ngx-vest-forms
setup — copy it into a new app and you have a working, validated,
accessible form.

## Why this demo exists

New visitors need one trustworthy baseline rather than a tour of advanced
features. Every other demo in this app builds on the wiring shown here.

## What it shows

- A single `ngxVestForm` directive on a native `<form>`.
- A typed model (`StarterFormModel`) declared with `NgxDeepPartial`, and its
  matching contract (`starterFormShape`) supplied through
  `provideFormContract` so the directive can warn (in dev) about `name`
  attributes that drift from the model.
- A plain Vest suite (`starter.validations.ts`) wired in through the
  `[suite]` input. The suite has no Angular dependency and is unit-testable
  on its own: `starterFormSuite.runStatic({ name: '' })`.
- The form value owned by the page as a `signal`, kept in sync through
  `(formValueChange)` — no reactive forms, no `FormGroup`.
- `ngx-control-wrapper` rendering label + input + error message with the
  default on-blur error timing.
- A non-blocking `warn()` rule on the message field: guidance that never
  prevents submission.
- Reading packaged form state via `createFormFeedbackSignals` for the live
  state panel.

## Public API used

`NgxVestForms`, `FormDirective`, `provideFormContract`,
`createFormFeedbackSignals`, `NgxDeepPartial`, `NgxDeepRequired`,
`NgxVestSuite`.

## Key files

| File | Responsibility |
| --- | --- |
| `starter.page.ts` / `.html` | Self-contained page + form |
| `starter.validations.ts` | Vest suite (testable in isolation) |
| `../../models/starter-form.model.ts` | Model + contract |
| `starter.content.ts` | "What this demonstrates / learn" cards |

## Behavior

Submitting while invalid keeps the success panel hidden and surfaces field
errors on the touched fields. Submitting a valid form shows a success panel
echoing the submitted name and email. Reset clears both the form and the
success panel.
