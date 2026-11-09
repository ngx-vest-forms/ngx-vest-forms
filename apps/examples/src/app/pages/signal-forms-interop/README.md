# Signal Forms Controls with ngModel

Shows that a control written for Angular Signal Forms works in an
ngx-vest-forms template-driven form. A design system can ship one control
instead of a Signal Forms version and a `ControlValueAccessor` version.

## What it shows

- `ngx-seat-stepper` implements `FormValueControl<number | null | undefined>`
  from `@angular/forms/signals`: a `value` model, a `touch` output and a
  `disabled` input. No `ControlValueAccessor`, no `NG_VALUE_ACCESSOR`.
- `ngx-consent-switch` implements `FormCheckboxControl`: a `checked` model
  instead of `value`.
- Both are bound with plain `[ngModel]` and `name` inside
  `ngx-control-wrapper`, inside `<form ngxVestForm>`. `NgModel` sees the
  `value` (or `checked`) model and binds it itself.
- The Vest suite (`signal-forms-interop.validations.ts`) does not know where
  the values come from.

## What works as-is

- Value in both directions: the model fills the control, the control's
  `value`/`checked` changes reach `formValue`.
- Touched on blur: emitting `touch` marks the control touched, so errors
  appear on the default `on-blur-or-submit` timing.
- ARIA: the wrapper stamps `aria-invalid` and `aria-describedby` on the
  stepper's inner `<input>` and on the `role="switch"` button, and keeps the
  stepper's own hint id.
- First-invalid focus: a failed submit focuses the inner input, or the switch
  when it is the only invalid field.
- Disabled: `[disabled]` on the `ngModel` host disables the control, and
  `NgModel` writes the state into the component's `disabled` input. The
  value stays in `formValue` and in the `submitSettled` value, because
  ngx-vest-forms builds both from `getRawValue()`, which includes disabled
  controls. The suite skips the field with `omitWhen` while it is locked.

## Validators on the custom-control path (handled by ngx-vest-forms)

In Angular 22.2, `NgModel`'s custom-control path (`setupCustomControl()`)
does not call `setUpValidators()`, so validators provided on the element are
not attached to the `FormControl`. ngx-vest-forms handles this itself: after
Angular's setup it attaches `NgModel`'s composed validators (the Vest bridge
and any attribute validators) with public Angular API, and revalidates so the
form status, errors and `submitSettled` see the result. No extra directive is
needed. On native inputs and ControlValueAccessor hosts, or once Angular
attaches them upstream, it adds nothing.

Keep every rule in the Vest suite. "Must be checked" for the consent switch
is a Vest test: on a `FormCheckboxControl`, Angular's `required` attribute
does not mean "checked" (`CheckboxRequiredValidator` only matches
`input[type=checkbox]`). See
[Custom control wrappers](../../../../../../docs/CUSTOM-CONTROL-WRAPPERS.md#signal-forms-controls-inside-a-wrapper).

## Design notes for your own control

- Do not reuse the input names of the Signal Forms control contract
  (`name`, `required`, `min`, `max`, `errors`, `touched`, `invalid`, ...)
  for other purposes. Under `ngModel`, `NgModel` writes `disabled`,
  `touched`, `dirty`, `valid`, `invalid`, `pending` and `errors` when the
  control declares them; `[formField]` writes the rest.
- Put a native input, or an element with an ARIA form-widget role
  (`switch`, `spinbutton`, `radiogroup`, ...), inside the control so the
  wrapper has a target for `aria-invalid`.
- Take the target id as an input so a `<label for>` outside names it.
