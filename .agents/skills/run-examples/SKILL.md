---
name: run-examples
description: Launch the examples app and drive its forms in a browser to see ngx-vest-forms behave at runtime. Use when asked to run, screenshot or verify a change in apps/examples.
metadata:
  internal: true
---

# Run the examples app

## Launch

```bash
pnpm nx serve examples --port 4317 --host 127.0.0.1 --watch=false --output-style=stream
```

Run it in the background. Without `--watch=false` the dev server builds and then crashes with `EMFILE: too many open files, watch` inside the Claude Code sandbox. Ready line: `Local: http://127.0.0.1:4317/`. The people, username and account APIs are mocked in-app (`mockPeopleApiInterceptor`), so requests never show on the network.

## Drive

Use the Playwright MCP (`browser_run_code_unsafe`) for scripted sweeps. Routes come from `apps/examples/src/app/shared/routes.metadata.ts`.

Flows worth driving:

- Every route: load, collect `console` errors/warnings and `pageerror`, click the form's submit button empty, then check that each `[aria-invalid=true]` control has an `aria-describedby` pointing at non-empty text and that focus moved to the first invalid control.
- `validation-config-demo`: password/confirm and start/end date revalidate each other.
- `async-username`: `taken` shows "already taken" after the mock delay; switching names mid-check must not leave a stale error.
- `conditional-structure`, `purchase` (shipping toggle): hidden branches drop their keys from the Form Value panel.
- `complex-nested`, `business-hours`: add/remove rows; keys are stable and never reused (sparse keys are by design).
- `auto-save-demo`: blur saves a draft to sessionStorage and a reload restores it.
- `date-range-adapter`: toggle the approach twice, then edit one date; the other must revalidate.
- `submission-patterns`: the scenario picker covers 409/server/network errors.

The sidebar's "Form Value" panel (`h2` "Form Value" + next sibling) is the quickest way to read the model.

## Gotchas

- A Playwright `click()` adds enough delay to hide same-tick races. To probe submit timing, set values and call `button.click()` in one `page.evaluate`, as `fillAndSubmitInOneTick` in `apps/examples-e2e/helpers/form-helpers.ts` does.
- Custom controls (`custom-controls`) are only found through the wrapper's invalid class, which renders after the submit, so check focus on the _first_ submit, not a repeat.
- Browser targets need the `browser-tests` wrapper outside the sandbox: `browser-tests examples-e2e e2e -- <spec> --project=chromium`.
- Stop the server and close the browser when done; `.playwright-mcp/` is gitignored.
