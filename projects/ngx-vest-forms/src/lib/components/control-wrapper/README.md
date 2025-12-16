# `ngx-control-wrapper`

A small UI helper component that:

- renders inline **errors**, **warnings**, and **pending** state regions, and
- (optionally) wires those regions to descendant form controls via ARIA.

It is intended for **single-control** wrappers (one input/select/textarea per wrapper) and is the recommended default for field-level error UI.

## Recommended usage

Use one wrapper per control:

- Wrap the label + control together.
- Ensure the control has a `name` that matches the `[ngModel]` path.

For `ngModelGroup` containers, prefer using `ngx-form-group-wrapper` (it renders group-level regions and does **not** stamp ARIA onto descendant controls).

## Selectors (legacy + modern)

All of these are supported in v2.x:

- Elements: `<ngx-control-wrapper>`, `<sc-control-wrapper>`
- Attributes: `[ngxControlWrapper]`, `[scControlWrapper]`
- Kebab attributes: `[ngx-control-wrapper]`, `[sc-control-wrapper]`

The host element automatically receives both CSS classes:

- `ngx-control-wrapper`
- `sc-control-wrapper`

## Public inputs

### `errorDisplayMode`

Controls _when_ errors become visible (and therefore when `aria-invalid` may be applied).

Accepted values:

- `"on-blur-or-submit"` (default)
- `"on-blur"`
- `"on-submit"`

This input is provided by the composed `FormErrorDisplayDirective`.

### `ariaAssociationMode`

Controls how this wrapper applies `aria-describedby` / `aria-invalid` to descendant controls.

Accepted values:

- `"all-controls"` (default)
  - Applies ARIA attributes to **all** descendant `input/select/textarea` elements.
  - Useful for _true composite_ controls where the same message applies to every child control.

- `"single-control"`
  - Applies ARIA attributes only when **exactly one** descendant control exists.
  - Useful when your wrapper sometimes contains extra focusable UI (e.g. input + “Clear” button) and you want to avoid accidentally stamping ARIA onto multiple controls.

- `"none"`
  - Never mutates descendant controls.
  - Useful when:
    - you want **manual** ARIA wiring, or
    - you’re wrapping a multi-control container and don’t want blanket stamping.

### Guidance: when to use which

- Most forms: **omit `ariaAssociationMode`** and use one wrapper per input. The default behaves as expected when there’s only one descendant control.
- `ngModelGroup` containers: prefer **`ngx-form-group-wrapper`** instead of using `ngx-control-wrapper` as a group wrapper.
- Multi-control container (advanced/custom): use `ariaAssociationMode="none"` and wire ARIA explicitly.

## Rendering and styling behavior

This component always keeps its message regions stable in the DOM (to improve announcement reliability), but only renders message content when relevant.

It renders three regions with generated IDs:

- `...-error` (errors)
- `...-warning` (warnings)
- `...-pending` (pending)

The pending region is positioned `absolute` in the top-right corner of the wrapper (host is `position: relative`).

### ARIA merging

When ARIA stamping is enabled (anything except `"none"`), the wrapper:

- merges its own IDs into an existing `aria-describedby` on the control (does not clobber consumer-provided IDs)
- toggles `aria-invalid="true"` only when errors are meant to be shown (`shouldShowErrors()`)

## Related docs

- [Accessibility Guide](../../../../../../docs/ACCESSIBILITY.md)
- [Custom Control Wrappers](../../../../../../docs/CUSTOM-CONTROL-WRAPPERS.md)
- [Dual selector support](../../../../../../docs/DUAL-SELECTOR-SUPPORT.md)
