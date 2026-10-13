# Plan 004: Fix mergeValuesAndRawValues dropping/misaligning disabled controls inside FormArrays

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d1818c64..HEAD -- packages/ngx-vest-forms/src/lib/utils/form-utils.ts packages/ngx-vest-forms/src/lib/utils/form-utils.spec.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `d1818c64`, 2026-10-13
- **Issue**: https://github.com/ngx-vest-forms/ngx-vest-forms/issues/245
- **State**: TODO — tracked as issue #245 (self-contained bug report; ready to execute)

## Why this matters

`mergeValuesAndRawValues()` promises (its doc comment) to merge raw values so
"we don't lose values of disabled form fields". For FormGroups this works,
but for **FormArrays** it silently corrupts the value. Verified against the
Angular 22.2.2 source in `node_modules/@angular/forms/fesm2022/forms.mjs`:

- `FormArray._updateValue()` =
  `this.controls.filter(control => control.enabled || this.disabled).map(control => control.value)`
  → `form.value` for an array **omits disabled controls** (compacted array).
- `FormArray.getRawValue()` =
  `this.controls.map(control => control.getRawValue())`
  → includes **all** controls, in order.

The merge's `isRecord()` excludes arrays, so the recursive merge never
touches arrays and the compacted array survives: the disabled item is dropped
AND every later item shifts one index left. The merged value feeds
`formValueChange` (form.directive.ts:482), `formState().value`
(form.directive.ts:257), the `fieldBlur` snapshot (form.directive.ts:1101),
and every async-validator model snapshot (form.directive.ts:1325) — so Vest
validates against a wrong model and consumers submit misaligned values.

## Current state

- `packages/ngx-vest-forms/src/lib/utils/form-utils.ts`:
  - line 16: `type UnknownRecord = Record<string, unknown>;`
  - lines 41–43:
    ```ts
    function isRecord(value: unknown): value is UnknownRecord {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    ```
  - `mergeValuesAndRawValues<T>(form: FormGroup): T` (starts ~line 176):
    `structuredClone`s `form.value` and `form.getRawValue()`, then runs
    `mergeRecursive(value, rawValue)`:
    ```ts
    function mergeRecursive(target: UnknownRecord, source: UnknownRecord): void {
      for (const key of Object.keys(source)) {
        if (isUnsafePathSegment(key)) {
          continue;
        }

        const sourceValue = source[key];
        const targetValue = target[key];

        if (targetValue === undefined || targetValue === null) {
          // Key missing from target (e.g. disabled field) or set to null —
          // copy source so raw values from disabled controls aren't dropped.
          target[key] = sourceValue;
        } else if (isRecord(sourceValue) && isRecord(targetValue)) {
          // If the value is an object, merge it recursively
          mergeRecursive(targetValue, sourceValue);
        }
        // If the target already has the key with a primitive value, it's left as is to maintain references
      }
    }
    ```
    Arrays fall through both branches (`isRecord` excludes arrays) → the
    compacted `form.value` array is kept as-is.
  - `isUnsafePathSegment` is already imported from `./field-path.utils`
    (top-of-file import block). Unsafe segments: `__proto__`, `prototype`,
    `constructor`.
- `packages/ngx-vest-forms/src/lib/utils/form-utils.spec.ts`:
  - `describe('mergeValuesAndRawValues function')` starts at line 94, with
    `describe('basic functionality')` inside it.
  - Existing disabled-field tests model the pattern (real `FormGroup` +
    `control.disable()`): lines 98, 131, 171, 243.
  - Unsafe-key merge test at line 718 uses a fake form object cast to
    `FormGroup` — model the new unsafe-key array test on it.
  - `FormArray` is already imported (line 1:
    `import { FormArray, FormControl, FormGroup } from '@angular/forms';`).
  - 45 tests currently pass in this file.
- Consumers of the merged value (do NOT modify): form.directive.ts:257
  (`formState`), :482 (`formValueChange`), :1101 (`fieldBlur`), :1325
  (async-validator snapshot).

Repo conventions: JSDoc on exported utils (including `Security:` notes for
the unsafe-key guard), tests as plain `it(...)` with real Angular controls,
2-space indent, single quotes.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Filtered tests | `pnpm exec vitest run --config vitest.config.ts form-utils.spec` | exit 0 (45 tests at plan time, + your new ones) |
| Full test suite | `pnpm nx run ngx-vest-forms:test` | exit 0, no failures (baseline at plan time: 48 files, 679 passed + 2 todo) |
| Lint | `pnpm nx run-many --target=lint,lint-templates` | exit 0 |
| Library build | `pnpm nx run ngx-vest-forms:build --configuration=production` | exit 0 |
| Lib typecheck | `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.lib.json` | exit 0 (verified green at HEAD) |
| Spec typecheck | `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.spec.json` | currently exits 1 with 5 PRE-EXISTING errors (see below); your changes must not add new ones |

