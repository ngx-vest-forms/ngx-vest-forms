# Plan 005: Fix formValueChange dropping programmatic updates to disabled controls

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d1818c64..HEAD -- packages/ngx-vest-forms/src/lib/directives/form.directive.ts packages/ngx-vest-forms/src/lib/directives/form.directive.spec.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.
>
> **Working-tree check (run first, too)**: `git status --porcelain -- packages/ngx-vest-forms/src/lib/directives/form.directive.spec.ts`
> At plan time this file already had UNCOMMITTED modifications from another
> agent (in-flight `waitFor()` refactors). Those changes are not yours:
> never `git checkout`/`git restore`/`git stash` the file (that would
> destroy their work), and never commit their hunks. See "Git workflow" for
> how to stage only your own changes.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `d1818c64`, 2026-10-13
- **Issue**: https://github.com/ngx-vest-forms/ngx-vest-forms/issues/246
- **State**: TODO — tracked as issue #246 (self-contained bug report; ready to execute)

## Why this matters

The `formValueChange` output documents "It also contains the disabled values
(raw values)" (form.directive.ts:470), but its pipeline applies
`distinctUntilChanged` to the **enabled-only** `ValueChangeEvent.value`
BEFORE merging raw values. A programmatic `setValue()` on a disabled control
fires a form-level `ValueChangeEvent` whose enabled-only `.value` is
deep-equal to the previous one, so the event is deduped away and the merged
value — which would contain the new disabled value — is never emitted.
Consumers relying on the documented contract silently miss the update.

Verified against the Angular 22.2.2 source in
`node_modules/@angular/forms/fesm2022/forms.mjs`: `FormControl.setValue()`
calls `this.updateValueAndValidity(options)` unconditionally (no `enabled`
check), which emits the control's events and propagates to the parent
`FormGroup`, re-emitting a form-level `ValueChangeEvent` computed from
enabled controls only.

## Current state

