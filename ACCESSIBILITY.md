# Accessibility statement

ngx-vest-forms is an Angular library for template-driven forms with Vest.js validation. Its wrappers decide when a validation message shows, where it renders and how assistive technology learns about it. A mistake there reaches every form in every app that uses the library, so we treat accessibility bugs as bugs, with the same weight as wrong validation results.

This file covers our goals, what we test, the barriers we know about and how to report a new one. For implementation detail, read the [accessibility guide](./docs/ACCESSIBILITY.md).

## Scope

This statement covers two things:

- The published `ngx-vest-forms` package: `<ngx-control-wrapper>`, `<ngx-form-group-wrapper>`, the `ngxErrorControl` directive, `ngxVestForm` submit focus, and the default wrapper styles.
- The [examples app](https://ngx-vest-forms.github.io/ngx-vest-forms/) in `apps/examples`. It is a reference for how to build forms with the library, so its forms must be correct accessibility examples.

Your application owns the rest of the page: labels, layout, colours on your backgrounds, custom controls, and any error summary you render. The library cannot make an inaccessible form accessible.

## Goals

We target [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA for everything the library renders. That is a target, not a conformance claim. Nobody has done a dated, scoped WCAG evaluation of this library or the examples app.

What we focus on:

- **Error association.** The control that has an error gets `aria-invalid="true"`, and its `aria-describedby` points to the message. Both appear only while the message is visible, so a screen reader does not say "invalid" before the user has done anything.
- **Calm announcements.** Field messages render in `role="status"` regions with `aria-live="polite"`. They stay in the DOM and only their text changes, so screen readers announce them reliably and do not interrupt typing. While an async rule runs again, the last result stays in place until the new one settles.
- **Keyboard recovery after submit.** When a submit fails, `ngxVestForm` waits for async validation to finish, then moves focus to the first visible invalid control.
- **Custom controls.** A `ControlValueAccessor` that uses an ARIA form-widget role, such as `role="radiogroup"` or `role="combobox"`, gets the same error association as a native `<input>`. See [ADR-0010](./docs/adr/0010-aria-association-targets-aria-form-widgets.md).
- **Readable defaults.** The default error, warning and pending text colours have a contrast ratio of at least 4.8:1 on white, and at least 6.4:1 on `#111827` in dark mode. The pending spinner stops turning under `prefers-reduced-motion: reduce`.

## Supported environments

| Area                                | What we support and test                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Angular                             | `>=22.0.0 <23.0.0`, as in the package `peerDependencies`                                                                                          |
| Browsers                            | Current Chromium, Firefox and WebKit, on desktop                                                                                                  |
| Mobile                              | Not tested. The mobile Playwright projects are turned off, and we have not checked touch input or mobile screen readers.                          |
| Automated tests, every pull request | Unit tests, ARIA browser tests in Chromium (`*.browser.spec.ts`), and the Playwright E2E suite on the examples app in Chromium                    |
| Automated tests, nightly            | The same E2E suite in Firefox and WebKit (`.github/workflows/e2e-cross-browser.yml`)                                                              |
| Input                               | Keyboard and pointer. The E2E suite checks where focus goes after submit, and drives the custom controls and composite adapter with the keyboard. |
| Assistive technology                | We design for VoiceOver, NVDA and JAWS. We have no published, dated screen reader test results for the current release.                           |

We do not run an automated rule checker such as axe-core in CI at this time.

## Known limitations

Each item says what a user notices, why, and what you can do about it.

1. **In some wrapper modes, a screen reader does not say "invalid" when focus reaches the field.** With `ariaAssociationMode="none"`, or a `single-control` wrapper around more than one control, the library does not set `aria-invalid` or `aria-describedby`. Screen reader users then hear the message from the live region but not when they focus the control. Use one `<ngx-control-wrapper>` per control and `<ngx-form-group-wrapper>` for groups, or set the attributes yourself. See [ADR-0006](./docs/adr/0006-aria-primary-pathway-degradation.md).
2. **A screen reader does not say that a required group is required.** `<ngx-form-group-wrapper>` does not set `aria-required`, and `aria-required` is not valid on a `fieldset` or `role="group"` element. Say that the group is required in its `<legend>`, and mark each required control with `required` or `ariaRequired`. For a custom radio group, set `aria-required="true"` on the `role="radiogroup"` element.
3. **A screen reader does not say that a field is required unless you mark it.** The library never reads `required` from your Suite, because many fields are required only under some conditions. Set native `required` or `ariaRequired` on the wrapper for fields that are always required. For conditional fields, describe the condition in the label or hint text.
4. **A screen reader can say "invalid" before the user types anything.** When a field has no errors, the library removes `aria-invalid` instead of setting it to `"false"`. Web platform guidance reports that Firefox and Safari expose an empty native `required` field as invalid from page load. We have not reproduced this in our own tests. If you see it, use `ariaRequired` on the wrapper instead of the native `required` attribute.
5. **A screen reader can say "Validating…" during a slow check.** When an async rule runs for more than 500 ms, the wrapper shows "Validating…" in a polite live region, and some screen readers read it. Raise the delay with `[pendingDebounce]`, change the text with `NGX_PENDING_LABEL`, or build your own wrapper (see [custom control wrappers](./docs/CUSTOM-CONTROL-WRAPPERS.md)).
6. **Message text can be hard to read on your own backgrounds.** We measure the default colours against white and against `#111827`. On other backgrounds, check the contrast and set the `--ngx-control-wrapper-*-color` custom properties.
7. **Focus can jump twice after a failed submit.** If your app focuses its own error summary after a failed submit, set `[focusFirstInvalidOnSubmit]="false"` on the form. If you do not, focus can move twice.

## Report a barrier

If something in the library or the examples app stops you, or a user of your app, from completing a task, tell us. We treat a barrier report as expert knowledge about the project. You do not need to tell us about a disability or a diagnosis. Screenshots and recordings are optional.

1. Open an [accessibility issue](https://github.com/ngx-vest-forms/ngx-vest-forms/issues/new?template=accessibility.yml). The form asks for the details below.
2. Tell us what you tried to do and what happened instead. If you can, also add:
   - The steps that cause the problem.
   - The examples page, or a short template snippet.
   - The `ngx-vest-forms` version.
   - Your operating system, browser and assistive technology, with versions.

You do not need to choose a severity. We do that when we sort the issue.

If you cannot use GitHub issues, start a [discussion](https://github.com/ngx-vest-forms/ngx-vest-forms/discussions) or ask someone to open the issue for you. Report security problems through [SECURITY.md](./SECURITY.md), not as an accessibility issue.

## How we respond

- We reply to a new accessibility issue within 7 days and label it `accessibility`.
- When we sort the issue, we give it a severity and a target date. We fix it on `master` first. Because an accessibility barrier is a bug, we can also bring the fix to `release/v2.x`.
- We tell you what happens next. If a workaround exists, we post it in the issue while the fix is in progress.
- We comment on the issue when its status or plan changes.
- We link each fix to its issue and name it in the release notes. We can ask you to confirm that the fix removes the barrier before we close the issue.
- If we decide not to fix a barrier, we say why in the issue and add it to the known limitations above, with a workaround.

### Severity and target dates

The target starts on the day the issue is opened. If we cannot meet it, we say why in the issue, post any workaround, and give a new date.

| Severity | What it means                                                                                                                                  | Example                                                                         | Fix target |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------- |
| Critical | A user cannot complete a form with a keyboard or a screen reader, and no workaround exists. This includes wrong ARIA state set by the library. | Focus does not move after a failed submit, and the error text is not announced. | 30 days    |
| Serious  | The user can finish the task, but only with a workaround, much extra effort, or missing information.                                           | The error is announced, but not when focus reaches the field.                   | 60 days    |
| Moderate | The task works, but the experience is confusing or not the same across browsers or assistive technologies.                                     | One browser announces the same error twice.                                     | 90 days    |
| Minor    | Small effect on use: wording, a default value, or the documentation.                                                                           | The accessibility guide gives an old attribute name.                            | 90 days    |

## For contributors and coding agents

A change to the wrappers, the ARIA association code, submit focus, the default styles or the examples app must keep the goals above. Before you open a pull request:

- Read the [accessibility guide](./docs/ACCESSIBILITY.md), [ADR-0006](./docs/adr/0006-aria-primary-pathway-degradation.md) and [ADR-0010](./docs/adr/0010-aria-association-targets-aria-form-widgets.md).
- Add or update a test for ARIA behaviour you change: a `*.browser.spec.ts` in the library, or an E2E spec in `apps/examples-e2e`. Assert roles, `aria-*` attributes and focus, not CSS classes.
- Use native HTML first. Use ARIA only where HTML has no equivalent.
- Keep field messages in mounted `role="status"` regions. Do not use `role="alert"` for inline field messages. It is for blocking post-submit summaries only.
- Do not derive `required` or `aria-required` from a Suite.
- Check every changed page in the examples app with the keyboard only:
  - <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> reach every control in a logical order.
  - Focus is always visible.
  - Every action works with <kbd>Enter</kbd>, <kbd>Space</kbd> and, where a widget expects them, the arrow keys.
  - Focus never gets stuck in a control, popover or dialog.
  - After a failed submit, focus lands on the first invalid control.
- Run a manual scan of every changed page with [axe DevTools](https://www.deque.com/axe/devtools/) or [Accessibility Insights](https://accessibilityinsights.io/). Fix what it finds, or explain in the pull request why you cannot. A clean scan does not prove that the page is usable.
- For a new component or a new kind of message, check with a screen reader if you can: the control has a clear name, its role and state are announced, and a new error is announced once.
- In docs and examples pages, keep the heading levels in order, use real lists and tables with headers, write link text that names the target, give images useful alternative text, and never use colour as the only signal. Content must reflow at 200% zoom and at narrow widths.
- In the pull request, say what you tested by hand: browser, keyboard, and screen reader if you used one. "Not tested with a screen reader" is a fine answer. We want the facts.
- Run `pnpm verify`.

Coding agents get the same rules through `AGENTS.md` and the `ngx-vest-forms` skill. An agent must not mark accessibility work as tested with assistive technology unless a person did that test.

## Ownership and feedback

The ngx-vest-forms maintainers own accessibility for the library and the examples app. The maintainer who sorts new issues does this work:

- Sort each accessibility issue, and give it a severity and a target date.
- Track open barriers, and keep the known limitations in this file current.
- Post status updates on the issue, and tell the other maintainers when a target date is at risk.
- Keep this statement and the [accessibility guide](./docs/ACCESSIBILITY.md) current.

We review this statement for each major or minor release and when a known limitation changes. If the maintainer team changes, the new team takes over this work.

If any part of it is wrong or out of date, open an issue or a pull request against this file.

Last reviewed: 2026-11-23.
