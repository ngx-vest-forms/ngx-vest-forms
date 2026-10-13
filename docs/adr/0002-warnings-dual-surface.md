# Warnings dual-surface kept for v3

## Status

Accepted (deferred cleanup)

## Date

2026-05-18

## Context

Vest advisory rules (`warn()`) are surfaced through two parallel channels in the runtime:

1. `extractFieldErrors` in the Vest runner embeds a `warnings` array **inside** the Angular `ValidationErrors` object the async validator returns, so a control's `control.errors.warnings` carries the field's warning messages.
2. `FormDirective` additionally mirrors the same warnings into a reactive, per-field `fieldWarnings` signal.

The v3 review (Vest cluster, issue M1) flagged this as duplicate state: the same warning data lives in two places with two update paths, which is a cleanliness/maintainability concern (MEDIUM severity, not a correctness bug).

The `control.errors.warnings` surface is not incidental — it is the established contract that the built-in control-wrapper warning display reads, it is covered by tests, and it is documented public behavior that consumers rely on for custom wrappers.

## Decision

Keep both surfaces for v3:

- Retain the embedded `control.errors.warnings` array produced by `extractFieldErrors`.
- Retain the `fieldWarnings` signal on `FormDirective` as the recommended template path.

Consolidating to a single source of truth is a deliberate, breaking API change deferred to a future major.

## Rationale

Changing or removing the embedded `control.errors.warnings` surface mid-v3 would break the documented warning-display contract that the control-wrapper and consumer-authored custom wrappers depend on. The cost of a breaking change to a tested, public behavior outweighs the benefit of resolving a MEDIUM-severity internal-cleanliness issue inside the v3 line.

## Consequences

- Two write paths for warnings remain; contributors must keep `extractFieldErrors` and the `fieldWarnings` mirror in sync when touching warning logic.
- Documentation continues to recommend the `fieldWarnings()` signal for template consumption while acknowledging `control.errors.warnings` as a supported read surface.
- A future major can collapse to a single source without v3-line churn.

## Revisit when

- The next major (v4) is planned, where a breaking change to the warning surface is acceptable. At that point, choose one canonical source (preferring the `fieldWarnings` signal) and remove the embedded `control.errors.warnings` channel, updating the control-wrapper and migration guide accordingly.
