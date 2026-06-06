# Complex Nested & Repeatable Form

A team-registration form that shows two patterns at once: **deep
`ngModelGroup` nesting** and a **dynamic, repeatable collection** —
assembled from small, reusable child components rather than one giant
template.

## Why this demo exists

Real forms are rarely flat. They have nested sub-objects (an address inside
a company) and lists that grow and shrink at runtime (team members). This
demo proves both compose cleanly with ngx-vest-forms while keeping each
piece independently understandable and testable.

## What it shows

- **Nested groups.** `company` is an `ngModelGroup`; inside it
  `company.address` is another group rendered by the reusable
  `ngx-address` component. No extra wiring — `vestFormsViewProviders` lets
  the child register its controls into the parent form tree.
- **Reusable child sections.** Each member's fields live in a tiny
  `ngx-team-member` component whose only public contract is an
  `input()` for the member value and an `idPrefix`. It mirrors
  `ngx-address` exactly.
- **Repeatable rows.** `teamMembers` is a `Record<string, TeamMemberModel>`
  with contiguous numeric keys. Add/remove read the values as an array,
  mutate, then `arrayToObject()` back — the canonical purchase-form pattern.
  Handlers emit `(formValueChange)` immutably.
- **Stable, deterministic keys.** Keys are a pure function of the current
  model, so the stateless Vest suite re-keys to match the rendered
  `ngModelGroup` names every run: validation refreshes correctly after a
  structural change and a removed row's tests disappear with it.
- **Round-trip on submit.** The page converts `teamMembers` back to a real
  array with `objectToArray(value, ['teamMembers'])` — the JSON shape you'd
  POST to a backend — and shows it in a payload card.
- **Form-level rules.** A `ROOT_FORM` rule requires at least one member; a
  non-blocking `warn()` advisory fires for teams larger than eight.
- **Decomposition.** Model, suite, child component, form-body, and page are
  separate modules with simple contracts.

## Public API used

`NgxVestForms`, `vestFormsViewProviders`, `FormDirective`,
`provideFormContract`, `createFormFeedbackSignals`, `arrayToObject`,
`objectToArray`, `NgxVestSuite`, `NgxDeepPartial`, `NgxDeepRequired`,
`ROOT_FORM`. Vest primitives (`create`, `test`, `enforce`, `warn`) come
from `vest`.

## Key files

| File | Responsibility |
| --- | --- |
| `complex-nested.page.ts` / `.html` | Page: owns formValue + add/remove + suite |
| `complex-nested.form.ts` / `.html` | Form body: form tree + repeatable rows |
| `team-member.component.ts` / `.html` | One member's fields (reusable child) |
| `complex-nested.validations.ts` | Vest suite (testable in isolation) |
| `../../models/complex-nested.model.ts` | Model + contract |
| `complex-nested.content.ts` | "What this demonstrates / learn" cards |

## Behavior

Submitting while invalid keeps the success panel hidden and surfaces field
errors. A valid submit shows a success panel echoing the company name and
member count. Reset restores the initial single-member team and clears the
panel.
