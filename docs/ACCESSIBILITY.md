# Accessibility guide

ngx-vest-forms targets WCAG 2.2 Level AA for inline validation feedback, ARIA associations, and keyboard error recovery.

## Field-level live regions (polite)

`<ngx-control-wrapper>` and `<ngx-form-group-wrapper>` render inline errors, warnings, and pending indicators inside permanently mounted `role="status"` / `aria-live="polite"` regions so screen readers announce updates without interrupting typing:

- **Merged `aria-describedby`:** wrapper region IDs are merged with any existing `aria-describedby` attribute so consumer hint text stays linked.
- **Display-mode gated `aria-invalid`:** `aria-invalid="true"` is applied only when `shouldShowErrors()` is `true`.
- **Held messages during re-validation:** while an async check re-runs, the last settled errors, warnings, `aria-invalid`, and `aria-describedby` stay in place alongside the pending message. Messages update only when the new result settles, avoiding duplicate screen reader announcements, and clear immediately on `resetForm()` or `resetField()`.
- **Debounced pending text:** `<ngx-control-wrapper>` and `<ngx-form-group-wrapper>` debounce the pending indicator via `[pendingDebounce]` (default `{ showAfter: 500, minimumDisplay: 500 }`) and read the localized label from `NGX_PENDING_LABEL` (default `'Validating…'`).
- **Warnings:** under the default `'on-validated-or-touch'` mode, warnings can appear after `validationConfig` runs on an untouched control. Use `warningDisplayMode="on-touch"` or `NGX_WARNING_DISPLAY_MODE_TOKEN` to wait for touch or submit.

### Supported ARIA form widgets

`<ngx-control-wrapper>` and `FormErrorControlDirective` stamp `aria-invalid` and `aria-describedby` on native `input`, `select`, and `textarea` elements, as well as elements with an ARIA form-widget role: `checkbox`, `combobox`, `listbox`, `radiogroup`, `searchbox`, `slider`, `spinbutton`, `switch`, and `textbox`.

```html
<ngx-control-wrapper>
  <span id="rating-label">Rating</span>
  <!-- Custom control renders <div role="radiogroup" aria-labelledby="rating-label"> -->
  <ngx-star-rating
    name="rating"
    ariaLabelledby="rating-label"
    [ngModel]="formValue().rating"
  />
</ngx-control-wrapper>
```

Controls nested inside such a widget are skipped so assistive technology reports the widget itself. Fallback role lists match by their first token (for example `role="switch checkbox"` counts as `switch`). `aria-required` is never set on `role="slider"`, which does not support it. See [ADR-0010](./adr/0010-aria-association-targets-aria-form-widgets.md).

## Required state

ngx-vest-forms does **not** infer `required` or `aria-required` from Vest rules, because requiredness is often conditional.

For controls that are unconditionally required, use either native `required` or `[ariaRequired]` on `<ngx-control-wrapper>`:

```html
<ngx-control-wrapper ariaRequired>
  <label for="email">Email</label>
  <input id="email" name="email" [ngModel]="formValue().email" />
</ngx-control-wrapper>
```

For conditionally required fields, explain the condition in label or helper text and let validation messages describe the current state.

## Submit focus recovery

When an invalid form is submitted, `ngxVestForm` waits for async validation to settle and errors to render, then scrolls to and focuses the first visible invalid control.

If your application focuses its own post-submit error summary (for example a `role="alert"` banner), disable automatic field focus so the two do not compete:

```html
<form ngxVestForm [focusFirstInvalidOnSubmit]="false">...</form>
```

You can still call `vestForm().focusFirstInvalidControl()` or `vestForm().scrollToFirstInvalidControl()` manually.

### Security note on custom selectors

`focusFirstInvalidControl({ invalidSelector, focusSelector })` passes those strings to `querySelectorAll()` and `matches()`. Pass the exported `DEFAULT_INVALID_SELECTOR` / `DEFAULT_FOCUS_SELECTOR` constants or static CSS selectors only, never user-controlled input. Malformed selectors are caught safely. See [SECURITY.md](../SECURITY.md).

## Group containers (`ngModelGroup`)

Wrap `ngModelGroup` containers in `<ngx-form-group-wrapper>`, which renders group-level feedback without stamping `aria-describedby` or `aria-invalid` onto descendant controls:

```html
<ngx-form-group-wrapper ngModelGroup="address">
  <ngx-control-wrapper>
    <label for="street">Street</label>
    <input id="street" name="street" [ngModel]="formValue().address?.street" />
  </ngx-control-wrapper>

  <ngx-control-wrapper>
    <label for="city">City</label>
    <input id="city" name="city" [ngModel]="formValue().address?.city" />
  </ngx-control-wrapper>
</ngx-form-group-wrapper>
```

If you wrap a multi-control container in `<ngx-control-wrapper>` instead, set `ariaAssociationMode="none"`.

## Unique IDs and SSR hydration

- Keep control `id` attributes unique in the DOM. When reusing a child component multiple times (for example billing and shipping addresses), derive IDs from the group name (`billingAddress-street`, `shippingAddress-street`). See [Child form components](./CHILD-COMPONENTS.md).
- Built-in wrappers and `FormErrorControlDirective` generate region IDs per Angular application (incorporating non-default `APP_ID` values) so SSR requests do not leak counters and hydrated server/client IDs match. Never hard-code wrapper IDs; read `errorId`, `warningId`, and `pendingId` from `FormErrorControlDirective`.

## Form-level error summaries (assertive)

Reserve `role="alert"` / `aria-live="assertive"` for blocking post-submit form summaries rather than inline typing feedback (WCAG ARIA19 / ARIA22):

```html
<!-- Keep mounted in the DOM; populate when submission fails -->
<div id="form-errors" role="alert" aria-live="assertive" aria-atomic="true">
  @if (errors()[ROOT_FORM]) {
    <p>{{ errors()[ROOT_FORM][0] }}</p>
  }
</div>
```

## Verification

Validate accessibility changes with screen readers (VoiceOver, NVDA, JAWS), automated tools such as [Accessibility Insights](https://accessibilityinsights.io/), and keyboard-only navigation.

## Related guides

- [Custom control wrappers](./CUSTOM-CONTROL-WRAPPERS.md)
- [ControlWrapperComponent README](../packages/ngx-vest-forms/src/lib/components/control-wrapper/README.md)
- [WCAG ARIA19 (`role="alert"`)](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19)
- [WCAG ARIA22 (`role="status"`)](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)
