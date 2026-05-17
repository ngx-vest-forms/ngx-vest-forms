# Submission Patterns

A realistic account-creation form that models the **four submission
concerns distinctly** so each can be reasoned about and copied on its own.
The page never lets one concern leak into another.

## The four concerns

### (a) Field validation

A plain Vest suite (`submission-patterns.validations.ts`): full name
required, email required + format, password required + min 8 characters
(with a non-blocking `warn()` nudge under 12), and `acceptTerms` must be
true. The suite has no Angular dependency and is unit-testable on its own:
`submissionPatternsSuite({ email: 'x' })`. Errors display on blur via
`ngx-control-wrapper`.

### (b) Submit-time INVALID handling

`onSubmit()` checks `formState().valid` first. When the form is invalid the
server is **never contacted**; instead the page stays in `editing` and calls
`FormDirective.focusFirstInvalidControl()` to scroll to and focus the first
failing control — the exact mechanism used by the Purchase demo. The call is
wrapped in `afterNextRender` so submit-driven validation has flushed before
the first-invalid target is resolved.

### (c) Server FAILURE messaging

Only a valid form reaches `AccountService.createAccount()`. HTTP failures
are caught with `catchError`, the page moves to `server-error`, and the
message renders in an `ngx-alert-panel` with `tone="error"` (which sets
`role="alert"` + `aria-live="assertive"`). A **Retry** button re-submits the
exact same value. Server failure is page state — it never pollutes the Vest
suite.

### (d) SUCCESS state + reset

On 201 the page moves to `success` and a polite success panel echoes the
returned account id with a **Create another** button that resets the form
and returns to `editing`.

These concerns are kept distinct by a single page signal:
`'editing' | 'submitting' | 'server-error' | 'success'`.

## Deterministic demo

The aside scenario picker forces each path through the in-app mock
(`POST /api/account`): Normal (201), Email already taken (sends a `taken`
email → 409), Server error (`?errorScenario=server-error`), and Network
error (`?errorScenario=network-error`).

## Public API used

`NgxVestForms`, `FormDirective` (`focusFirstInvalidControl`),
`provideFormContract`, `createFormFeedbackSignals`, `NgxDeepPartial`,
`NgxDeepRequired`, `NgxVestSuite`.

## Key files

| File | Responsibility |
| --- | --- |
| `submission-patterns.page.ts` / `.html` | Page + four-state machine |
| `account.service.ts` | `POST /api/account` HTTP client |
| `submission-patterns.validations.ts` | Vest suite (testable in isolation) |
| `../../models/submission-patterns.model.ts` | Model + contract |
| `submission-patterns.content.ts` | "What this demonstrates / learn" cards |
