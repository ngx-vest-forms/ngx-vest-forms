---
name: built-in-wrappers
description: Choosing and configuring `<ngx-control-wrapper>` and `<ngx-form-group-wrapper>` in ngx-vest-forms: error and warning display modes, pending state, `ariaAssociationMode`, `ariaRequired`, theming. Read it for inline error UI that does not need a custom wrapper.
---

# ngx-vest-forms built-in wrappers

Both wrappers ship in `NgxVestForms`. The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## Pick the wrapper

| Wraps                                         | Use                                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| one control with its label and help text      | `<ngx-control-wrapper>` (element form; `[ngxControlWrapper]` as an attribute)                      |
| an `ngModelGroup` or any multi-control region | `<ngx-form-group-wrapper ngModelGroup="address">`, with a control wrapper per child                |
| one widget writing several fields             | neither; see [`../composite-adapter/SKILL.md`](../composite-adapter/SKILL.md)                      |
| a design-system field shell                   | a custom wrapper; see [`../custom-wrapper-patterns/SKILL.md`](../custom-wrapper-patterns/SKILL.md) |

A control wrapper around a whole group stamps one error onto every descendant input and misleads screen readers; the group wrapper is the group-safe choice. Control `id`s must be unique, so repeated sections derive them from their path prefix.

## Display modes

Set per wrapper with `[errorDisplayMode]` / `[warningDisplayMode]`, or app-wide with `NGX_ERROR_DISPLAY_MODE_TOKEN` / `NGX_WARNING_DISPLAY_MODE_TOKEN`.

| Error mode                      | Shows errors                                           |
| ------------------------------- | ------------------------------------------------------ |
| `'on-blur-or-submit'` (default) | after blur or submit; the right default for most forms |
| `'on-blur'`                     | after blur; quiet dependents                           |
| `'on-submit'`                   | after submit only                                      |
| `'on-dirty'`                    | as soon as the value changes                           |
| `'always'`                      | immediately, even when pristine; use deliberately      |

| Warning mode                        | Shows warnings                  |
| ----------------------------------- | ------------------------------- |
| `'on-validated-or-touch'` (default) | after a validation run or touch |
| `'on-touch'`                        | after blur                      |
| `'on-dirty'`                        | as soon as the value changes    |
| `'always'`                          | immediately                     |

Warnings (Vest `warn()`) never make a control invalid, and they can appear on an untouched field after `validationConfig` revalidates it. `'on-blur'` with `[ngModelOptions]="{ updateOn: 'submit' }"` shows no blur-time errors and raises `NGX-105`; pair `updateOn: 'submit'` with `'on-submit'`.

## Pending, ARIA and required

- `[pendingDebounce]="{ showAfter: 500, minimumDisplay: 500 }"` (the defaults) keeps "Validating…" from flashing; a binding that changes at runtime takes effect. The text comes from `NGX_PENDING_LABEL`.
- `ariaAssociationMode` on `<ngx-control-wrapper>`: `'all-controls'` (default) stamps `aria-describedby`/`aria-invalid` on every descendant input and every element with a form-widget role (`combobox`, `radiogroup`, `slider`, `switch`, …); `'single-control'` stamps only when exactly one control is inside (input plus extra buttons); `'none'` leaves ARIA to you. Raise it only when the wrapper content is non-standard.
- `ariaRequired` sets `aria-required="true"`. It is opt-in because Vest rules are often conditional.

## Theming

The wrappers ship plain CSS on BEM-style classes, themed through custom properties such as `--ngx-control-wrapper-error-color`, `--ngx-control-wrapper-warning-color`, `--ngx-control-wrapper-pending-color` and `--ngx-form-group-wrapper-error-color`, set from the app stylesheet. Overriding the properties comes before building a custom wrapper.

```html
<ngx-form-group-wrapper ngModelGroup="address">
  <ngx-control-wrapper [errorDisplayMode]="'on-blur'">
    <label for="street">Street</label>
    <input id="street" name="street" [ngModel]="formValue().address?.street" />
  </ngx-control-wrapper>
</ngx-form-group-wrapper>
```

## References

- [`ControlWrapperComponent` README](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/packages/ngx-vest-forms/src/lib/components/control-wrapper/README.md) (full property list under "Styling and theming")
- [`ACCESSIBILITY.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/ACCESSIBILITY.md)
- [`API-TOKENS.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/API-TOKENS.md)
