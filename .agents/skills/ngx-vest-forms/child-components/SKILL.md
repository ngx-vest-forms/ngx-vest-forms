---
name: child-components
description: Helps developers split ngx-vest-forms forms into child components without breaking the parent form tree. Use this whenever the user mentions reusable form sections, child form components, nested `ngModelGroup`, multi-step forms, nested form controls, `vestFormsViewProviders`, or hits errors where a child component cannot see the parent form or validation context.
---

# ngx-vest-forms child component guidance

Use this skill when a form is being decomposed into reusable pieces.

## Non-negotiable rule

Every child component that participates in the parent form tree with `ngModel` or `ngModelGroup` must include:

- `viewProviders: [vestFormsViewProviders]`

If that is missing, the child will not correctly access the parent form context.

Prefer the public API export `vestFormsViewProviders` from `'ngx-vest-forms'`.
Do not direct consumers to internal provider definitions.

## Recommended structure

1. Keep the parent form on the top-level `<form ngxVestForm ...>`.
2. Pass the relevant model slice into each child via signal inputs.
3. Pass a `groupName` or equivalent input when the child owns an `ngModelGroup`.
4. Make sure the `groupName` matches the property path in the parent form model.
5. Prefer `<ngx-form-group-wrapper [ngModelGroup]="groupName()">` when the child represents a grouped section.
6. Use `<ngx-control-wrapper>` inside the group for individual controls.

## Validation guidance

The validation suite still needs full field paths.
For reusable sections, prefer composable validation helpers that accept both:

- the relevant model slice
- the path prefix

That keeps field names aligned with the child section’s `ngModelGroup`.

## ID guidance

When the same child component can render more than once, derive control IDs from the group or path prefix.
Do not hard-code IDs like `street` or `email` in repeated sections.

## Nested children

The same rule repeats at every level:

- parent child component: `vestFormsViewProviders`
- grandchild component: `vestFormsViewProviders`
- any component contributing controls/groups: `vestFormsViewProviders`

## Common mistakes to correct

- missing `vestFormsViewProviders`
- child `groupName` not matching the parent model path
- validation tests using local child names instead of full prefixed paths
- duplicate IDs when two instances of the same child component appear on one screen
- using wrapper components in a way that blurs field-level and group-level responsibilities
- importing child-component helpers from internal library paths

Do not suggest ad-hoc provider workarounds when `vestFormsViewProviders` is the supported path. If that export is not enough, the problem is architectural and should be fixed explicitly.

## Output style

When answering:

- show both parent and child snippets when possible
- explain the parent-path to child-group relationship explicitly
- prefer signal `input()` APIs and `OnPush`
- include the validation-path strategy if the user is also asking about validation

## Repo references to consult when needed

- `../../../../docs/CHILD-COMPONENTS.md`
- `../../../../docs/ACCESSIBILITY.md`
- `../../../../docs/COMPLETE-EXAMPLE.md`
- `../../../../README.md`
- `../../../../projects/ngx-vest-forms/src/public-api.ts`

Treat the repo instruction file as the invariant layer. Use this skill for parent/child path coordination, `vestFormsViewProviders`, and nested section design.

## Fast heuristic

If the user says “split this form”, “reusable section”, “child component”, “nested ngModelGroup”, or “why does the child not see the form?”, trigger this skill.
