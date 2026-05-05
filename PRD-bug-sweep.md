# PRD: Bug fix sweep — lifecycle safety, path utility hardening, state-sync correctness, equality polish

> Synthesized from a code review covering all 30 source files in `projects/ngx-vest-forms/src/lib/`. 12 medium-to-high findings + 7 low. Spot-verified the four highest-impact items against current `master`.

## Problem Statement

Users of `ngx-vest-forms` are exposed to several real, observable defects today:

- **Form data corruption.** `setValueAtPath(form, 'addresses[0].street', 'x')` against a model whose `addresses` is an existing array silently overwrites the whole array with `{}`, destroying every sibling entry. Bracket-notation is broken end-to-end whenever the array already has data.
- **Post-destroy errors and leaked timers.** `setTimeout` in `#updateDependentFields` is never cancelled; `queueMicrotask` after async-validator `done()` calls `cdr.detectChanges()` on potentially-destroyed views (throws `ViewDestroyedError`); a microtask in `validate-root-form` calls `updateValueAndValidity()` after destroy.
- **Stale form state.** When all controls are dynamically removed, `formState().value` returns the previous `linkedSignal` snapshot — consumers see ghost data the form no longer contains.
- **Reactive bindings that do not react.** `[pendingDebounce]` on `form-group-wrapper` is read once at construction; runtime changes are ignored.
- **Behavior contradicting documentation.** `ngxValidateRootFormMode` claims to take precedence over the legacy `validateRootFormMode` attribute but cannot, because both default to `'submit'` — the implementation can't distinguish default from explicit.
- **False-negative diff results.** `fastDeepEqual` truncates at depth 10 and falls back to reference equality, causing legitimate deep form trees to compare unequal — triggering spurious re-renders and breaking `distinctUntilChanged`. Its docstring claim of "circular reference protection" is misleading.
- **Type-validation false negatives.** `validateShape` uses `parseFloat` to detect numeric keys, so `'123abc'` is silently mapped to array index `'0'`; `Date`/`Map`/`Set`/`RegExp`/`File` values are walked as plain records.
- **Path-parsing forgiveness hides bugs.** `parseFieldPath` silently accepts `'a..b'`, `'.a'`, `'a.'`, `'.'` — upstream typos in field-name generation are erased rather than surfaced.

## Solution

Land four bundled fixes that share root causes. Each bundle ships as its own PR with source changes, regression tests, and a CHANGELOG entry.

1. **Bundle A — Destroy-aware async scheduling.** Extract a small utility that wraps `setTimeout` / `queueMicrotask` with automatic cancellation on `DestroyRef`. Replace the bare timing calls in `form.directive` and `validate-root-form.directive` with this primitive plus a destroyed-flag guard before any `ChangeDetectorRef` interaction.
2. **Bundle B — Path utility hardening.** `setValueAtPath` accepts arrays as containers; numeric-vs-string segment decides `[]` vs `{}`. `parseFieldPath` rejects malformed segments with a dev-mode warning. `validateShape` uses `^\d+$` for numeric-key detection and short-circuits non-plain objects (`Date`/`Map`/`Set`/`RegExp`/`File`/`Blob`).
3. **Bundle C — State-sync correctness.** `linkedSignal` resets when controls clear. `pendingDebounce` becomes a reactive signal-accessor input. `form-control-state` retries late-attached `NgModel.control` via `afterNextRender`. `validateRootFormMode` precedence uses `undefined` sentinel default.
4. **Bundle D — Equality & helper polish.** `fastDeepEqual` gets real cycle tracking via `WeakMap` of visited pairs and removes the depth cap. Deprecated `cloneDeep` is removed (delegating callers to `structuredClone`). `field-clearing` switches to `Object.hasOwn`. `mergeValuesAndRawValues` treats `null` target like `undefined`. `getAllFormErrors` returns a discriminated union instead of attaching non-enumerable `warnings` to an empty array. `objectToArrayInternal` fills sparse-key gaps with `undefined`.

## User Stories

