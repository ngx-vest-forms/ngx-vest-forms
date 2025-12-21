# Creating Custom Control Wrappers

## Recommended Pattern: HostDirective on Component

The **recommended approach** for error display is to use `FormErrorDisplayDirective` as a **hostDirective on a wrapper component** with content projection. This pattern:

- ✅ Provides clean separation of concerns (UI in template, logic in directive)
- ✅ Supports all directive features via `contentChild()` queries
- ✅ Enables reusable error display components across your application
- ✅ Follows Angular best practices for directive composition

If the default `ngx-control-wrapper` doesn't meet your design requirements, you can easily create your own custom wrapper component using this pattern.

## Basic Custom Wrapper (Recommended Pattern)

````typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-custom-control-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ✅ RECOMMENDED: Use FormErrorDisplayDirective as hostDirective
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode'],
    },
  ],
  template: `
    <div class="field-wrapper">
      <!-- Content projection enables contentChild() queries in the directive -->
      <ng-content />

      @if (errorDisplay.shouldShowErrors()) {
        <div class="error-message" role="status" aria-live="polite" aria-atomic="true">
          @for (error of errorDisplay.errors(); track error) {
            <span>{{ error }}</span>
          }
        </div>
      }

      @if (errorDisplay.isPending()) {
        <div class="validating" role="status" aria-live="polite" aria-atomic="true">
          Validating...
        </div>
      }
    </div>
  `,
})
export class CustomControlWrapperComponent {
  // Inject the hostDirective to access its signals and state
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}

## When you want automatic ARIA wiring (recommended)

If you want your custom wrapper to automatically:

- merge `aria-describedby` without clobbering consumer-provided IDs, and
- toggle `aria-invalid` when errors become visible

…use `FormErrorControlDirective` (it composes `FormErrorDisplayDirective` and adds ARIA + stable IDs).

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormErrorControlDirective } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-custom-error-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: FormErrorControlDirective,
      inputs: ['errorDisplayMode', 'ariaAssociationMode'],
    },
  ],
  template: `
    <div class="field-wrapper">
      <ng-content />

      <!-- Keep regions in the DOM so aria-describedby targets always exist -->
      <div [id]="ec.errorId" role="status" aria-live="polite" aria-atomic="true">
        @if (ec.errorDisplay.shouldShowErrors()) {
          @for (error of ec.errorDisplay.errors(); track error) {
            <div>{{ error }}</div>
          }
        }
      </div>

      <div [id]="ec.pendingId" role="status" aria-live="polite" aria-atomic="true">
        @if (ec.showPendingMessage()) {
          <div>Validating…</div>
        }
      </div>
    </div>
  `,
})
export class CustomErrorControlComponent {
  protected readonly ec = inject(FormErrorControlDirective, { self: true });
}
````

### Choosing an ARIA association mode

Both `<ngx-control-wrapper>` and `FormErrorControlDirective` support:

- `ariaAssociationMode="all-controls"` (default) — stamps all descendant controls
- `ariaAssociationMode="single-control"` — stamps only if exactly one control exists
- `ariaAssociationMode="none"` — **never** mutates descendant controls (group-safe)

If your wrapper targets an `NgModelGroup` container (or otherwise contains multiple controls), prefer using
`<ngx-form-group-wrapper>` instead of trying to make `<ngx-control-wrapper>` behave like a group wrapper.

If you still need a custom wrapper around a multi-control container, use `ariaAssociationMode="none"` so the
wrapper does not stamp `aria-describedby` / `aria-invalid` onto every descendant control.

`ariaAssociationMode="single-control"` is mainly useful when your wrapper _usually_ contains one control, but
may sometimes contain additional focusable elements (for example, an input with an adjacent “Clear” button).

## Preventing Flashing Validation Messages

For async validations, you may want to prevent the "Validating..." message from flashing when validation completes quickly. Use the `createDebouncedPendingState` utility:

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  FormErrorDisplayDirective,
  createDebouncedPendingState,
} from 'ngx-vest-forms';

