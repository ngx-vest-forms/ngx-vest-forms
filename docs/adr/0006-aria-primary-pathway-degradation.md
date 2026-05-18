# ARIA primary-pathway degradation in group-safe modes

## Status

Accepted (documented expected behavior)

## Date

2026-05-18

## Context

The control-wrapper's primary accessibility pathway wires `aria-invalid` on the input plus an `aria-describedby` association to the error message. A supplementary live region (`role="status"` / `aria-live="polite"`) announces changes.

Two configurations intentionally suppress the primary pathway:

- `ariaAssociationMode="none"` (the group-safe mode used when a wrapper sits on an `NgModelGroup` container, to avoid stamping `aria-describedby`/`aria-invalid` across every descendant control).
- `single-control` association mode applied to a wrapper that actually contains multiple controls — there is no unambiguous single target, so the per-control association is not stamped.

In both cases the primary `aria-invalid` + `aria-describedby` association is silently disabled, leaving only the supplementary `role="status"` / `aria-live="polite"` live region. Separately, `FormGroupWrapperComponent` provides no `aria-required` mechanism for its group.

The v3 review asked whether this is a defect or expected behavior.

## Decision

Treat this as **documented expected behavior**, not a bug. In `ariaAssociationMode="none"` and in `single-control` mode with multiple controls, the library deliberately does not stamp the primary association; consumers must wire `aria-invalid` / `aria-describedby` (and group `aria-required` for `FormGroupWrapperComponent`) themselves in those configurations.

## Rationale

Auto-stamping `aria-describedby`/`aria-invalid` across all descendants of a group container produces surprising, frequently-incorrect ARIA relationships (the exact failure the group-safe mode exists to prevent). Degrading to the live region in these modes is the safe, predictable default; the supplementary `aria-live="polite"` region still announces validation changes. Forcing a guessed primary target would be worse than requiring an explicit consumer choice.

## Consequences

- In `ariaAssociationMode="none"` and `single-control`-with-multiple-controls, only the polite live region is provided automatically; the primary `aria-invalid` + `aria-describedby` association is the consumer's responsibility.
- `FormGroupWrapperComponent` does not emit `aria-required`; consumers needing a required-group semantic must add it themselves.
- The `ACCESSIBILITY.md` guidance (prefer per-field wrappers or `ngx-form-group-wrapper`) remains the recommended way to keep the primary pathway intact.

## Revisit when

- A reliable heuristic or explicit per-control opt-in is designed that can target the correct control inside a multi-control wrapper without the descendant-stamping hazard, or `FormGroupWrapperComponent` gains a first-class group-required input.
