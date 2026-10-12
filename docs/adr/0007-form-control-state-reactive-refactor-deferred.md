# FormControlStateDirective reactive refactor deferred

## Status

Accepted (deferred — known limitation, not implemented in v3)

## Date

2026-05-18

## Context

The v3 review (Angular axis, findings C1/C2) flagged `FormControlStateDirective`
as deriving control state through a combination of an `effect()`, a manual
`statusChanges` subscription, and a per-frame `afterEveryRender` hook. Three
independent writers update the state signal, which is a code-quality / latent
race-window concern (the directive works correctly today, but the design is
fragile and hard to reason about).

A reactive refactor was attempted: collapse the three writers into a single
`computed()` reading the control snapshot, driven by one `statusChanges`
subscription bumping a version signal, with a bounded `afterEveryRender`
syncing only interaction (touched/dirty) changes.

That refactor preserved all unit-tested behavior (full unit suite green) but
introduced a **real, user-facing regression** caught only by the end-to-end
suite: on forms with dynamically added/removed `NgModelGroup` members
(e.g. the complex-nested example), validation never settled. The refactor
needed an "errors-reference watcher" — bump the version signal whenever
`control.errors` changed identity — to keep NgModelGroup cross-field
validation working. Because the Vest runner returns a **fresh** errors object
on every validation pass, that watcher fired every render, re-invalidated the
derived state, and produced a render/validation oscillation that never
stabilized. The regression reproduced deterministically across Chromium,
Firefox and WebKit; the pristine `release/v3` baseline passed the same tests.

## Decision

**Revert the reactive refactor.** `FormControlStateDirective` retains its
known-good baseline implementation (effect + `statusChanges` subscription +
`afterEveryRender`). The C1/C2 concern is recorded here as a deferred,
accepted limitation rather than shipping a refactor that breaks dynamic
nested forms.

All other v3-review fixes (Vest runner, types/public API, the form sync
deadlock fix, diagnostics routing, `afterRenderEffect` ARIA writes, the
shared ARIA-association controller, the `structuredClone`-on-blur gate, the
new tests/docs) are unaffected and remain in place.

## Rationale

C1/C2 is a code-quality / latent-race concern with no observed incorrect
behavior in the shipped directive. The attempted fix traded that latent
concern for a concrete, deterministic, cross-browser breakage of a core
use case (dynamic nested forms). "Don't ship a fix that introduces a worse
regression than the problem it solves" — the same discipline applied to the
other deferred items (see [ADR-0002](0002-warnings-dual-surface.md),
[ADR-0003](0003-validation-config-cooldown-can-drop-rapid-input.md),
[ADR-0004](0004-validation-config-trigger-control-recreation-unsupported.md)).
A correct reactive design must avoid coupling state invalidation to the
identity of the per-run errors object.

## Consequences

- `FormControlStateDirective` keeps the multi-writer (effect + subscription +
  `afterEveryRender`) design. It is correct in practice but remains the
  fragile shape the review flagged; future maintainers should treat changes
  to its state derivation with care and run the e2e suite (the unit suite did
  not catch the oscillation).
- No public API or behavior change for consumers.

## Revisit when

- A reactive redesign is prototyped that derives control state without
  invalidating on the per-run `control.errors` object identity (e.g. by
  comparing error *content*, or by sourcing errors from a stable signal), and
  is validated against the end-to-end suite (specifically the
  dynamically-structured forms: complex-nested, conditional-structure) — not
  only the unit suite.
