# custom wrapper patterns

Use this reference when a user wants custom presentation but still needs ngx-vest-forms state, accessibility wiring, and pending/error behavior to stay correct.

## Pick the right directive

### `FormErrorDisplayDirective`

Use this when the wrapper needs:

- error and warning signals
- pending / touched / dirty / valid / invalid state
- custom rendering controlled entirely by the component

This is the lighter primitive.

### `FormErrorControlDirective`

Use this when the wrapper also needs:

- stable region IDs
- automatic `aria-describedby` merging
- `aria-invalid` management
- less manual accessibility plumbing

This is usually the safer default for production custom wrappers.

## Recommended structure

1. Create a wrapper component with content projection.
2. Compose the directive with `hostDirectives`.
3. Inject the directive with `inject(..., { self: true })`.
4. Keep message regions stable and predictable.
5. Use polite field-level messaging unless the issue is truly form-blocking.

## ARIA guardrails

Preserve these invariants:

- do not clobber consumer-provided `aria-describedby`
- avoid stamping the same error region onto unrelated descendant controls
- reserve `role="alert"` for blocking situations, not ordinary inline field errors
- for multi-control containers, prefer manual targeting or `ariaAssociationMode="none"`

## Pending-state guidance

Use `createDebouncedPendingState()` when async validation is quick enough to flicker.
This improves perceived stability and reduces distracting flashes of “Validating…”.

## Utilities for advanced cases

Use the public ARIA helpers if the component needs manual control over associations:

- `parseAriaIdTokens`
- `mergeAriaDescribedBy`
- `resolveAssociationTargets`

## Common anti-patterns

- building a custom wrapper but re-implementing all state management from scratch
- using assertive alerts for every inline field error
- forgetting that wrappers around multiple inputs need different ARIA behavior than wrappers around a single input
- rendering transient IDs or unstable regions that break screen-reader references
