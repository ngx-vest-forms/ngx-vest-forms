# Creating Custom Control Wrappers

If the default `sc-control-wrapper` doesn't meet your design requirements, you can easily create your own using the `FormErrorDisplayDirective`. This directive provides all the necessary state and logic for displaying errors, warnings, and pending states.

## Basic Custom Wrapper

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'app-custom-control-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode'],
    },
  ],
  template: `
    <div class="field-wrapper">
      <ng-content />

      @if (errorDisplay.shouldShowErrors()) {
        <div class="error-message">
          @for (error of errorDisplay.errors(); track error) {
            <span>{{ error.message || error }}</span>
          }
        </div>
      }

      @if (errorDisplay.isPending()) {
        <div class="validating">Validating...</div>
      }
    </div>
  `,
})
export class CustomControlWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
```

## Advanced Custom Wrapper with Warnings

The `FormErrorDisplayDirective` also exposes warning messages from Vest.js:

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'app-advanced-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FormErrorDisplayDirective],
  template: `
    <div class="form-field">
      <ng-content />

      <!-- Errors -->
      @if (errorDisplay.shouldShowErrors()) {
        <div class="errors" role="alert" aria-live="assertive">
          @for (error of errorDisplay.errors(); track error) {
            <p class="error">{{ error.message || error }}</p>
          }
        </div>
      }

      <!-- Warnings (non-blocking feedback) -->
      @if (errorDisplay.warnings().length > 0) {
        <div class="warnings" role="status" aria-live="polite">
          @for (warning of errorDisplay.warnings(); track warning) {
            <p class="warning">{{ warning }}</p>
          }
        </div>
      }

      <!-- Pending state -->
      @if (errorDisplay.isPending()) {
        <div class="pending" aria-busy="true">
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
  selector: 'app-mat-field-wrapper',
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
          <div class="mat-error" role="alert" aria-live="assertive">
            @for (error of errorDisplay.errors(); track error) {
              <span>{{ error.message || error }}</span>
            }
          </div>
        }

        @if (
          errorDisplay.warnings().length > 0 && !errorDisplay.shouldShowErrors()
        ) {
          <div class="mat-hint mat-warn" role="status">
            @for (warning of errorDisplay.warnings(); track warning) {
              <span>{{ warning }}</span>
            }
          </div>
        }

        @if (errorDisplay.isPending()) {
          <div class="mat-hint" aria-busy="true">
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

Once created, use your custom wrapper just like the built-in `sc-control-wrapper`:

```typescript
@Component({
  imports: [vestForms, CustomControlWrapperComponent],
  template: `
    <form scVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <app-custom-control-wrapper>
        <label>Email</label>
        <input name="email" [ngModel]="formValue().email" type="email" />
      </app-custom-control-wrapper>
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
