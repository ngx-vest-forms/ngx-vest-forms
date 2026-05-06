# validationConfig decision guide

Use this reference when the user’s issue is about cross-field behavior and you need to decide between field-level revalidation, form-level validation, or structure-change handling.

## Choose `validationConfig` when

Use `validationConfig` if a field’s validation depends on another field’s value and the error still belongs to a specific field.

Typical examples:

- password ↔ confirm password
- start date ↔ end date
- country → state / province / postal code
- age → guardian or emergency contact
- conditional `omitWhen(...)`, `skipWhen(...)`, or `optional(...)`

The essential idea: `validationConfig` tells Angular **when to re-run** a dependent field’s validation.
It does **not** define the rule itself.

## Choose `ROOT_FORM` when

Use `ROOT_FORM` if the rule belongs to the form as a whole and no single field should own the error.

Typical examples:

- at least one contact method is required
- two address blocks must differ
- whole-form business rules shown in a summary

## Choose `triggerFormValidation()` when

Use `triggerFormValidation()` if the form structure changes without a normal control-value change path.

Typical examples:

- a control disappears and is replaced by a paragraph or static hint
- values are cleared because hidden sections no longer apply
- a dynamic mode switch changes which controls exist

## Quick diagnostic questions

1. Which field should display the error?
   - one field → likely `validationConfig`
   - no one field → likely `ROOT_FORM`
2. Did the set of rendered controls change?
   - yes → consider `triggerFormValidation()`
3. Is the suite already using `omitWhen(...)` or `skipWhen(...)`?
   - yes → strongly consider `validationConfig`

## Common mistake patterns

- using `ROOT_FORM` for confirm-password
- using `validationConfig` as if it defines rules
- forgetting revalidation dependencies when a field becomes conditionally required
- calling `triggerFormValidation()` for ordinary input-to-input changes that Angular already handles