Pre-existing spec typecheck errors at HEAD (do not fix these — out of scope —
but do not add new ones):

```
packages/ngx-vest-forms/src/lib/utils/equality.spec.ts(277,18): error TS4111
packages/ngx-vest-forms/src/lib/utils/equality.spec.ts(278,27): error TS4111
packages/ngx-vest-forms/src/lib/utils/equality.spec.ts(281,16): error TS4111
packages/ngx-vest-forms/src/lib/utils/form-state.utils.spec.ts(88,16): error TS4111
packages/ngx-vest-forms/src/lib/utils/form-utils.spec.ts(492,33): error TS4111
```

(There is no typecheck gate in CI — that is a separate finding, DX-01. Vitest
transpiles without typechecking, so run the tsc commands yourself.)

## Scope

**In scope** (the only files you should modify):
- `packages/ngx-vest-forms/src/lib/utils/form-utils.ts`
- `packages/ngx-vest-forms/src/lib/utils/form-utils.spec.ts`

**Out of scope** (do NOT touch):
- `packages/ngx-vest-forms/src/lib/directives/form.directive.ts` — the
  emission-side fix is a separate plan (005); the two fixes are independent.
- Any consumer of the merged value (`formState`, `formValueChange`,
  `fieldBlur`, async-validator snapshot).
- `field-path.utils.ts`, the public API surface (no signature changes).
- The 5 pre-existing TS4111 spec errors listed above.
- Other agents' in-flight work: at plan time, `form.directive.spec.ts`,
  `form-control-state.directive.spec.ts`,
  `form-model-group.directive.spec.ts`, and
  `packages/ngx-vest-forms/src/lib/testing/validation-config.spec.ts` had
  uncommitted modifications from another agent (replacing fixed `setTimeout`
  sleeps with `waitFor()`). Neither of your in-scope files is affected, but
  do not touch, revert, or commit their files.

## Git workflow

- Branch: `advisor/004-fix-formarray-disabled-merge`
- Commit message style: conventional commits (see `git log`), e.g.
  `fix(v3): replace zone-era detectChanges() calls with zoneless markForCheck()`.
  Use: `fix(v3): keep disabled FormArray values and align indices in mergeValuesAndRawValues`
  and a second commit `test(v3): cover FormArray disabled-control merging` —
  or one commit if you prefer; match repo history.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a failing test first (TDD)

In `form-utils.spec.ts`, inside
`describe('mergeValuesAndRawValues function')` → `describe('basic functionality')`
(after the test at line 98), add:

```ts
it('should keep disabled FormArray items and align indices when merging raw values', () => {
  const form = new FormGroup({
    items: new FormArray([
      new FormControl('a'),
      new FormControl('b'),
      new FormControl('c'),
    ]),
  });

  form.get('items.1')?.disable(); // middle control disabled

  const merged = mergeValuesAndRawValues<{ items: string[] }>(form);
  expect(merged.items).toEqual(['a', 'b', 'c']);
});
```

**Verify it FAILS on current code**:
`pnpm exec vitest run --config vitest.config.ts form-utils.spec` → the new
test is red (current code returns `['a', 'c']`: disabled `'b'` dropped and
`'c'` misaligned at index 1), the other 45 tests stay green.

### Step 2: Implement the fix

In `form-utils.ts`, add an array branch to `mergeRecursive`. When
`sourceValue` is an array, replace `target[key]` with a recursively
sanitized deep copy of the raw (source) array. The raw array is a per-index
superset of the compacted value array (enabled items are identical), so
wholesale replacement restores both the disabled items and the index
alignment. The sanitized copy must skip unsafe keys (`isUnsafePathSegment`)
at every nesting level and recurse into records and arrays.

Suggested shape (adapt to match file style; keep the existing record-merge
and null/undefined branches untouched):

```ts
function sanitizeRawValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeRawValue(item));
  }
  if (isRecord(value)) {
    const copy: UnknownRecord = {};
    for (const key of Object.keys(value)) {
      if (isUnsafePathSegment(key)) {
        continue;
      }
      copy[key] = sanitizeRawValue(value[key]);
    }
    return copy;
  }
  return value;
}
```

and inside `mergeRecursive`, add after the `isRecord` branch:

