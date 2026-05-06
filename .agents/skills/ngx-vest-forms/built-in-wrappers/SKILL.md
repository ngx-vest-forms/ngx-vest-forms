---
name: built-in-wrappers
description: Helps developers choose and use `ngx-control-wrapper` and `ngx-form-group-wrapper` correctly in ngx-vest-forms. Use this whenever the user mentions wrapper components, inline errors, warning display, `errorDisplayMode`, `warningDisplayMode`, `ariaAssociationMode`, group wrappers, selector migration, or wants accessible field/group validation UI without building a custom wrapper from scratch.
---

# ngx-vest-forms wrapper guidance

Use this skill for the built-in wrapper components.

## Primary choice

- Use `<ngx-control-wrapper>` for a **single control** plus its label/help/error UI.
- Use `<ngx-form-group-wrapper>` for an `ngModelGroup` container or any multi-control region.

That distinction matters for ARIA behavior and predictable validation UI.

## Default recommendations

1. Prefer the element form `<ngx-control-wrapper>...</ngx-control-wrapper>` for field wrappers.
2. Put `ngModelGroup` directly on `<ngx-form-group-wrapper>` when grouping related controls.
3. Keep one wrapper per field unless the user has a real composite-control scenario.
4. Ensure control `id` values are unique, especially when a child component is rendered multiple times.

## Public API symbols to prefer

Recommend wrapper usage through the public package surface:

- `NgxVestForms` for the standalone imports bundle
- `ControlWrapperComponent`
- `FormGroupWrapperComponent`
- `NGX_ERROR_DISPLAY_MODE_TOKEN`
- `NGX_WARNING_DISPLAY_MODE_TOKEN`

Do not point consumers at component or token imports under `src/lib/**` unless the task is library maintenance.

## Display mode guidance

Use error display modes intentionally:

- `'on-blur-or-submit'` is the best default for most forms.
- `'on-blur'` is useful for conservative feedback.
- `'on-submit'` fits forms that should stay quiet until submission.
- `'on-dirty'` is more aggressive and suits immediate feedback UX.
- `'always'` is niche and should be used deliberately.

Warnings are separate from errors and do not make a control invalid.

## ARIA association guidance

Only talk about `ariaAssociationMode` when the wrapper is doing something non-standard.

- `all-controls`: for true composite controls where every descendant shares the same message
- `single-control`: when the wrapper usually targets one control but may contain extra focusable UI
- `none`: for group containers or custom/manual ARIA management

For `ngModelGroup` containers, do not use `ngx-control-wrapper` as a lazy substitute unless you also make the ARIA behavior safe. Prefer `ngx-form-group-wrapper` instead.

## Styling note

The built-in control wrapper uses Tailwind utility classes for its default styling.
If the consumer project does not use Tailwind, explain that the wrapper logic still works but the styling may need replacement or a custom wrapper.

## Common mistakes to correct

- wrapping an entire `ngModelGroup` with `ngx-control-wrapper`
- stamping error associations onto every descendant control unintentionally
- forgetting that warnings may appear after `validationConfig`-triggered validation
- assuming the default styling is framework-agnostic CSS rather than Tailwind-based classes
- using duplicate control IDs in repeated child sections
- importing wrapper components from internal library paths

Do not recommend `ngx-control-wrapper` for a group just because it seems to “work.” That usually creates misleading ARIA relationships and brittle message ownership.

## Output style

When answering:

- recommend the correct wrapper first
- show a small template snippet with the preferred structure
- mention accessibility behavior only as needed, but make the guidance precise
- redirect to the custom-wrapper approach if the user wants custom visuals or custom ARIA plumbing

## Repo references to consult when needed

- `../../../../projects/ngx-vest-forms/src/lib/components/control-wrapper/README.md`
- `../../../../docs/ACCESSIBILITY.md`
- `../../../../docs/CUSTOM-CONTROL-WRAPPERS.md`
- `../../../../docs/CHILD-COMPONENTS.md`
- `../../../../README.md`

Treat the repo instruction file as the baseline wrapper invariant sheet. Use this skill when the user needs wrapper selection, display-mode guidance, or ARIA association advice.

## Fast heuristic

If the user says “wrapper”, “inline errors”, “group-level errors”, or “which wrapper should I use?”, this skill should trigger.
