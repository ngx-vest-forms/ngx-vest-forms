# E2E tests for the examples app

Playwright tests for the demo pages in `apps/examples`. Each demo page has its
own folder under `pages/`.

## Layout

```
pages/<page>/<page>.page.spec.ts       layout, navigation, form-state sidebar
pages/<page>/<page>.form.spec.ts       form behaviour and validation
pages/<page>/<topic>.form.spec.ts      extra suites for a page, one file per topic
app/app.page.spec.ts                   app shell
helpers/form-helpers.ts                field, validation and navigation helpers
helpers/wizard-helpers.ts              wizard step helpers
```

Naming rule: every test file ends in `*.spec.ts`. Playwright discovers only
`pages/**/*.spec.ts` and `app/**/*.spec.ts` (see `playwright.config.ts`), so a
file with any other name never runs.

## Running

The examples app is started by Playwright's `webServer` on port 4400. Do not
start it yourself.

```bash
# All browsers (chromium, firefox, webkit) via Nx
pnpm nx run examples-e2e:e2e

# One browser
pnpm nx run examples-e2e:e2e -- --project=chromium

# One file
pnpm nx run examples-e2e:e2e -- --project=chromium pages/purchase-form/purchase.form.spec.ts

# Flake check: repeat a file
pnpm nx run examples-e2e:e2e -- --project=chromium --repeat-each=5 pages/wizard-form/wizard.form.spec.ts
```

Retries: 0 locally, 2 on CI (`CI=true`). A test that passes only on retry is a
flake to fix, not a pass.

Nx caches the e2e target, so re-running with unchanged inputs replays the
cached result. Pass `--skip-nx-cache` to force a real run.

Per-file targets (`e2e-ci--<spec path>`) are inferred by `@nx/playwright`, one
for each spec file.

## Writing assertions

- Use web-first matchers (`toBeVisible`, `toHaveAttribute`,
  `toHaveAccessibleDescription`, `toBeChecked`, `toBeEnabled`). They retry
  until the condition holds, so do not add sleeps.
- Every assertion has to be able to fail. Do not guard an assertion with
  `if (element exists)`: assert that the element exists first.
- Use `pressSequentially` for real typing and `fill` only for date or
  non-text inputs. `type()` is deprecated.
- Wait for a condition the page exposes (for example `aria-busy`, a visible
  heading, or the expected error text), not for a fixed time.

## Helpers

- `expectFieldHasError(field, text?)` and `expectFieldValid(field)` wait for
  the Angular state (`ng-invalid`/`ng-valid`) and the error text.
- `fillAndBlur(field, value)` types a value and blurs the field.
- `waitForValidationToSettle(page)` waits until no field is busy.
- `getWarningElementFor(field, pattern)` returns the warning element for a field.

## Accessibility

Tests check `aria-invalid`, `aria-describedby`, and `aria-busy` where the page
sets them. `expectFieldHasError` and `expectFieldValid` assert `aria-invalid`
as a hard check; a missing or stale `aria-invalid` fails the test.

## Debugging

- `pnpm nx run examples-e2e:e2e -- --project=chromium --headed --workers=1`
- `pnpm exec playwright show-report` opens the HTML report with traces.
- Failed tests keep a screenshot and a video in `test-results/`.
