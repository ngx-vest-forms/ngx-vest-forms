# Custom control wrappers and custom controls

Before writing a custom wrapper, check whether theming `<ngx-control-wrapper>` and `<ngx-form-group-wrapper>` with CSS custom properties is enough.

## Theming built-in wrappers with CSS tokens

Override the public `--ngx-control-wrapper-*` and `--ngx-form-group-wrapper-*` custom properties in your stylesheet to change colors, typography, spacing, or spinner sizing while keeping all built-in ARIA and display-mode logic:

```css
ngx-control-wrapper {
  --ngx-control-wrapper-error-color: #b91c1c;
  --ngx-control-wrapper-warning-color: #92400e;
  --ngx-control-wrapper-message-margin-top: 0.375rem;
  --ngx-control-wrapper-spinner-size: 0.875rem;
}

ngx-form-group-wrapper,
[ngxFormGroupWrapper] {
  --ngx-form-group-wrapper-error-color: #b91c1c;
  --ngx-form-group-wrapper-warning-color: #92400e;
}
```

See [ControlWrapperComponent README](../packages/ngx-vest-forms/src/lib/components/control-wrapper/README.md#styling-and-theming) for the full token list and class-based dark mode setup.

## Building a custom wrapper with automatic ARIA (`FormErrorControlDirective`)

Build a custom wrapper when you need different markup, popover errors, or design-system integration (Angular Material, PrimeNG, etc.).

Attach `FormErrorControlDirective` via `hostDirectives` when you want automatic `aria-describedby` merging, `aria-invalid` toggling, stable region IDs (`errorId`, `warningId`, `pendingId`), debounced pending state (`showPendingMessage`), and the localized pending text (`pendingLabel` from `NGX_PENDING_LABEL`). `FormErrorControlDirective` composes `FormErrorDisplayDirective` automatically.

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormErrorControlDirective,
  FormErrorDisplayDirective,
} from 'ngx-vest-forms';

@Component({
  selector: 'app-field-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: FormErrorControlDirective,
      // Only FormErrorControlDirective's own inputs can be forwarded here.
      // Configure display modes with NGX_ERROR_DISPLAY_MODE_TOKEN /
      // NGX_WARNING_DISPLAY_MODE_TOKEN, or forward FormErrorDisplayDirective
      // inputs directly (see the FormErrorDisplayDirective-only section below).
      inputs: ['ariaAssociationMode'],
    },
  ],
  host: {
    '[class.field-invalid]': 'errorDisplay.shouldShowErrors()',
    '[attr.aria-busy]': "errorDisplay.isPending() ? 'true' : null",
  },
  template: `
    <div class="field-wrapper">
      <ng-content />

      <!-- Keep live regions mounted so aria-describedby targets always exist -->
      <div
        [id]="ec.errorId"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @if (errorDisplay.shouldShowErrors()) {
          @for (error of errorDisplay.errors(); track error) {
            <p class="error">{{ error }}</p>
          }
        }
      </div>

      <div
        [id]="ec.warningId"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @if (errorDisplay.shouldShowWarnings()) {
          @for (warning of errorDisplay.warnings(); track warning) {
            <p class="warning">{{ warning }}</p>
          }
        }
      </div>

      <div
        [id]="ec.pendingId"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @if (ec.showPendingMessage()) {
          <p class="pending">{{ ec.pendingLabel() }}</p>
        }
      </div>
    </div>
  `,
})
export class FieldWrapperComponent {
  protected readonly ec = inject(FormErrorControlDirective, { self: true });
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
```

### `ariaAssociationMode` options

Both `<ngx-control-wrapper>` and `FormErrorControlDirective` accept:

- `'all-controls'` (default): stamps descendant `input`, `select`, `textarea`, and ARIA form-widget roles (`checkbox`, `combobox`, `listbox`, `radiogroup`, `searchbox`, `slider`, `spinbutton`, `switch`, `textbox`).
- `'single-control'`: stamps only when exactly one descendant control exists (useful for an input paired with an inline "Clear" button).
- `'none'`: never mutates descendant controls (group-safe or manual wiring).

For `ngModelGroup` containers, prefer `<ngx-form-group-wrapper>`.

## Building a custom wrapper with `FormErrorDisplayDirective` only

If you manage ARIA attributes yourself (for example, wrapping a third-party form field component), compose `FormErrorDisplayDirective` directly so you can also forward `errorDisplayMode` and `warningDisplayMode` inputs:

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  createDebouncedPendingState,
  FormErrorDisplayDirective,
} from 'ngx-vest-forms';

@Component({
  selector: 'app-mat-field-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode', 'warningDisplayMode'],
    },
  ],
  host: {
    class: 'mat-form-field',
    '[class.mat-form-field-invalid]': 'errorDisplay.shouldShowErrors()',
    '[attr.aria-busy]': "errorDisplay.isPending() ? 'true' : null",
  },
  template: `
    <ng-content />

    @if (errorDisplay.shouldShowErrors()) {
      <div class="mat-error" role="status" aria-live="polite" aria-atomic="true">
        @for (error of errorDisplay.errors(); track error) {
          <span>{{ error }}</span>
        }
      </div>
    }

    @if (errorDisplay.shouldShowWarnings() && !errorDisplay.shouldShowErrors()) {
      <div class="mat-warn" role="status" aria-live="polite" aria-atomic="true">
        @for (warning of errorDisplay.warnings(); track warning) {
          <span>{{ warning }}</span>
        }
      </div>
    }

