# dynamic forms decision guide

Use this reference when fields appear, disappear, or become irrelevant as the user interacts with the form.

## First question: what changed?

### Case 1: input → different input

Usually no special handling is needed beyond normal state updates.
Angular already has a control/value change path.

### Case 2: input → non-input content

This is the important case.
Examples:

- a text field is replaced by explanatory text
- a section becomes hidden and there is no substitute control
- a form mode changes and a previously required input is no longer rendered

In these cases, stale values and stale validity are more likely.

## Recommended workflow

1. Update the component signal state.
2. Remove or preserve values intentionally:
   - `clearFieldsWhen()` for conditional clearing
   - `clearFields()` for unconditional cleanup
   - `keepFieldsWhen()` for whitelist-style preservation
3. If Angular will not naturally re-run validation, call `triggerFormValidation()`.
4. Keep the Vest suite aligned with conditional rendering using `omitWhen(...)` or related patterns.

## When `triggerFormValidation()` is justified

Use it when:

- controls disappear without a normal control-value change event
- hidden values are cleared and the remaining form validity must be recomputed
- a dynamic layout change affects whether certain rules now apply

Do not treat it as a general-purpose “make errors appear” method.
It re-runs validation logic; it does not mark controls as touched.

## Interactions with other features

- If one field becoming visible or relevant depends on another field’s value, also consider `validationConfig`.
- If the resulting rule belongs to the whole form, consider `ROOT_FORM` instead of forcing a field-owned error.

## Common anti-patterns

- leaving stale hidden values in the signal model
- calling `triggerFormValidation()` on every normal field change
- clearing fields without matching the suite’s conditional rules
- assuming hidden controls disappearing automatically cleans up all component state