```ts
} else if (Array.isArray(sourceValue)) {
  // FormArray.value omits disabled controls (compacted array) while
  // getRawValue() returns all controls in order — take the raw array so
  // disabled items are kept and indices stay aligned.
  target[key] = sanitizeRawValue(sourceValue);
}
```

Also update the `mergeValuesAndRawValues` doc comment if needed to state the
array behavior (keep the existing `Security:` note about unsafe keys).

**Verify**: `pnpm exec vitest run --config vitest.config.ts form-utils.spec`
→ all 46 tests pass.

### Step 3: Add the remaining regression tests

Same describe block, modeled on the existing tests:

1. **First control disabled** → indices aligned: controls `['a','b','c']`,
   disable index 0 → merged `['a','b','c']` (today everything shifts).
2. **Fully disabled FormArray** → the full array is present (pins the
   already-working path: `form.value` omits the key entirely, so the
   null/undefined branch copies the raw array).
3. **FormArray of FormGroups with a disabled child control inside one
   group** → nested value complete and aligned, e.g.
   `new FormArray([new FormGroup({ name: new FormControl('x'), nick: new FormControl('y') })])`
   with `nick` disabled → merged
   `{ items: [{ name: 'x', nick: 'y' }] }`.
4. **Unsafe keys inside raw arrays are stripped** — model on the test at
   line 718 using a fake form object cast to `FormGroup`, with a raw array
   containing an own `__proto__` key (build it with `JSON.parse` so it is an
   own property): the merged array must not carry it and
   `({} as Record<string, unknown>)['polluted']` stays `undefined`.

**Verify**: `pnpm exec vitest run --config vitest.config.ts form-utils.spec`
→ all tests pass (45 existing + your new ones).

### Step 4: Run the full gates

- `pnpm nx run ngx-vest-forms:test` → exit 0, no failures
- `pnpm nx run-many --target=lint,lint-templates` → exit 0
- `pnpm nx run ngx-vest-forms:build --configuration=production` → exit 0
- `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.lib.json` → exit 0
- `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.spec.json` →
  compare the error list against the 5 pre-existing TS4111 errors listed
  above; no NEW errors allowed.

## Test plan

New tests in `packages/ngx-vest-forms/src/lib/utils/form-utils.spec.ts`,
inside `describe('mergeValuesAndRawValues function')`, covering: disabled
control in the middle of a FormArray (the bug), disabled first control,
fully disabled FormArray, FormArray of FormGroups with a disabled nested
child, and unsafe-key stripping inside raw arrays. Structural pattern: the
existing test at line 98 (real controls) and line 718 (fake form for
unsafe-key cases). Verification: the filtered vitest command → all pass,
then the full suite.

## Done criteria

- [ ] New FormArray merge tests exist and pass (middle/first/fully-disabled/
      nested/unsafe-key cases)
- [ ] `pnpm exec vitest run --config vitest.config.ts form-utils.spec` → all pass
- [ ] `pnpm nx run ngx-vest-forms:test` → exit 0, no failures
- [ ] `pnpm nx run-many --target=lint,lint-templates` → exit 0
- [ ] `pnpm nx run ngx-vest-forms:build --configuration=production` → exit 0
- [ ] `pnpm exec tsc --noEmit -p packages/ngx-vest-forms/tsconfig.lib.json` → exit 0
- [ ] Spec typecheck error list unchanged (the 5 pre-existing TS4111, no new)
- [ ] `git status --porcelain` shows your two in-scope files (plus the
      other agent's four dirty spec files — leave those untouched)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The step-1 test PASSES on current code (returns `['a','b','c']`) → the
  premise is wrong (Angular behavior differs from the verified source) →
  STOP and report.
- The fix appears to require touching `form.directive.ts` or any consumer →
  STOP; that is plan 005's territory.
- Existing merge tests (lines 98, 131, 171, 243, 718) start failing → your
  change altered pinned behavior → re-read and report.
- The spec typecheck reports NEW errors beyond the 5 pre-existing ones →
  fix your code, do not "fix" the pre-existing ones.

## Maintenance notes

- The merged value feeds `formValueChange` / `formState` / `fieldBlur` /
  async-validator snapshots; future changes to those consumers must assume
  arrays are raw-inclusive and index-aligned.
- The null/undefined branch (`target[key] = sourceValue`) copies raw subtrees
  by reference without unsafe-key stripping — pre-existing behavior pinned by
  tests; if it is ever hardened, do it deliberately with new tests.
- Related findings: plan 005 fixes the emission side (dedupe before merge in
  `formValueChange`); PERF-02 tracks the double-`structuredClone` cost in
  this function. All three touch form-value semantics — if more than one
  lands, run the full suite after each.
