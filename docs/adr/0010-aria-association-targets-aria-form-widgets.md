# ARIA association targets ARIA form widgets

## Status

Accepted

## Date

2026-10-15

## Context

`ngx-control-wrapper` and `ngxErrorControl` set `aria-invalid` and
`aria-describedby` (and, on request, `aria-required`) on the controls they
wrap. Until now they looked only for `input`, `select` and `textarea`.

A ControlValueAccessor built from non-form elements, for example a star
rating rendered as a `role="radiogroup"` of buttons, has none of those
elements. The wrapper still showed the error text, but the widget that
assistive technology reports got no `aria-invalid` and no link to the
message. The examples app had to work around it by passing an `invalid`
input into each custom control.

MDN lists the roles that accept `aria-invalid` and `aria-errormessage`. The
ones that hold a form value are `checkbox`, `combobox`, `listbox`,
`radiogroup`, `searchbox`, `slider`, `spinbutton`, `switch` and `textbox`.
`aria-required` is supported on the same roles except `slider`.

## Decision

The association controller targets native `input`, `select` and `textarea`
elements and any element with one of those ARIA form-widget roles.

- A control nested inside such a widget is skipped. The widget owns its parts
  (for example the inner `<input>` of a `role="combobox"` element), and is the
  element assistive technology reports.
- `aria-required` is not set on `role="slider"`.
- An element's role is the first token of its `role` attribute, so a
  fallback list such as `role="switch checkbox"` counts as `switch`. Browsers
  use the first role they support, and they support every role in the list.
- The controller watches `role` changes. When an element stops being a
  target while it stays in the DOM (its role changed, or the mode switched to
  `none`), the controller removes the attributes it set on it.
- When the host itself has one of these roles (`<div ngxControlWrapper
  role="radiogroup">` around native radios), the host is the only target:
  `radio` does not accept `aria-invalid`.
- `ariaAssociationMode` keeps its meaning. A wrapper around one radiogroup
  counts as one control in `single-control` mode.
- The link to the message stays `aria-describedby`. MDN pairs `aria-invalid`
  with `aria-errormessage`, but `aria-describedby` has broader screen reader
  support, and the wrapper's message regions are already live regions. Adding
  `aria-errormessage` as well would risk the same message being announced
  twice.

## Consequences

- Custom controls that use the ARIA role a screen reader expects get the
  same error association as native inputs, with no extra wiring.
- A wrapper that contains both a native input and a separate ARIA widget now
  stamps both in `all-controls` mode, and `single-control` mode sees two
  controls. Use `single-control` or `none` with manual wiring when only one of
  them should carry the state (see ADR-0006).
- Roles outside the list (`radio`, `option`, `menuitem`, `gridcell`, `tree`)
  are not targeted: they are parts of a widget or not form values.
