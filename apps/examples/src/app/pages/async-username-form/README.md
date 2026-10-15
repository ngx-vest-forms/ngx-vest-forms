# Async Username Availability

Validates a username against a mock remote endpoint, layering the async
validation pattern on top of the canonical starter wiring.

## Why this demo exists

Async field validation is where most form libraries get awkward: requests
race, stale responses overwrite fresh ones, and the UI flickers. This demo
shows the calm, correct way to do it with ngx-vest-forms — cheap rules
first, the network last, every stale request cancelled.

## What it shows

- A typed `AsyncUsernameModel` (`NgxDeepPartial`) plus its `asyncUsernameShape`
  contract supplied through `provideFormContract`.
- A suite **factory** (`createAsyncUsernameSuite(service)`) so the async
  service is injected by the component while the suite stays a plain,
  unit-testable Vest spec.
- Synchronous rules — required, min length 3, pattern `^[a-z0-9_]+$` — that
  gate the async availability test via `omitWhen`, so the endpoint is only
  hit once the username is structurally valid.
- The async test wrapped in `vest/memo` keyed on `[username]` so it does not
  re-run when other fields change, and aborted via
  `takeUntil(fromEvent(signal, 'abort'))` when the username changes mid-flight.
- A field-level debounce (`[validationOptions]` with
  `NGX_VALIDATION_DEBOUNCE_PRESETS.async`, 500ms), so the endpoint is called
  once typing pauses instead of on every keystroke.
- The wrapper's pending message renamed to "Checking availability…" with a
  component-level `NGX_PENDING_LABEL` provider. The same token, provided in
  the application config, translates the message for every wrapper. A
  success hint shows when the field is validated, error-free, and not
  pending; `createDebouncedPendingState` with the wrapper's timing keeps it
  hidden while the wrapper still shows the pending message.

## Public API used

`NgxVestForms`, `FormDirective`, `provideFormContract`,
`createFormFeedbackSignals`, `createDebouncedPendingState`, `NGX_PENDING_LABEL`,
`NGX_VALIDATION_DEBOUNCE_PRESETS`, `ValidationOptions`, `NgxVestSuite`,
`NgxDeepPartial`, `NgxDeepRequired`. Vest comes from `vest` and `vest/memo`.

## Key files

| File | Responsibility |
| --- | --- |
| `async-username.page.ts` / `.html` | Self-contained page + form |
| `async-username.validations.ts` | Suite factory (testable in isolation) |
| `username-availability.service.ts` | HttpClient wrapper → `Observable<boolean>` |
| `../../models/async-username.model.ts` | Model + contract |
| `async-username.content.ts` | "What this demonstrates / learn" cards |

## Behavior

While the remote check runs, `pending()` is true: the control wrapper sets
`aria-busy`, and if the check takes longer than 200ms (`[pendingDebounce]`)
its pending region reads "Checking availability…". When the username is valid
and the check passes, a hint reads "That username is available." A taken name (`admin`, `root`, `support`, `ada`,
`luke`, `taken`, `test`) yields "Username is already taken". Editing the
username aborts any in-flight request and re-runs validation against the new
value, so the result always reflects the latest input. Submitting while
invalid keeps the success panel hidden; a valid submit shows it. Reset
clears both the form and the panel.
