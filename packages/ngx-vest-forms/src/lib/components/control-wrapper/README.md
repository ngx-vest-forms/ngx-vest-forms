# `ngx-control-wrapper`

`ControlWrapperComponent` wraps a single form control to render inline errors, warnings, and pending states, and wires those regions to descendant controls with ARIA attributes.

Use `<ngx-control-wrapper>` for single-control fields. For `ngModelGroup` containers with multiple inputs, use `<ngx-form-group-wrapper>`, which renders group-level messages without stamping ARIA attributes onto descendant controls.

## Selectors

- Element: `<ngx-control-wrapper>`
- Attribute: `[ngxControlWrapper]`

The host element always receives the `ngx-control-wrapper` class, adds `ngx-control-wrapper--invalid` when errors are shown, and sets `aria-busy="true"` while pending.

## Inputs

### `errorDisplayMode`

Controls when errors become visible (and when `aria-invalid="true"` is applied). Inherited from `FormErrorDisplayDirective`.

- `'on-blur-or-submit'` (default): show after the control is touched or the form is submitted.
- `'on-blur'`: deprecated alias for `'on-blur-or-submit'` (opens on touch or form submit; scheduled for removal in v4).
- `'on-submit'`: show only after form submission.
- `'on-dirty'`: show as soon as the value changes, or after touch/submit.
- `'always'`: show immediately, including on pristine controls.

Set a global default with `NGX_ERROR_DISPLAY_MODE_TOKEN`.

### `warningDisplayMode`

Controls when non-blocking warnings become visible. Inherited from `FormErrorDisplayDirective`.

- `'on-validated-or-touch'` (default): show after validation completes, touch, or submit.
- `'on-touch'`: show after touch or form submission.
- `'on-dirty'`: show as soon as the value changes, or after touch/submit.
- `'always'`: show immediately, including on pristine controls.

Set a global default with `NGX_WARNING_DISPLAY_MODE_TOKEN`.

### `pendingDebounce`

Controls the delay before showing the pending message and how long it stays visible once shown:

```ts
{ showAfter: 500, minimumDisplay: 500 } // default
```

Translate or customize the pending text with the `NGX_PENDING_LABEL` token (default `'Validating…'`).

### `ariaRequired`

Boolean input (default `false`). When set, applies `aria-required="true"` to associated descendant controls.

Use `ariaRequired` only for controls that are unconditionally required. Requiredness is not inferred from Vest rules because rules are often conditional.

### `ariaAssociationMode`

Controls how `aria-describedby` and `aria-invalid` are stamped onto descendant controls:

- `'all-controls'` (default): stamps all descendant `input`, `select`, and `textarea` elements, plus elements with an ARIA form-widget role (`checkbox`, `combobox`, `listbox`, `radiogroup`, `searchbox`, `slider`, `spinbutton`, `switch`, `textbox`). Native inputs nested inside such a widget are skipped so the widget remains the single target.
- `'single-control'`: stamps only when exactly one descendant control is found. Use this when a wrapper contains an input alongside extra focusable buttons or controls.
- `'none'`: never mutates descendant controls. Use this for manual ARIA wiring or multi-control containers.

## Rendering and accessibility behavior

Message regions stay mounted in the DOM so screen readers announce updates reliably:

- `...-error` (`role="status"`, `aria-live="polite"`)
- `...-warning` (`role="status"`, `aria-live="polite"`)
- `...-pending` (`role="status"`, `aria-live="polite"`, positioned top-right)

When ARIA stamping is enabled (`'all-controls'` or `'single-control'`), the wrapper merges its active region IDs into any existing `aria-describedby` attribute without overwriting consumer-provided hint IDs.

Warnings do not make a control invalid. Under the default `warningDisplayMode`, warnings can appear when `validationConfig` triggers validation on an untouched field. Warnings clear on `resetForm()`.

## Styling and theming

`ngx-control-wrapper` ships with framework-agnostic baseline styles and requires no CSS framework. Public `--ngx-control-wrapper-*` custom properties are consumed with private `--_ngx-control-wrapper-*` fallbacks rather than declared on `:host`, so consumer element selectors win over Angular's emulated encapsulation:

```css
ngx-control-wrapper {
  --ngx-control-wrapper-error-color: #b91c1c;
  --ngx-control-wrapper-warning-color: #92400e;
  --ngx-control-wrapper-pending-color: #4b5563;
}
```

Available public tokens include:

- Layout and typography: `--ngx-control-wrapper-feedback-min-height`, `--ngx-control-wrapper-message-margin-top`, `--ngx-control-wrapper-message-font-size`, `--ngx-control-wrapper-message-line-height`, `--ngx-control-wrapper-message-gap`
- Colors: `--ngx-control-wrapper-error-color`, `--ngx-control-wrapper-warning-color`, `--ngx-control-wrapper-pending-color`
- Pending badge and spinner: `--ngx-control-wrapper-pending-top`, `--ngx-control-wrapper-pending-right`, `--ngx-control-wrapper-pending-gap`, `--ngx-control-wrapper-pending-font-size`, `--ngx-control-wrapper-pending-line-height`, `--ngx-control-wrapper-spinner-size`, `--ngx-control-wrapper-spinner-border-width`, `--ngx-control-wrapper-spinner-color`, `--ngx-control-wrapper-spinner-radius`

### Dark mode

Built-in dark colors respond to `@media (prefers-color-scheme: dark)`. If your application switches themes with a class or data attribute, override the same public tokens under your theme selector:

```css
html.dark ngx-control-wrapper {
  --ngx-control-wrapper-error-color: #f87171;
  --ngx-control-wrapper-warning-color: #f59e0b;
  --ngx-control-wrapper-pending-color: #9ca3af;
}
```

If you need different markup or layout, build a custom wrapper on `FormErrorDisplayDirective` or `FormErrorControlDirective`.

## Related docs

- [Accessibility guide](../../../../../../docs/ACCESSIBILITY.md)
- [Custom control wrappers](../../../../../../docs/CUSTOM-CONTROL-WRAPPERS.md)
- [API tokens](../../../../../../docs/API-TOKENS.md)