- `packages/ngx-vest-forms/src/lib/directives/form.directive.ts:474-485`
  (doc comment at 468–473 promises the output "also contains the disabled
  values (raw values)"):

  ```ts
  readonly formValueChange = outputFromObservable(
    this.ngForm.form.events.pipe(
      filter((v) => v instanceof ValueChangeEvent),
      map((v) => (v as ValueChangeEvent<unknown>).value),
      distinctUntilChanged((prev, curr) => {
        // Use efficient deep equality instead of JSON.stringify for better performance
        return this.#equal(prev, curr);
      }),
      map(() => mergeValuesAndRawValues<T>(this.ngForm.form)),
      takeUntilDestroyed(this.#destroyRef)
    )
  );
  ```

- `mergeValuesAndRawValues` is imported at form.directive.ts:77; `#equal`
  is the directive's private deep-equality helper.
- `packages/ngx-vest-forms/src/lib/directives/form.directive.spec.ts` test
  pattern: a test component with
  `<form ngxVestForm #vest="ngxVestForm" [formValue]="formValue()" (formValueChange)="formValue.set($event)">`,
  rendered with `render()` from `@testing-library/angular`; the directive is
  accessed via `viewChild.required<FormDirective<...>>('vest')` and the form
  via `instance.vestForm().ngForm.form.get('field')` (`ngForm` is public,
  form.directive.ts:204). See the outputs test at line 840 and the fieldBlur
  test at ~line 858 for the exact shape.

Repo conventions: standalone test components declared inline in the spec,
`await render(...)`, `fixture.detectChanges()`, `await fixture.whenStable()`,
2-space indent, single quotes.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Filtered tests | `pnpm exec vitest run --config vitest.config.ts form.directive.spec` | exit 0 (all tests in the file, + your new ones) |
| Full test suite | `pnpm nx run ngx-vest-forms:test` | exit 0, no failures (baseline at plan time: 48 files, 679 passed + 2 todo) |
| Lint | `pnpm nx run-many --target=lint,lint-templates` | exit 0 |
| Library build | `pnpm nx run ngx-vest-forms:build --configuration=production` | exit 0 |
| Lib typecheck | `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.lib.json` | exit 0 (verified green at HEAD) |
| Spec typecheck | `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.spec.json` | currently exits 1 with 5 PRE-EXISTING errors (see plan 004's command table); your changes must not add new ones |

(There is no typecheck gate in CI — finding DX-01. Vitest transpiles without
typechecking, so run the tsc commands yourself.)

## Scope

**In scope** (the only files you should modify):
- `packages/ngx-vest-forms/src/lib/directives/form.directive.ts` — the
  `formValueChange` pipeline only
- `packages/ngx-vest-forms/src/lib/directives/form.directive.spec.ts` — new
  tests

**Out of scope** (do NOT touch):
- `mergeValuesAndRawValues` itself (`form-utils.ts`) — plan 004 covers it;
  the two fixes are independent.
- `idle$` and all other outputs, the model→form sync effect, the
  async-validator pipeline, everything else in form.directive.ts.
- Other agents' in-flight work: at plan time, `form.directive.spec.ts`,
  `form-control-state.directive.spec.ts`,
  `form-model-group.directive.spec.ts`, and
  `packages/ngx-vest-forms/src/lib/testing/validation-config.spec.ts` had
  uncommitted modifications from another agent (replacing fixed `setTimeout`
  sleeps with `waitFor()`). Do not touch, revert, or commit their hunks —
  including in `form.directive.spec.ts`, which IS in scope for you (see
  "Git workflow").

## Git workflow

- Branch: `advisor/005-fix-formvaluechange-disabled-drop`
- Commit message style: conventional commits (see `git log`), e.g.
  `fix(v3): replace zone-era detectChanges() calls with zoneless markForCheck()`.
  Use: `fix(v3): emit formValueChange when disabled control values change`
- Do NOT push or open a PR unless the operator instructed it.
- Staging discipline (IMPORTANT): `form.directive.spec.ts` contains another
  agent's uncommitted hunks. Commit `form.directive.ts` normally. For
  `form.directive.spec.ts`, stage ONLY your own hunks (the new tests) with
  `git add -p packages/ngx-vest-forms/src/lib/directives/form.directive.spec.ts`
  and answer `y` only to hunks you authored; leave their hunks unstaged.
  If partial staging is impractical in your environment, STOP and report —
  do not commit their changes and do not revert them.

## Steps

### Step 1: Add a failing test first (TDD)

In `form.directive.spec.ts`, add a test near the outputs tests (model on the
line-840/858 pattern): a host component with a form containing two controls
(`name`, `nickname`) bound with `ngModel`, and a signal capturing
`formValueChange` emissions. Flow:

1. Render; `fixture.detectChanges()`; `await fixture.whenStable()`.
2. Disable `nickname`:
   `instance.vestForm().ngForm.form.get('nickname')?.disable()`.
3. Record the current emission count.
4. Programmatically set the disabled control:
   `instance.vestForm().ngForm.form.get('nickname')?.setValue('updated')`.
5. `await fixture.whenStable()` (plus a microtask flush if needed).
6. Expect `formValueChange` to have emitted the merged value containing the
   disabled value: `{ name: <current name value>, nickname: 'updated' }`.

**Verify it FAILS on current code**:
`pnpm exec vitest run --config vitest.config.ts form.directive.spec` → the
new test is red (no emission — the dedupe drops the event), the rest of the
file stays green.

### Step 2: Fix the pipeline order

Move `distinctUntilChanged` AFTER the merge map, so deduplication runs on
the merged (raw-inclusive) value:

```ts
readonly formValueChange = outputFromObservable(
  this.ngForm.form.events.pipe(
    filter((v) => v instanceof ValueChangeEvent),
    map(() => mergeValuesAndRawValues<T>(this.ngForm.form)),
    distinctUntilChanged((prev, curr) => {
      // Use efficient deep equality instead of JSON.stringify for better performance
      return this.#equal(prev, curr);
    }),
    takeUntilDestroyed(this.#destroyRef)
  )
);
```

Only the pipeline order changes: the filter, the merge call, the comparator,
and `takeUntilDestroyed` stay identical. The
`map((v) => (v as ValueChangeEvent<unknown>).value)` stage disappears — the
event value is no longer needed. Check that the `ValueChangeEvent` import is
still used (it is — the filter).

**Verify**: `pnpm exec vitest run --config vitest.config.ts form.directive.spec`
→ the new test passes, the rest of the file stays green.

### Step 3: Add a dedupe regression test

Pin that moving the dedupe did not break suppression: two consecutive events
that produce the SAME merged value must still emit only once. E.g. after the
fix, call `setValue` on an ENABLED control with its current value (Angular
emits `ValueChangeEvent` even when the value is unchanged) → the emission
count stays the same (dedupe on the merged value still suppresses it).

**Verify**: filtered vitest run → all pass.

### Step 4: Run the full gates

- `pnpm nx run ngx-vest-forms:test` → exit 0, no failures
- `pnpm nx run-many --target=lint,lint-templates` → exit 0
- `pnpm nx run ngx-vest-forms:build --configuration=production` → exit 0
- `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.lib.json` → exit 0
- `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.spec.json` →
  no NEW errors beyond the 5 pre-existing TS4111 (see plan 004's command
  table for the exact list).

## Test plan

New tests in `packages/ngx-vest-forms/src/lib/directives/form.directive.spec.ts`:
(1) programmatic `setValue` on a disabled control emits `formValueChange`
with the merged value containing the disabled value (the bug); (2) identical
merged values still emit only once (dedupe regression). Structural pattern:
the host-component + `render()` + signal-capture shape used throughout the
file (see line 840 and ~line 858). Verification: the filtered vitest command
→ all pass, then the full suite.

## Done criteria

- [ ] New tests exist and pass (disabled-control emission + dedupe regression)
- [ ] `pnpm exec vitest run --config vitest.config.ts form.directive.spec` → all pass
- [ ] `pnpm nx run ngx-vest-forms:test` → exit 0, no failures
- [ ] `pnpm nx run-many --target=lint,lint-templates` → exit 0
- [ ] `pnpm nx run ngx-vest-forms:build --configuration=production` → exit 0
- [ ] `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.lib.json` → exit 0
- [ ] Spec typecheck error list unchanged (the 5 pre-existing TS4111, no new)
- [ ] Your commit contains only your own changes: `form.directive.ts`
      (fully) and only your own hunks of `form.directive.spec.ts`. The other
      agent's uncommitted hunks in the four spec files remain uncommitted and
      untouched.
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The step-1 test PASSES on current code (the emission already happens) →
  the premise is wrong → STOP and report.
- After the fix, existing `formValueChange` emission tests fail (tests
  asserting emission counts or values) → your reorder changed observable
  behavior beyond the fix → re-read the pipeline and report.
- The fix appears to require touching `mergeValuesAndRawValues` or other
  outputs → STOP; that is plan 004 / out of scope.
- The spec typecheck reports NEW errors beyond the 5 pre-existing ones →
  fix your code, do not "fix" the pre-existing ones.

## Maintenance notes

- The merge now runs on every `ValueChangeEvent` before dedupe (slightly
  more work per event) — this interacts with the PERF-01/PERF-02 clone-cost
  findings; when those are optimized, keep the dedupe AFTER the merge.
- Dedupe semantics changed from "enabled-only value" to "merged raw-inclusive
  value": events that differ only in disabled values now emit (that is the
  fix); events with identical merged values are still suppressed.
- Plan 004 fixes the merged value itself for FormArrays; the two plans are
  independent (different files) but both touch form-value semantics — if
  both land, run the full suite after each.