1. As a forms consumer, when I call `setValueAtPath(form, 'addresses[0].street', 'x')` on a model whose `addresses` is an existing array, I want the array to be preserved, so my dynamic list isn't silently destroyed.
2. As a forms consumer dynamically removing all controls, I want `formState().value` to reflect an empty form, so my UI doesn't show ghost data.
3. As a forms consumer using `[pendingDebounce]` with a dynamic value, I want changes to propagate at runtime, so my pending-state UX matches my intent.
4. As a forms consumer using `ngxValidateRootFormMode="submit"` while a legacy `validateRootFormMode="live"` attribute coexists, I want the documented `ngx`-prefix precedence to win, so behavior matches the docs.
5. As a forms consumer destroying a directive while async validation is in flight, I want no `ViewDestroyedError`, no leaked timers, and no writes to destroyed signals.
6. As a forms consumer with deep form models (more than 10 levels), I want value-equality checks to be correct, so `distinctUntilChanged` doesn't trigger spurious work.
7. As a forms consumer with circular references in form values, I want equality and clone helpers to either handle cycles correctly or fail predictably.
8. As a forms consumer relying on `validateShape` for runtime model validation, I want keys like `'123abc'` to be flagged as type mismatches, not silently mapped to array index `'0'`.
9. As a forms consumer with `Date`, `Map`, `Set`, or `File` values in my form, I want `validateShape` to recognize them as opaque values rather than walking their enumerable keys.
10. As a forms consumer using `parseFieldPath`, I want malformed paths (`a..b`, `.a`, `a.`) to be rejected, so upstream typos surface immediately rather than producing silently-truncated paths.
11. As a forms consumer using `mergeValuesAndRawValues` with disabled controls whose values are `null`, I want raw values to merge correctly, so submit payloads include them.
12. As a forms consumer using `getAllFormErrors`, I want a clear discriminated shape distinguishing errors and warnings, so I don't have to know about a non-enumerable side-channel.
13. As a forms consumer using `objectToArrayInternal` after a sparse-key write, I want index gaps preserved as `undefined`, so my array indices don't silently shift.
14. As a maintainer, I want destroy-aware scheduling extracted into a single, isolated utility, so future async work in directives uses a safe primitive by default.
15. As a maintainer, I want path-walking primitives behind a hardened deep module with a small surface, so any future feature relying on path manipulation inherits safety.
16. As a maintainer, I want `Object.hasOwn` used in field-clearing comparisons, so prototype keys can never collide with form fields.
17. As a maintainer, I want the deprecated `cloneDeep` removed (or upgraded to delegate to `structuredClone`), so the library has one supported clone path.
18. As a maintainer, I want a sentinel-default `mode` input on `validate-root-form`, so explicit-vs-default is detectable without ambiguity.
19. As a maintainer reviewing PRs, I want regression tests for each bug bundle, so no fix silently regresses.
20. As a maintainer reading the docstring on `fastDeepEqual`, I want "circular reference protection" claims to match implementation, so contributors aren't misled.

## Implementation Decisions

### Modules

- **New deep module: `destroy-scheduler`.** Exposes `scheduleTimeout(callback, delayMs, destroyRef)` and `scheduleMicrotask(callback, destroyRef)`. Both return a no-op cancel function and register `onDestroy` on `DestroyRef`. Pure, single dependency on `@angular/core`'s `DestroyRef`. Testable in isolation without TestBed.
- **Deepen `field-path` + path-walking utilities in `form-utils`.** Single source for parsing and walking dotted/bracket paths. Hardened against arrays-as-containers, malformed segments (dev-mode warn via `ngDevMode`), and prototype-pollution segments (already covered).
- **Deepen `equality`.** Real cycle handling via `WeakMap` visited-pair tracker. Remove `maxDepth` cap. Update JSDoc to match.
- **Harden `shape-validation`.** Numeric-key regex `^\d+$`. Short-circuit when value is `instanceof Date | Map | Set | RegExp | File | Blob`.

### Public API

- `cloneDeep` removal: deprecated path; one minor with runtime warning, then remove. No internal callers should survive Bundle D.
- `parseFieldPath` strictness: behavior change for malformed inputs only. Dev warning + return empty in dev; silent skip in prod (`ngDevMode`-gated, tree-shakable). No signature change.
- `ngxValidateRootFormMode` default: `undefined`. Precedence: `ngx ?? legacy ?? 'submit'`. Runtime behavior unchanged when neither is set; observable difference only when both are explicitly set.
- `getAllFormErrors` return shape: discriminated union for errors vs warnings. Breaking for the side-channel pattern; migrate internal callers in the same bundle.
- `objectToArrayInternal`: sparse-key behavior changes from "collapse" to "fill with `undefined`". Document in CHANGELOG.

### Angular 21 best-practice cross-cuts

- Continue using `inject()`, signal inputs, `linkedSignal`, `computed`, `effect`. No new constructor-DI.
- Prefer `afterNextRender` for one-shot post-render work (e.g. retrying late `NgModel.control` attachment) over polling.
- Use `takeUntilDestroyed(destroyRef)` for observable subscriptions (already widespread). The new `destroy-scheduler` covers only timer-/microtask-based scheduling that observables don't naturally express.
- Document each remaining usage of private Angular APIs (`NgForm._directives`, CVA `_elementRef`) with a TODO referencing this issue.

