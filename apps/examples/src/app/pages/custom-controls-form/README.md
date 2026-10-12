# Custom Controls (ControlValueAccessor)

Proves that a non-native control built on Angular's `ControlValueAccessor`
participates in an ngx-vest-forms form exactly like a native `<input>` —
validation, Vest warnings, touched state, and submission all work unchanged.

## Why this demo exists

Real apps rarely use only native inputs. This demo shows that ngx-vest-forms
needs nothing special from a custom widget beyond the standard CVA contract:
register through `NG_VALUE_ACCESSOR` and bind with `[ngModel]`.

## What it shows

- Three standalone custom controls, each implementing
  `writeValue` / `registerOnChange` / `registerOnTouched` /
  `setDisabledState` and provided via
  `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(...), multi: true }`:
  - `ngx-star-rating` — 1–5 star buttons emitting a `number`.
  - `ngx-segmented-control` — single-select for the `experience` string.
  - `ngx-tag-input` — inline tag editor emitting a `string[]`.
- Each control bound with plain `[ngModel]` and `name="…"` inside
  `ngx-control-wrapper`, so errors and warnings render automatically.
- A plain Vest suite (`custom-controls.validations.ts`): `rating` required and
  between 1 and 5, `experience` required, `tags` ≥ 1 (error) with a
  non-blocking `warn()` advisory when more than 5 tags are added.
- `onTouched` fired on blur so ngx-vest-forms marks the field touched and
  shows errors on the standard on-blur timing.
- Full keyboard accessibility: `radiogroup`/`radio` roles, Arrow/Home/End
  navigation, roving `tabindex`, and `focus-visible` rings.
- Packaged form state read via `createFormFeedbackSignals`; a form contract
  supplied through `provideFormContract`.

## Public API used

`NgxVestForms`, `FormDirective`, `provideFormContract`,
`createFormFeedbackSignals`, `NgxDeepPartial`, `NgxDeepRequired`,
`NgxVestSuite`. The CVA primitives (`ControlValueAccessor`,
`NG_VALUE_ACCESSOR`) come from `@angular/forms`, as expected for any custom
control.

## Key files

| File | Responsibility |
| --- | --- |
| `custom-controls.page.ts` / `.html` | Self-contained page + form |
| `star-rating.component.ts` | Custom number CVA control |
| `segmented-control.component.ts` | Custom single-select CVA control |
| `tag-input.component.ts` | Custom `string[]` CVA control |
| `custom-controls.validations.ts` | Vest suite (testable in isolation) |
| `../../models/custom-controls.model.ts` | Model + contract |
| `custom-controls.content.ts` | "What this demonstrates / learn" cards |

## Behavior

Submitting while invalid keeps the success panel hidden and surfaces field
errors on the touched controls. A valid submission shows a success panel
echoing the rating, experience and tag count. Reset clears the form and the
panel. Adding a sixth tag triggers an advisory warning that never blocks
submission.
