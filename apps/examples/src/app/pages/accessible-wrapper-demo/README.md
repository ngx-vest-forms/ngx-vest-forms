# Accessible custom wrapper

Route: `accessible-wrapper` · Title: "Accessible Custom Wrapper"

Demonstrates directive-based ARIA wiring with `FormErrorControlDirective` (`ngxErrorControl`) and `FormErrorDisplayDirective` (`ngxErrorDisplay`) when the built-in `<ngx-control-wrapper>` markup does not fit your layout.

## What it shows

- `ngxErrorControl` applied directly to a custom container alongside its composed `ngxErrorDisplay` export (`#preferredControl="ngxErrorControl"` and `#preferredDisplay="ngxErrorDisplay"`).
- `ariaAssociationMode="single-control"` merging the generated `errorId` into an existing `aria-describedby="preferred-name-hint"` without overwriting the hint association.
- `ariaAssociationMode="none"` on a container that holds both a search input and a "Clear search query" button, letting the input own `aria-describedby` and `aria-invalid` manually.
- Permanently mounted `role="status"` / `aria-live="polite"` error regions keyed by `errorId`.
- Automatic first-invalid focus on submit via `ngxVestForm` (`focusFirstInvalidOnSubmit` default `true`).

## Public API used

`NgxVestForms`, `FormDirective`, `FormErrorControlDirective`, `provideFormContract`, `createFormFeedbackSignals`, `NgxSubmitSettledEvent`, `NgxVestSuite`, `NgxDeepPartial`, `NgxDeepRequired`.

## Key files

| File | Responsibility |
| --- | --- |
| `accessible-wrapper.page.ts` / `.html` | Page shell, state signal, clear-search and submit handling |
| `accessible-wrapper.form.ts` / `.html` | Form body with `single-control` and `none` ARIA wiring |
| `accessible-wrapper.validations.ts` | Vest 6 suite |
| `accessible-wrapper.model.ts` | Model and form contract |
| `accessible-wrapper.content.ts` | In-app "What this demonstrates / learn" cards |