@Component({
  selector: 'ngx-debounced-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FormErrorDisplayDirective],
  template: `
    <div class="field-wrapper">
      <ng-content />

      @if (errorDisplay.shouldShowErrors()) {
        <div
          class="error-message"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          @for (error of errorDisplay.errors(); track error) {
            <span>{{ error }}</span>
          }
        </div>
      }

      <!-- Only show after 200ms delay, keep visible for minimum 500ms -->
      @if (showPendingMessage()) {
        <div
          class="validating"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span class="spinner" aria-hidden="true"></span>
          Validating…
        </div>
      }
    </div>
  `,
})
export class DebouncedWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });

  // Debounced pending state prevents flashing for quick validations
  private readonly pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    { showAfter: 200, minimumDisplay: 500 }
  );

  protected readonly showPendingMessage = this.pendingState.showPendingMessage;
}
```

**How it works:**

- **200ms delay** — Validation message only shows if validation takes longer than 200ms
- **500ms minimum** — Once shown, message stays visible for at least 500ms to prevent flickering
- **Better UX** — Users don't see distracting flashes for quick async validations

**Options:**

```typescript
interface DebouncedPendingStateOptions {
  showAfter?: number; // Default: 200ms
  minimumDisplay?: number; // Default: 500ms
}
```

**Returns:**

```typescript
interface DebouncedPendingStateResult {
  showPendingMessage: Signal<boolean>; // Debounced signal
  cleanup: () => void; // Optional cleanup function
}
```

## Advanced Custom Wrapper with Warnings

The `FormErrorDisplayDirective` also exposes warning messages from Vest.js:

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-advanced-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FormErrorDisplayDirective],
  template: `
    <div class="form-field">
      <ng-content />

      <!-- Errors -->
      @if (errorDisplay.shouldShowErrors()) {
        <div class="errors" role="status" aria-live="polite" aria-atomic="true">
          @for (error of errorDisplay.errors(); track error) {
            <p class="error">{{ error }}</p>
          }
        </div>
      }

      <!-- Warnings (non-blocking feedback) -->
      @if (errorDisplay.warnings().length > 0) {
        <div
          class="warnings"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          @for (warning of errorDisplay.warnings(); track warning) {
            <p class="warning">{{ warning }}</p>
          }
        </div>
      }

      <!-- Pending state -->
      @if (errorDisplay.isPending()) {
        <div
          class="pending"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-busy="true"
        >
          <span class="spinner"></span>
          Validating...
        </div>
      }
    </div>
  `,
})
export class AdvancedWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
```

## Available Signals from FormErrorDisplayDirective

The directive exposes these computed signals for building custom UIs:

```typescript
// Error display control
shouldShowErrors(); // boolean - Whether to show errors based on mode and state
errors(); // string[] - Filtered errors (empty during pending)
warnings(); // string[] - Filtered warnings (empty during pending)
isPending(); // boolean - Whether async validation is running

// Raw state signals (from FormControlStateDirective)
errorMessages(); // string[] - All error messages
warningMessages(); // string[] - All warning messages
controlState(); // FormControlState - Complete control state
isTouched(); // boolean - Whether control has been touched
isDirty(); // boolean - Whether control value has changed
isValid(); // boolean - Whether control is valid
isInvalid(); // boolean - Whether control is invalid
hasPendingValidation(); // boolean - Whether validation is pending
updateOn(); // string - The ngModelOptions.updateOn value
formSubmitted(); // boolean - Whether form has been submitted
```

## Real-World Example: Material Design Style Wrapper

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-mat-field-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode'],
    },
  ],
  host: {
    class: 'mat-form-field',
    '[class.mat-form-field-invalid]': 'errorDisplay.shouldShowErrors()',
    '[attr.aria-busy]': "errorDisplay.isPending() ? 'true' : null",
  },
  template: `
    <div class="mat-form-field-wrapper">
      <div class="mat-form-field-flex">
        <ng-content />
      </div>

      <div class="mat-form-field-subscript-wrapper">
        @if (errorDisplay.shouldShowErrors()) {
          <div
            class="mat-error"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            @for (error of errorDisplay.errors(); track error) {
              <span>{{ error }}</span>
            }
          </div>
        }

        @if (
          errorDisplay.warnings().length > 0 && !errorDisplay.shouldShowErrors()
        ) {
          <div
            class="mat-hint mat-warn"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            @for (warning of errorDisplay.warnings(); track warning) {
              <span>{{ warning }}</span>
            }
          </div>
        }

        @if (errorDisplay.isPending()) {
          <div
            class="mat-hint"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-busy="true"
          >
            <mat-spinner diameter="16"></mat-spinner>
            Validating...
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 1rem;
      }

      .mat-error {
        color: #f44336;
        font-size: 0.875rem;
      }

      .mat-hint {
        color: rgba(0, 0, 0, 0.6);
        font-size: 0.875rem;
      }

      .mat-warn {
        color: #ff9800;
      }
    `,
  ],
})
export class MatFieldWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
```

## Using Your Custom Wrapper

Once created, use your custom wrapper just like the built-in `ngx-control-wrapper`:

```typescript
@Component({
  imports: [NgxVestForms, CustomControlWrapperComponent],
  template: `
    <form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <ngx-custom-control-wrapper>
        <label>Email</label>
        <input name="email" [ngModel]="formValue().email" type="email" />
      </ngx-custom-control-wrapper>
    </form>
  `
})
```

## Best Practices

1. **Use `hostDirectives`** - Always apply `FormErrorDisplayDirective` as a host directive for automatic state management
2. **Respect accessibility** - Use proper ARIA attributes (`role="alert"`, `aria-live`, `aria-busy`)
3. **Filter during pending** - The directive's `errors()` and `warnings()` signals automatically filter during validation
4. **Leverage computed signals** - All exposed signals are computed, so they update automatically
5. **Style based on state** - Use host bindings to apply CSS classes based on error display state

## When to Create Custom Wrappers

Create custom control wrappers when you need to:

- **Match design system** - Integrate with Material, PrimeNG, or custom design systems
- **Custom error formatting** - Display errors in specific layouts (inline, tooltip, popover)
- **Additional UI elements** - Add icons, help text, character counters
- **Complex accessibility** - Implement specific ARIA patterns for your use case
- **Framework integration** - Adapt to existing component libraries

The `FormErrorDisplayDirective` handles all the validation state management, so you can focus entirely on the presentation layer.