### TypeScript 5.9 best-practice cross-cuts

- Use `Object.hasOwn` over `key in obj` for own-property checks.
- Prefer `satisfies` over `as` casts where it preserves literal types.
- Discriminated unions for `getAllFormErrors` return shape.
- Internal branded `FieldPath` type to be considered (no public API change). Out of scope as a public type to keep migration cost zero.
- `noUncheckedIndexedAccess` already implied by current code style; ensure new code respects it.

### Bundle landing order

A → C → B → D. Destroy-safety primitive lands first so B/C/D's directive integration tests benefit. C ships next because state-sync bugs are most user-visible today. B and D are correctness/polish for less-frequent paths.

## Testing Decisions

A good test here asserts externally-observable behavior of each utility/state area: no private-method spies, no mocking the unit under test. Each test should pass against any equivalent implementation.

### Test surface per bundle

- **Bundle A — `destroy-scheduler` (unit, no TestBed):** runs callback when not destroyed; cancels callback when `DestroyRef` fires before delay; explicit cancel handle prevents callback even before destroy; multiple schedules on same `DestroyRef` cancel independently.
- **Bundle B — path utilities and shape validation (unit, no TestBed):** set into pre-existing array preserves siblings (regression for the `addresses[0]` bug); numeric-vs-string segments produce arrays vs objects; malformed paths emit dev warning and no-op; prototype-pollution segments still blocked; key `'123abc'` reported as type mismatch (not mapped to `0`); `Date`/`Map`/`Set`/`RegExp`/`File` values short-circuit recursion; existing pass cases still pass.
- **Bundle C — directive integration (TestBed + fake timers):** destroy directive mid-async-validation produces no `ViewDestroyedError`, no leaked timers, no stale signal writes; dynamically removing all controls clears `formState().value` to `null`; `[pendingDebounce]` reflects runtime input changes; `form-control-state` correctly tracks late-attached `NgModel.control`; `ngxValidateRootFormMode` precedence matches docstring across all four default-vs-explicit combinations.
- **Bundle D — equality (unit, no TestBed):** two distinct cyclic objects with same structure compare equal; self-referential objects compare equal to themselves; deep trees (more than 10 levels) compare correctly without depth fallback. Preserve and pin the existing `Map`/`Set`/`Date`/`RegExp` semantics via tests: `Set` compared by size and value membership (`obj2.has(value)` per element); `Map` compared by size, key membership, and recursive `fastDeepEqual` on values; `Date` by `getTime()`; `RegExp` by `source` + `flags`. Add cycle-tracking tests for nested `Map`/`Set` containing recursive references.

### Prior art

The library uses Vitest + Angular TestBed. See existing `*.spec.ts` files adjacent to source in `projects/ngx-vest-forms/src/lib/`. Use the same harness style for directive integration tests; simulate destroy mid-flight via `ComponentFixture#destroy()` and `vi.useFakeTimers()`.

## Out of Scope

- Migrating the library from template-driven forms to Angular signal forms (separate PRD; major architectural shift).
- Replacing `NgForm._directives` and CVA `_elementRef` private-API usage. Tracked separately; document with TODOs in this PRD's PRs.
- Branded `FieldPath` type as a **public** API change.
- Storybook / docs-site updates beyond CHANGELOG entries.
- Performance benchmarking of `fastDeepEqual` after cycle-tracking changes (worth a follow-up if hot-path regressions surface).
- Items not in the original bug review (no scope creep).

## Further Notes

- Baseline: Angular 21.2.11, TypeScript 5.9.3, Vest 5.4.6 (per `package.json`).
- Each bundle is independently revertable, even though they share themes.
- Severity at-a-glance:
  - **High:** `setValueAtPath` array clobber (B); uncancelled `setTimeout` (A); microtask UV&V after destroy (A).
  - **Medium:** `pendingDebounce` ignored (C); mode-precedence (C); ghost form value (C); `detectChanges` after destroy (A); late-attached `NgModel.control` (C); `validateShape` numeric-key regex (B); `validateShape` non-plain values (B); `fastDeepEqual` cycle/depth (D); `parseFieldPath` malformed-segment swallow (B).
  - **Low:** stale `fieldWarnings` writes (A); `cloneDeep` deprecation cleanup (D); `field-clearing` prototype-chain `in` (D); `mergeValuesAndRawValues` `null` target (D); `array-to-object` sparse-key collapse (D); `getAllFormErrors` warnings side-channel (D); `formSubmitted` outside-`NgForm` undocumented (deferred — docs-only).
