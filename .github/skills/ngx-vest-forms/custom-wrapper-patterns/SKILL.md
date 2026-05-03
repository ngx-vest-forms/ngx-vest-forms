---
name: custom-wrapper-patterns
description: Helps developers build custom ngx-vest-forms wrappers with `FormErrorDisplayDirective`, `FormErrorControlDirective`, ARIA utilities, and debounced pending UI. Use this whenever the user wants a custom control wrapper, design-system integration, Material/Prime/custom styling, hostDirectives-based error components, manual `aria-describedby` behavior, stable error IDs, or wants to replace the built-in wrapper UI while keeping ngx-vest-forms behavior.
---

# ngx-vest-forms custom wrapper guidance

Use this skill when the built-in wrapper is not enough and the user needs custom presentation.

## Choose the right primitive

- Use `FormErrorDisplayDirective` when the user wants control-state signals and will handle the rest of the UI themselves.
- Use `FormErrorControlDirective` when they also want automatic ARIA wiring, stable region IDs, and managed `aria-describedby` / `aria-invalid` behavior.

If in doubt, prefer `FormErrorControlDirective` for production custom wrappers because it reduces accessibility footguns.

## Public API symbols to prefer

Recommend these imports from `'ngx-vest-forms'` when building custom wrappers:

- `FormErrorDisplayDirective`
- `FormErrorControlDirective`
- `createDebouncedPendingState`
- `mergeAriaDescribedBy`
- `parseAriaIdTokens`
- `resolveAssociationTargets`
- `AriaAssociationMode`

Do not tell consumers to import custom-wrapper primitives from internal library files.

## Recommended composition pattern

1. Create a wrapper component with content projection.
2. Apply the directive through `hostDirectives`.
3. Inject the directive with `inject(..., { self: true })`.
4. Render stable message regions in the template.
5. Keep inline errors and warnings polite; reserve assertive alerts for true form-level blocking errors.

## Pending state guidance

Use `createDebouncedPendingState()` when async validation can flash quickly.
That keeps “Validating…” from flickering and gives users steadier feedback.

## ARIA behavior to preserve

When building custom wrappers, preserve these invariants:

- do not clobber consumer-provided `aria-describedby`
- keep IDs stable and predictable
- set `aria-invalid` only when errors are actually meant to be shown
- avoid stamping control-level ARIA onto whole groups of descendants unless that is explicitly correct

Use these public utilities when you need fine-grained control:

- `parseAriaIdTokens`
- `mergeAriaDescribedBy`
- `resolveAssociationTargets`

## Multi-control caution

If the custom wrapper surrounds a group or composite container, do not blindly behave like a single-control wrapper.
Use `ariaAssociationMode="none"` or equivalent manual targeting when the region contains multiple inputs.

## Common mistakes to fix

- using `role="alert"` for every inline field error
- removing message regions from the DOM in a way that breaks `aria-describedby` stability
- hand-rolling ARIA merging when `FormErrorControlDirective` already solves it
- forgetting `self: true` injection for the composed directive
- showing raw pending state without debounce in a UI that validates frequently
- importing wrapper directives or ARIA helpers from `src/lib/**`

Do not improvise new ARIA plumbing when the public directives already provide the hard parts. Reinventing this area is how accessible wrappers quietly become inaccessible wrappers.

## Output style

When answering:

- give a hostDirectives-based wrapper component unless the user requests another pattern
- explain which directive you chose and why
- include the minimum accessible template structure needed for errors, warnings, and pending state
- mention ARIA utilities only when the user’s scenario is advanced enough to justify them

## Repo references to consult when needed

- `references/patterns.md`
- `../../../../docs/CUSTOM-CONTROL-WRAPPERS.md`
- `../../../../docs/ACCESSIBILITY.md`
- `../../../../docs/CHILD-COMPONENTS.md`
- `../../../../projects/ngx-vest-forms/src/public-api.ts`
- `../../../../projects/ngx-vest-forms/src/lib/components/control-wrapper/README.md`

Treat the repo instruction file as the invariant layer. Use this skill for hostDirectives composition, stable ARIA behavior, and custom presentation decisions.

Start with `references/patterns.md` when the user is choosing between `FormErrorDisplayDirective` and `FormErrorControlDirective`, or when the wrapper’s ARIA behavior is the main risk.

## Fast heuristic

If the user says “custom wrapper”, “design system”, “hostDirectives”, “FormErrorDisplayDirective”, or “I want the same validation behavior with my own UI”, trigger this skill.
