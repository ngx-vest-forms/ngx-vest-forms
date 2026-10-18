---
name: custom-wrapper-patterns
description: Custom field wrappers for ngx-vest-forms built on `FormErrorControlDirective` (`ngxErrorControl`) or `FormErrorDisplayDirective` (`ngxErrorDisplay`) through `hostDirectives`: design-system shells, Material or PrimeNG styling, custom pending UI, ARIA helpers. Read it when the built-in wrapper's markup does not fit.
---

# ngx-vest-forms custom wrappers

First check whether the built-in wrapper's CSS custom properties or `NGX_PENDING_LABEL` already cover the need ([`../built-in-wrappers/SKILL.md`](../built-in-wrappers/SKILL.md)). The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## Pick the primitive

| Directive                                       | Gives you                                                                                                                                                                             | Use for                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `FormErrorControlDirective` (`ngxErrorControl`) | everything below, plus stable `errorId`/`warningId`/`pendingId`, managed `aria-describedby`/`aria-invalid`, debounced `showPendingMessage()`, `pendingLabel()`, `ariaAssociationMode` | production wrappers; the default choice     |
| `FormErrorDisplayDirective` (`ngxErrorDisplay`) | `errors()`, `warnings()`, `shouldShowErrors()`, `shouldShowWarnings()`, `isPending()`, touched/dirty/valid state, `formSubmitted`, display-mode inputs                                | wrappers that do all ARIA wiring themselves |

## Build it

1. A component with `<ng-content />`, so the directive's `contentChild(NgModel)` finds the projected control.
2. Compose the directive with `hostDirectives`, forwarding the inputs consumers need.
3. Inject it with `inject(FormErrorControlDirective, { self: true })`. Its display state lives on the composed `FormErrorDisplayDirective`; inject that too, also with `{ self: true }`.
4. Keep the message regions in the DOM at all times, with the directive's ids, so `aria-describedby` targets always exist; toggle their content instead.
5. Field messages are polite (`role="status"`, `aria-live="polite"`). `role="alert"` is for blocking form-level summaries only.

```ts
import { Component, inject } from '@angular/core';
import {
  FormErrorControlDirective,
  FormErrorDisplayDirective,
} from 'ngx-vest-forms';

@Component({
  selector: 'ds-field',
  hostDirectives: [
    {
      directive: FormErrorControlDirective,
      inputs: ['ariaAssociationMode'],
    },
  ],
  template: `
    <ng-content />
    <div
      [id]="ec.errorId"
      class="ds-field__error"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      @if (display.shouldShowErrors()) {
        @for (error of display.errors(); track $index) {
          <p>{{ error }}</p>
        }
      }
    </div>
    <div
      [id]="ec.warningId"
      class="ds-field__warning"
      role="status"
      aria-live="polite"
    >
      @if (display.shouldShowWarnings()) {
        @for (warning of display.warnings(); track $index) {
          <p>{{ warning }}</p>
        }
      }
    </div>
    <div [id]="ec.pendingId" role="status" aria-live="polite">
      @if (ec.showPendingMessage()) {
        {{ ec.pendingLabel() }}
      }
    </div>
  `,
})
export class DsFieldComponent {
  protected readonly ec = inject(FormErrorControlDirective, { self: true });
  protected readonly display = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
```

`hostDirectives` can forward only the listed directive's own inputs, and `errorDisplayMode`/`warningDisplayMode` belong to the `FormErrorDisplayDirective` that `FormErrorControlDirective` composes. A wrapper on `FormErrorControlDirective` therefore takes its display modes from `NGX_ERROR_DISPLAY_MODE_TOKEN` / `NGX_WARNING_DISPLAY_MODE_TOKEN`, provided app-wide or in the wrapper's own `providers`. A wrapper that needs a per-instance mode input composes `FormErrorDisplayDirective` directly with `inputs: ['errorDisplayMode', 'warningDisplayMode']` and wires ARIA itself.

Read ids from the directive rather than hard-coding them; they include a non-default `APP_ID`.

## Multi-control containers

A custom wrapper around a group or several inputs sets `ariaAssociationMode="none"` and wires ARIA explicitly, or uses `<ngx-form-group-wrapper>`. A widget that writes several fields is a composite adapter instead ([`../composite-adapter/SKILL.md`](../composite-adapter/SKILL.md)).

## Advanced helpers

For wrappers that manage ARIA by hand, the public helpers preserve consumer-provided ids:

- `parseAriaIdTokens(value)` splits an `aria-describedby` string;
- `mergeAriaDescribedBy(existing, activeIds, ownedIds)` swaps the wrapper's own ids (`ownedIds`) for the currently active ones and keeps every id the consumer set;
- `resolveAssociationTargets(controls, mode)` picks, from a list of control elements, the ones a mode would stamp.

`createDebouncedPendingState(isPending, options)` gives a standalone debounced `showPendingMessage` signal for wrappers built on `FormErrorDisplayDirective`. `options` may be a signal (for example an `input()`), so delays can change at runtime; its type is `DebouncedPendingStateOptionsInput`.

## References

- [`CUSTOM-CONTROL-WRAPPERS.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/CUSTOM-CONTROL-WRAPPERS.md)
- [`ACCESSIBILITY.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/ACCESSIBILITY.md)
