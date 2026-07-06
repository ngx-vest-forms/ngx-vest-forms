# validationConfig cooldown can drop rapid trigger-field input

## Status

Superseded (2026-07-06) — the drop no longer exists; see "Superseded by" below.

## Date

2026-05-18

## Context

`validationConfig` lets a field's validation re-run when another (trigger) field changes. To stop a dependent-field revalidation from feeding back into the trigger field and causing a bidirectional re-entry loop, the implementation uses a time-based guard: a `validationInProgress` flag held open for `validationInProgressCooldownMs`.

The v3 review (Vest cluster, issue H2) found that this time window cannot distinguish a *pipeline-induced echo* (the re-entry it is meant to suppress) from a *genuine, rapid user edit* to the trigger field that happens to land inside the same window. As a result, a fast user edit to the trigger field within the cooldown can be suppressed and not propagate revalidation.

A precise distinction (e.g. correlating the source of each change) was considered, but any attempt to relax the window risks regressing the currently-passing bidirectional-loop / re-entry behavior, which is the more severe failure mode.

## Decision

Retain the time-based `validationInProgressCooldownMs` cooldown design for v3. Document the limitation. Defer a more precise mechanism to a future iteration.

## Rationale

The cooldown reliably prevents the bidirectional loop, which is a correctness issue. Trading that guarantee for finer rapid-input fidelity risks reintroducing the loop. A safer redesign needs a structural change (see "Revisit when"), not a tuning tweak, so it is out of scope for the v3 line.

## Consequences

- Extremely rapid edits to a `validationConfig` trigger field within the cooldown window may not immediately propagate dependent-field revalidation; the dependent field reconciles on the next qualifying change.
- The window is the safe default; consumers tuning `validationInProgressCooldownMs` should understand both failure modes (too short → re-entry loop risk; too long → more dropped rapid input).
- This limitation is linked from the v3 migration guide's "Known limitations (v3)" section.

## Revisit when

- A token / depth-counter redesign is scheduled that tracks re-entry by an explicit causality token or recursion depth instead of wall-clock time. That design must keep the bidirectional-loop regression suite green while removing the rapid-input drop.

## Superseded by

The 3.0.0 release-audit fix (issue #211, finding C-B1) implemented the
structural change anticipated above:

- **Self-induced echoes are now identified precisely**: a synchronous
  `applyingUpdates` re-entrancy flag is set only while the pipeline itself
  calls `updateValueAndValidity` on dependent controls. Emissions observed in
  that window are dropped outright — this alone breaks bidirectional loops.
- **User edits inside the cooldown window are deferred, never dropped**: the
  change is recorded and the revalidation cycle replays once the cooldown
  clears (latest-wins). The same applies to a cycle whose shared dependent was
  skipped because another trigger still held it in cooldown.

The `validationInProgressCooldownMs` window still exists (it gives async
validators time to settle), but it now only *delays* dependent revalidation by
at most one cooldown; it no longer loses input. Covered by regression tests in
`validation-config-pipeline.spec.ts` ("defers a trigger change…",
"revalidates the dependent with the final trigger value…", "replays a cycle
whose shared dependent was skipped…", "does not replay pipeline-induced
emissions…").