    @if (showPendingMessage()) {
      <div class="mat-hint" role="status" aria-live="polite" aria-atomic="true">
        Validating…
      </div>
    }
  `,
})
export class MatFieldWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });

  private readonly pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    { showAfter: 200, minimumDisplay: 500 }
  );

  protected readonly showPendingMessage = this.pendingState.showPendingMessage;
}
```

### Signals exposed by `FormErrorDisplayDirective`

Always render the **display signals** (`shouldShowErrors`, `errors`, `shouldShowWarnings`, `warnings`) in templates instead of the raw ones. While an async check re-runs, the display signals hold the last settled messages so text and `aria-invalid` do not flicker or re-announce; they update when the new result settles and clear immediately on `resetForm()` / `resetField()`.

| Signal | Type | Description |
| --- | --- | --- |
| `shouldShowErrors()` | `boolean` | Display-mode gated error visibility (held while pending) |
| `errors()` | `string[]` | Error messages to render (held while pending) |
| `shouldShowWarnings()` | `boolean` | Display-mode gated warning visibility (held while pending) |
| `warnings()` | `string[]` | Warning messages to render (held while pending) |
| `isPending()` | `boolean` | Pending state (false for pristine untouched controls) |
| `errorMessages()` | `string[]` | Raw current error messages (empty while pending) |
| `warningMessages()` | `string[]` | Raw current warning messages |
| `controlState()` | `FormControlState` | Snapshot of Angular control state |
| `isTouched()`, `isDirty()`, `isValid()`, `isInvalid()` | `boolean` | Angular control flags |
| `hasPendingValidation()` | `boolean` | Raw pending flag (including initial validation) |
| `hasBeenValidated()` | `boolean` | True after the first non-pending status change or touch |
| `updateOn()` | `'change' \| 'blur' \| 'submit'` | Control's `ngModelOptions.updateOn` strategy |
| `formSubmitted()` | `boolean` | Reactive signal tracking `NgForm.submitted` |

## Debounced pending state (`createDebouncedPendingState`)

To avoid flashing "Validating…" on fast async validators:

```ts
type DebouncedPendingStateOptions = {
  showAfter?: number; // Default: 200ms in utility (500ms in built-in wrappers)
  minimumDisplay?: number; // Default: 500ms
};

type DebouncedPendingStateOptionsInput =
  | DebouncedPendingStateOptions
  | Signal<DebouncedPendingStateOptions>;

type DebouncedPendingStateResult = {
  showPendingMessage: Signal<boolean>;
  cleanup: () => void;
};
```

- On built-in `<ngx-control-wrapper>` and `<ngx-form-group-wrapper>`, configure timings via `[pendingDebounce]="{ showAfter: 300, minimumDisplay: 500 }"` (default `{ showAfter: 500, minimumDisplay: 500 }`) and translate the label via `NGX_PENDING_LABEL`.
- Call `createDebouncedPendingState()` in an injection context (field initializer or constructor), or pass `{ injector }` as the third argument when calling it from `ngOnInit`.

## Low-level ARIA association utilities

If you build custom ARIA wiring without `FormErrorControlDirective`, ngx-vest-forms exports the same helpers it uses internally:

```ts
import {
  mergeAriaDescribedBy,
  parseAriaIdTokens,
  resolveAssociationTargets,
  type AriaAssociationMode,
} from 'ngx-vest-forms';
```

- `parseAriaIdTokens(value)` splits an `aria-describedby` string into unique tokens.
- `mergeAriaDescribedBy(existing, activeIds, ownedIds)` replaces only `ownedIds` while preserving consumer hint IDs.
- `resolveAssociationTargets(controls, mode)` filters controls according to `AriaAssociationMode`.

## Signal Forms controls inside a wrapper

A control inside `<ngx-control-wrapper>` does not have to be a native input or a `ControlValueAccessor`. Components implementing Angular Signal Forms `FormValueControl` (with a `value` model) or `FormCheckboxControl` (with a `checked` model) work directly with `[ngModel]` and `name`:

```html
<ngx-control-wrapper>
  <label for="seats">Seats</label>
  <app-seat-stepper inputId="seats" name="seats" [ngModel]="formValue().seats" />
</ngx-control-wrapper>
```

In Angular 22.2, `NgModel`'s custom-control path does not attach `NG_VALIDATORS` / `NG_ASYNC_VALIDATORS` to the `FormControl`. ngx-vest-forms attaches `NgModel`'s composed validators automatically after setup and revalidates the control, so Vest rules, `status()`, `errorsChange`, and `(submitSettled)` work with no extra directive. If registration never completes, dev mode logs [`NGX-108`](./TROUBLESHOOTING.md#ngx-108-signal-forms-control-not-registered-in-time).

Keep every rule in your Vest suite. In particular, on a `FormCheckboxControl`, Angular's `required` attribute does **not** mean "must be checked" (because `CheckboxRequiredValidator` only matches `input[type=checkbox]`). Write a Vest test instead:

```ts
test('acceptTerms', 'Accept the terms to continue', () => {
  enforce(model.acceptTerms).equals(true);
});
```

Give the control's inner interactive element a native input or an ARIA form-widget role (such as `role="switch"`) so `<ngx-control-wrapper>` attaches `aria-invalid` and `aria-describedby` automatically.

## Runnable examples

- `/accessible-wrapper` (`apps/examples/src/app/pages/accessible-wrapper-demo`) - Custom wrapper built on `FormErrorControlDirective`
- `/custom-controls` (`apps/examples/src/app/pages/custom-controls-form`) - `ControlValueAccessor` custom controls
- `/signal-forms-interop` (`apps/examples/src/app/pages/signal-forms-interop`) - `FormValueControl` and `FormCheckboxControl` with `[ngModel]`

## Related guides

- [Accessibility](./ACCESSIBILITY.md)
- [API tokens](./API-TOKENS.md)
- [ControlWrapperComponent README](../packages/ngx-vest-forms/src/lib/components/control-wrapper/README.md)
