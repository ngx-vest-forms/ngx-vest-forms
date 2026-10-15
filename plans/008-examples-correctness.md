# Plan 008: Fix bugs and misleading code in the examples app

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Honor the STOP conditions. Update the status row in
> `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 40e38f77..HEAD -- apps/examples`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (E1 changes how two pages render conditional fields)
- **Depends on**: none (e2e for E1 lands with this plan)
- **Category**: bug
- **Planned at**: commit `40e38f77`, 2026-10-15

## Why this matters

The examples are what consumers copy. Each item below either breaks at
runtime or teaches a pattern the library docs warn against.

## Current state and steps

### E1: Trigger controls re-created inside `@if` (ADR-0004)

ADR `docs/adr/0004-validation-config-trigger-control-recreation-unsupported.md`:
a validationConfig trigger control that is destroyed and re-created stops
driving dependent revalidation. The workaround is to keep the trigger mounted.

- `pages/purchase-form/purchase.form.html:46`: `@if (showJustification())`
  wraps `justification`, which is a `bidirectional('quantity','justification')`
  trigger (`purchase.form.ts:222-224`).
- `pages/date-range-adapter/travel.form.html:12`: the approach toggle swaps
  the real `departureDate`/`returnDate` inputs for hidden proxies with the
  same names. The config is `bidirectional('departureDate','returnDate')`
  (`travel.page.ts:45-47`).

Steps:
1. Write an e2e test first for each case. Purchase: set quantity to 6, fill
   justification, set quantity to 3, back to 6, clear justification, then
   change quantity and assert that the justification error state updates.
   Travel: switch the approach twice, then make dates invalid and change
   departure; assert that the return-date error updates.
2. Run them. **If a test passes before any fix, the finding is not real:
   keep the test as a regression guard and skip the fix.**
3. If a test fails, fix it in the example by keeping the trigger mounted
   (hide it with the `hidden` attribute / disabled state), or make the
   conditional field only a dependent (`whenChanged`). Re-run until green.

### E2: Async username check has no debounce and a raw pending flag

- `pages/async-username-form/async-username.form.html:16`: no `[validationOptions]`;
  the field default is `debounceTime: 0` (library `form-model.directive.ts`).
  Purchase does it right: `purchase.form.ts:88-91` uses
  `NGX_VALIDATION_DEBOUNCE_PRESETS.async`.
- `:25` renders `@if (feedback.pending())`, which flickers on fast checks.

Step: add `[validationOptions]="{ debounceTime: presets.async }"` (inject the
presets token as purchase does), and drive the "Checking availability…" text
from `createDebouncedPendingState` (exported by the library; see
`packages/ngx-vest-forms/src/lib/utils/pending-state.utils.ts` for the
signature). Update the page's content/README to explain both.

### E3: Dead `triggerValidation()` on conditional-structure

`conditional-structure.form.ts:49-51` defines it; nothing calls it. The page
content (`conditional-structure.content.ts:10,22`) tells readers to call
`triggerFormValidation()` after structural changes. Decide by reading
`.claude/skills/ngx-vest-forms/dynamic-form-behavior/SKILL.md`: when an
ordinary input swap does not need it, delete the method and reword the content
to describe when it is needed (structure changes with no value change).

### E4: Phone list sorts keys as strings

`ui/phonenumbers/phonenumbers.component.html:3` uses `values() | keyvalue`,
so 11+ numbers render 0, 1, 10, 2. `business-hours.component.ts:29-33` already
has a numeric comparator `byNumericKey`. Use the same in phonenumbers and
extend `phonenumbers.component.spec.ts` with an 11-entry ordering case.

### E5: Unguarded storage in the auto-save service

`pages/auto-save-demo/auto-save-demo.service.ts:81-87` (`#storage` getter)
and every `getItem`/`setItem`/`removeItem` can throw `SecurityError` when
storage is blocked. Wrap them in try/catch returning `null`, as
`services/theme.service.ts:62-81` does.

### E6: Dead code

- `pages/zod-schema-demo/zod-schema-demo.validations.ts:19` `zodFormSchema`:
  no importer. The bound contract is in `models/zod-schema-demo.model.ts`.
  Delete it and fix `zod-schema-demo/README.md:32`.
- `pages/purchase-form/swapi.service.ts:17-19` `searchUserById`: no caller.
  Delete it.

### E7: Shell accessibility

- `app.component.html:49`: the drawer transition ignores reduced motion; add
  `motion-reduce:transition-none` (PRODUCT.md requires it).
- `ui/theme-switcher/theme-switcher.component.html`: static
  `aria-label="Toggle theme"`. Bind the label to the action ("Switch to light
  theme" / "Switch to dark theme").

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Unit | `pnpm nx run examples:test` | pass |
| Build | `pnpm nx run examples:build` | exit 0 |
| Lint | `pnpm nx run-many -t lint,lint-templates -p examples examples-e2e` | exit 0 |
| E2E | `browser-tests examples-e2e e2e -- --project=chromium` | pass |

## Done criteria

- [ ] E1 tests exist; their pre-fix result is recorded in `plans/README.md`
- [ ] `grep -rn "zodFormSchema\|searchUserById\|triggerValidation()" apps/examples/src` returns nothing
- [ ] build, unit, lint and chromium e2e pass

## STOP conditions

- E1 cannot be fixed in the example without a library change: record it and
  leave a page note linking ADR-0004.
