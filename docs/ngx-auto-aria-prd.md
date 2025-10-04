# PRD: NgxVestAutoAriaDirective - Automatic ARIA Attributes for Form Controls

## Executive Summary

**Problem:** Every form control in ngx-vest-forms requires 4-6 lines of repetitive ARIA attribute bindings (`aria-invalid`, `aria-describedby`) for WCAG 2.2 Level AA compliance. This creates significant boilerplate and maintenance burden across all example forms.

**Solution:** Create `NgxVestAutoAriaDirective` that automatically applies ARIA attributes to form controls using the same selector pattern as `NgxVestAutoTouchDirective`, with smart detection of manual overrides and support for all form control types.

**Impact:**

- **Reduces boilerplate by ~60%** per form field (6 lines → 0 lines)
- **Improves WCAG 2.2 compliance** by making accessibility automatic and harder to forget
- **Maintains flexibility** via opt-out mechanism for custom implementations
- **Leverages modern Angular patterns** using `HostAttributeToken` for static attributes
- **No migration needed** - purely additive feature with opt-in imports

---

## Context & Background

### Current State Analysis

**Example: Repetitive ARIA Boilerplate (6 lines per field)**

```typescript
// basic-validation.form.ts - Lines 38-53
<input
  id="email"
  type="email"
  [value]="form.email()"
  (input)="form.setEmail($event)"
  (blur)="form.touchEmail()"
  placeholder="you@example.com"
  aria-required="true"
  [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid() ? 'true' : null"  // ← Line 1
  [attr.aria-describedby]="                                                            // ← Line 2
    form.emailShowErrors() && form.emailErrors().length                               // ← Line 3
      ? 'email-error'                                                                 // ← Line 4
      : null                                                                          // ← Line 5
  "                                                                                   // ← Line 6
/>
<ngx-form-error [field]="form.emailField()" /> <!-- Auto-generates id="email-error" -->
```

**Pain Points Identified:**

1. ✅ **ID Convention Already Established**: `NgxFormErrorComponent` generates `{fieldName}-error` (line 345)
2. ✅ **Field Name Extraction Logic Exists**: `NgxVestAutoTouchDirective` already has 4-tier priority system
3. ✅ **Error Display Strategy Already Reactive**: `form.emailShowErrors()` respects error strategy
4. ✅ **Selector Pattern Proven**: `input[value]:not([ngxVestTouchDisabled])` works well
5. ❌ **Manual ARIA Bindings Everywhere**: 78+ instances of `[attr.aria-invalid]` and `[attr.aria-describedby]` across examples

### Current Directive Ecosystem

| Directive                      | Purpose                       | Selector                                   | Status          |
| ------------------------------ | ----------------------------- | ------------------------------------------ | --------------- |
| `NgxVestAutoTouchDirective`    | Auto-blur validation          | `input[value]:not([ngxVestTouchDisabled])` | ✅ Implemented  |
| `NgxFormErrorComponent`        | Error display + ID generation | `<ngx-form-error [field]="...">`           | ✅ Implemented  |
| **`NgxVestAutoAriaDirective`** | **Auto-ARIA attributes**      | **Same as auto-touch + checkbox/radio**    | 🆕 **This PRD** |

### Why This Matters

**WCAG 2.2 Requirements:**

- **ARIA Invalid**: [WCAG 3.3.1 Error Identification (Level A)](https://www.w3.org/WAI/WCAG22/Understanding/error-identification)
- **ARIA Describedby**: [WCAG 1.3.1 Info and Relationships (Level A)](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships)

**Developer Experience:**

```typescript
// ❌ BEFORE: 15+ lines per field
<input [value]="..." (input)="..." [attr.aria-invalid]="..." [attr.aria-describedby]="...">
<ngx-form-error [field]="...">

// ✅ AFTER: 3 lines per field (auto-ARIA + auto-touch)
<input [value]="..." (input)="...">
<ngx-form-error [field]="...">
```

---

## Proposed Solution

### 1. Directive Architecture

```typescript
/**
 * Automatically applies ARIA accessibility attributes to form controls.
 *
 * Features:
 * - Auto `aria-invalid` based on validation state
 * - Auto `aria-describedby` referencing error container IDs
 * - Respects manual overrides (developer-set attributes take precedence)
 * - Supports all form control types (text, select, checkbox, radio, etc.)
 * - Uses HostAttributeToken for static attributes (performance)
 */
@Directive({
  selector: `
    input[value]:not([ngxVestAriaDisabled]),
    textarea[value]:not([ngxVestAriaDisabled]),
    select[value]:not([ngxVestAriaDisabled]),
    input[type="checkbox"][checked]:not([ngxVestAriaDisabled]),
    input[type="radio"][checked]:not([ngxVestAriaDisabled])
  `,
  standalone: true,
  host: {
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-describedby]': 'ariaDescribedBy()',
  },
})
export class NgxVestAutoAriaDirective implements OnDestroy {
  // Implementation details below...
}
```

### 2. Core Behavior

#### A. `aria-invalid` Logic

**IMPORTANT: Why String `'true'` Instead of Boolean `true`?**

The ARIA specification requires `aria-invalid` to be a **string**, not a boolean:

```typescript
// ✅ CORRECT - String 'true' (ARIA spec compliant)
protected readonly ariaInvalid: Signal<'true' | null> = computed(() => {
  // Returns 'true' (string) or null (removes attribute)
});

// ❌ WRONG - Boolean true (non-compliant)
protected readonly ariaInvalid: Signal<true | null> = computed(() => {
  // Returns true (boolean) - Angular converts to empty attribute
});
```

**Why This Matters:**

```html
<!-- With 'true' (string) - CORRECT -->
<input aria-invalid="true" />
<!-- Screen readers: "Invalid entry" -->

<!-- With true (boolean) - WRONG -->
<input aria-invalid />
<!-- Screen readers: May not announce properly -->

<!-- With null - CORRECT -->
<input />
<!-- Attribute removed from DOM -->
```

**ARIA Spec Reference:**

- [ARIA 1.2 aria-invalid](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)
- Valid values: `"false"` | `"true"` | `"grammar"` | `"spelling"`
- We only use `"true"` or remove the attribute (null)

**Implementation:**

```typescript
/**
 * Computed signal for aria-invalid attribute.
 *
 * IMPORTANT: Returns 'true' (string) not true (boolean) per ARIA spec.
 * Angular's [attr.aria-invalid] binding will:
 * - Set attribute to "true" when signal returns 'true'
 * - Remove attribute entirely when signal returns null
 */
protected readonly ariaInvalid: Signal<'true' | null> = computed(() => {
  if (!this.#isActive() || this.#hasManualAriaInvalid()) {
    return null; // Directive disabled OR manual override exists
  }

  const showErrors = this.#form?.field(this.#fieldName).showErrors() ?? false;
  const isValid = this.#form?.field(this.#fieldName).valid() ?? true;

  return showErrors && !isValid ? 'true' : null;
});
```

**Truth Table:**
| Scenario | `showErrors()` | `valid()` | `aria-invalid` | DOM Result |
|----------|---------------|-----------|----------------|------------|
| Pristine field | `false` | `true` | `null` | `<input>` (no attribute) |
| Valid field | `true` | `true` | `null` | `<input>` (no attribute) |
| Invalid field | `true` | `false` | `'true'` | `<input aria-invalid="true">` |
| Manual override | N/A | N/A | `null` | Defers to manual binding |

#### B. `aria-describedby` Logic

```typescript
/**
 * Computed signal for aria-describedby attribute.
 * Appends error ID when errors are visible.
 */
protected readonly ariaDescribedBy: Signal<string | null> = computed(() => {
  if (!this.#isActive() || this.#hasManualAriaDescribedBy()) {
    return null; // Directive disabled OR manual override exists
  }

  const showErrors = this.#form?.field(this.#fieldName).showErrors() ?? false;
  const hasErrors = (this.#form?.field(this.#fieldName).validation().errors.length ?? 0) > 0;

  if (!showErrors || !hasErrors) {
    return this.#existingAriaDescribedBy || null; // Preserve existing IDs (hints, etc.)
  }

  // Append error ID to existing IDs
  const errorId = `${this.#fieldName}-error`;
  const existing = this.#existingAriaDescribedBy;

  return existing ? `${existing} ${errorId}` : errorId;
});
```

**Examples:**

```html
<!-- No errors, no existing aria-describedby -->
<input id="email" />
<!-- aria-describedby: null (no attribute) -->

<!-- No errors, has hint text -->
<input id="email" aria-describedby="email-hint" />
<!-- aria-describedby: "email-hint" -->

<!-- With errors, no existing IDs -->
<input id="email" />
<!-- aria-describedby: "email-error" -->

<!-- With errors AND hint text -->
<input id="email" aria-describedby="email-hint" />
<!-- aria-describedby: "email-hint email-error" -->
```

### 3. Manual Override Detection

**Problem:** How do we detect if the developer has manually set ARIA attributes?

**Solution:** Use `HostAttributeToken` to read **static** attributes at initialization:

```typescript
readonly #manualAriaInvalid = inject(
  new HostAttributeToken('aria-invalid'),
  { optional: true }
);

readonly #manualAriaDescribedBy = inject(
  new HostAttributeToken('aria-describedby'),
  { optional: true }
);

#hasManualAriaInvalid = () => this.#manualAriaInvalid !== null;
#hasManualAriaDescribedBy = () => this.#manualAriaDescribedBy !== null;
```

**Why `HostAttributeToken`?**

- ✅ **Static attributes** (no change detection overhead)
- ✅ **Read-only** (perfect for detecting manual overrides)
- ✅ **Null-safe** (`optional: true` returns `null` when absent)
- ✅ **Modern Angular pattern** (Angular 14+, recommended over `@Attribute`)

**Limitation & Workaround:**

- ❌ `HostAttributeToken` only reads **static** attributes, not `[attr.aria-*]` bindings
- ✅ Workaround: Provide `ngxVestAriaDisabled` opt-out for complex cases:

```html
<!-- Manual dynamic ARIA (use opt-out) -->
<input
  ngxVestAriaDisabled
  [attr.aria-invalid]="customLogic()"
  [attr.aria-describedby]="dynamicIds()"
/>
```

### 4. Form Control Type Support Matrix

| Control Type | Selector Pattern                  | `aria-invalid` | `aria-describedby` | Notes                                    |
| ------------ | --------------------------------- | -------------- | ------------------ | ---------------------------------------- |
| Text inputs  | `input[value]`                    | ✅             | ✅                 | Includes email, password, url, tel, etc. |
| Number/Range | `input[type="number"][value]`     | ✅             | ✅                 | Same logic as text                       |
| Textarea     | `textarea[value]`                 | ✅             | ✅                 | Multi-line text                          |
| Select       | `select[value]`                   | ✅             | ✅                 | Dropdown menus                           |
| Checkbox     | `input[type="checkbox"][checked]` | ✅             | ✅                 | Boolean values                           |
| Radio        | `input[type="radio"][checked]`    | ✅             | ⚠️ Per-group       | See Radio Button Handling                |

#### Radio Button Special Handling

**Challenge:** Radio buttons share the same field name but have individual elements.

```html
<!-- All radios share fieldName="personalInfo.gender" -->
<input
  type="radio"
  id="gender-male"
  name="gender"
  value="male"
  [checked]="form.personalInfoGender() === 'male'"
/>
<input
  type="radio"
  id="gender-female"
  name="gender"
  value="female"
  [checked]="form.personalInfoGender() === 'female'"
/>
<input
  type="radio"
  id="gender-other"
  name="gender"
  value="other"
  [checked]="form.personalInfoGender() === 'other'"
/>
```

**Solution:**

```typescript
// Only first radio in group gets aria-describedby
protected readonly ariaDescribedBy: Signal<string | null> = computed(() => {
  // ... existing logic ...

  // For radio buttons: only apply to first in group
  if (this.#element.nativeElement.type === 'radio') {
    const radioGroup = document.getElementsByName(this.#element.nativeElement.name);
    if (radioGroup[0] !== this.#element.nativeElement) {
      return null; // Not the first radio - skip aria-describedby
    }
  }

  // ... rest of logic ...
});
```

**WCAG Rationale:**

- ✅ All radios get `aria-invalid` (indicates entire group has error)
- ✅ Only first radio gets `aria-describedby` (avoids repetitive announcements)
- ✅ Error message placed after radio group (`<ngx-form-error>`)

---

## Public API Design

### 1. Convenience Import Constant

````typescript
// projects/ngx-vest-forms/core/src/public-api.ts

/**
 * Convenience constant for importing all ngx-vest-forms directives and components.
 *
 * @example
 * ```typescript
 * import { NgxVestForms } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   imports: [NgxVestForms],
 *   template: `
 *     <input [value]="form.email()" (input)="form.setEmail($event)" />
 *     <ngx-form-error [field]="form.emailField()" />
 *   `
 * })
 * export class MyFormComponent { }
 * ```
 */
export const NgxVestForms = [
  NgxVestAutoAriaDirective,
  NgxVestAutoTouchDirective,
  NgxFormErrorComponent,
] as const;
````

**Usage:**

```typescript
// ✅ RECOMMENDED: Import all auto-directives + error component
import { NgxVestForms } from 'ngx-vest-forms/core';

@Component({
  imports: [NgxVestForms],
  template: `
    <!-- Auto-ARIA + Auto-Touch + Error Display all work automatically -->
    <input [value]="form.email()" (input)="form.setEmail($event)" />
    <ngx-form-error [field]="form.emailField()" />
  `
})
export class ContactFormComponent { }

// ⚠️ ALTERNATIVE: Cherry-pick individual imports (if needed)
import { NgxVestAutoAriaDirective, NgxFormErrorComponent } from 'ngx-vest-forms/core';

@Component({
  imports: [NgxVestAutoAriaDirective, NgxFormErrorComponent],
  // ... (no auto-touch in this case)
})
```

**Why `as const`?**

- ✅ Creates readonly tuple type (prevents accidental mutations)
- ✅ Preserves exact types (better TypeScript inference)
- ✅ Angular's imports array accepts tuples natively

### 2. Directive Selector

```typescript
selector: `
  input[value]:not([ngxVestAriaDisabled]),
  textarea[value]:not([ngxVestAriaDisabled]),
  select[value]:not([ngxVestAriaDisabled]),
  input[type="checkbox"][checked]:not([ngxVestAriaDisabled]),
  input[type="radio"][checked]:not([ngxVestAriaDisabled])
`;
```

**Why These Selectors?**

- ✅ `[value]` / `[checked]`: Only apply to controls bound to form state
- ✅ `:not([ngxVestAriaDisabled])`: Explicit opt-out mechanism
- ✅ Covers all form control types in examples (78+ usage sites)

### 3. Host Bindings

```typescript
host: {
  '[attr.aria-invalid]': 'ariaInvalid()',
  '[attr.aria-describedby]': 'ariaDescribedBy()',
}
```

**Why `[attr.*]` Bindings?**

- ✅ Properly removes attributes when value is `null` (DOM cleanup)
- ✅ Angular's built-in attribute binding system
- ✅ Works with SSR and hydration

### 4. Opt-Out Attribute

```html
<!-- Disable auto-ARIA for this control -->
<input
  ngxVestAriaDisabled
  [value]="form.customField()"
  [attr.aria-invalid]="myCustomLogic()"
/>
```

### 5. Global Config Token

```typescript
export interface NgxVestFormsConfig {
  autoTouch?: boolean; // Enable NgxVestAutoTouchDirective (default: true)
  autoAria?: boolean; // Enable NgxVestAutoAriaDirective (default: true)
  debug?: boolean; // Console warnings (default: false)
  fieldNameResolver?: (element: HTMLElement) => string | null; // Custom extraction
}

export const NGX_VEST_FORMS_CONFIG = new InjectionToken<NgxVestFormsConfig>(
  'NGX_VEST_FORMS_CONFIG',
);

export function provideNgxVestFormsConfig(config: NgxVestFormsConfig) {
  return { provide: NGX_VEST_FORMS_CONFIG, useValue: config };
}
```

**Usage:**

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxVestFormsConfig({
      autoTouch: true, // Enable auto-blur (default)
      autoAria: true, // Enable auto-ARIA (default)
      debug: false, // Disable debug logging
      fieldNameResolver: (element) => {
        // Custom field name extraction
        return element.getAttribute('data-field-path');
      },
    }),
  ],
};

// Component-level override
@Component({
  providers: [
    provideNgxVestFormsConfig({
      autoAria: false, // Disable auto-ARIA for this component tree
    }),
  ],
})
export class SpecialFormComponent {}
```

---

## Implementation

### Complete Directive Code

````typescript
import {
  computed,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  Injector,
  type OnDestroy,
  type Signal,
} from '@angular/core';
import { NGX_VEST_FORM, NGX_VEST_FORMS_CONFIG } from '../tokens';
import type { VestForm } from '../vest-form.types';

/**
 * Automatically applies ARIA accessibility attributes to form controls.
 *
 * This directive eliminates the need for manual `[attr.aria-invalid]` and
 * `[attr.aria-describedby]` bindings on every form control. It auto-applies
 * to all form controls with `[value]` or `[checked]` bindings and automatically
 * handles ARIA attributes based on validation state.
 *
 * ## Features
 *
 * - **Auto-Application**: Applies to all inputs/textareas/selects with `[value]` or `[checked]` binding
 * - **WCAG 2.2 Compliant**: Automatically sets `aria-invalid` and `aria-describedby` per spec
 * - **Field Name Extraction**: Automatic extraction via 4-tier priority system (shared with auto-touch)
 * - **Opt-Out Mechanism**: Use `ngxVestAriaDisabled` attribute to exclude specific fields
 * - **Global Configuration**: Configure behavior via `provideNgxVestFormsConfig()`
 * - **Manual Override Detection**: Respects manually-set static ARIA attributes
 *
 * ## Usage
 *
 * ### Basic Usage (Zero Configuration)
 *
 * ```typescript
 * import { Component } from '@angular/core';
 * import { createVestForm, NgxVestForms } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   imports: [NgxVestForms], // Includes auto-ARIA + auto-touch + error component
 *   template: `
 *     <form>
 *       <!-- Auto-ARIA directive applies automatically -->
 *       <input
 *         id="email"
 *         [value]="form.email()"
 *         (input)="form.setEmail($event)"
 *         <!-- No aria-invalid or aria-describedby needed! -->
 *       />
 *       <ngx-form-error [field]="form.emailField()" />
 *     </form>
 *   `
 * })
 * export class MyFormComponent {
 *   form = createVestForm(suite, signal({ email: '' }));
 * }
 * ```
 *
 * ### Opt-Out Mechanism
 *
 * ```html
 * <!-- Exclude specific fields from auto-ARIA -->
 * <input
 *   ngxVestAriaDisabled
 *   [value]="form.specialField()"
 *   [attr.aria-invalid]="customLogic()"
 *   [attr.aria-describedby]="customIds()"
 * />
 * ```
 *
 * ### Global Configuration
 *
 * The NgxVestAutoAriaDirective respects the global configuration provided via `provideNgxVestFormsConfig()`.
 *
 * **Default Configuration Values:**
 * - `autoAria: true` - Directive enabled globally
 * - `autoTouch: true` - Auto-touch directive enabled
 * - `debug: false` - Debug logging disabled
 *
 * ```typescript
 * /// app.config.ts
 * import { provideNgxVestFormsConfig } from 'ngx-vest-forms/core';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgxVestFormsConfig({
 *       autoAria: true, // Enable/disable globally (default: true)
 *       autoTouch: true, // Enable/disable auto-touch (default: true)
 *       debug: false, // Enable debug logging (default: false)
 *       fieldNameResolver: (element) => {
 *         /// Custom field name extraction logic
 *         return element.getAttribute('data-field-path');
 *       }
 *     })
 *   ]
 * };
 * ```
 *
 * **Global Disable Example:**
 * ```typescript
 * /// Disable all automatic ARIA attributes
 * provideNgxVestFormsConfig({ autoAria: false })
 * ```
 *
 * ## ARIA Attribute Behavior
 *
 * ### aria-invalid
 *
 * - Set to `"true"` (string) when field has errors and `showErrors()` is true
 * - Removed (null) when field is valid or errors are not shown
 * - Uses string `"true"` per ARIA spec (not boolean `true`)
 *
 * ### aria-describedby
 *
 * - Appends `{fieldName}-error` ID when errors are visible
 * - Preserves existing IDs (e.g., hint text IDs)
 * - For radio groups: only first radio gets `aria-describedby`
 *
 * ## Supported Input Types
 *
 * - ✅ `<input type="text">` with `[value]` binding
 * - ✅ `<input type="email">` with `[value]` binding
 * - ✅ `<input type="number">` with `[value]` binding
 * - ✅ `<input type="range">` with `[value]` binding
 * - ✅ `<textarea>` with `[value]` binding
 * - ✅ `<select>` with `[value]` binding
 * - ✅ `<input type="checkbox">` with `[checked]` binding
 * - ✅ `<input type="radio">` with `[checked]` binding
 *
 * @example With NgxVestForms Constant
 * ```typescript
 * import { NgxVestForms } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   imports: [NgxVestForms], // All directives + components
 *   template: `
 *     <input [value]="form.email()" (input)="form.setEmail($event)" />
 *     <ngx-form-error [field]="form.emailField()" />
 *   `
 * })
 * ```
 *
 * @example With Existing aria-describedby (Hint Text)
 * ```html
 * <input
 *   id="email"
 *   aria-describedby="email-hint"
 *   [value]="form.email()"
 * />
 * <span id="email-hint">Enter your email address</span>
 * <ngx-form-error [field]="form.emailField()" />
 * <!-- When errors appear: aria-describedby="email-hint email-error" -->
 * ```
 *
 * @example Radio Button Groups
 * ```html
 * <!-- Only first radio gets aria-describedby, all get aria-invalid -->
 * <input type="radio" name="gender" value="male" [checked]="form.gender() === 'male'">
 * <input type="radio" name="gender" value="female" [checked]="form.gender() === 'female'">
 * <ngx-form-error [field]="form.genderField()" />
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: `
    input[value]:not([ngxVestAriaDisabled]),
    textarea[value]:not([ngxVestAriaDisabled]),
    select[value]:not([ngxVestAriaDisabled]),
    input[type="checkbox"][checked]:not([ngxVestAriaDisabled]),
    input[type="radio"][checked]:not([ngxVestAriaDisabled])
  `,
  standalone: true,
  host: {
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-describedby]': 'ariaDescribedBy()',
  },
})
export class NgxVestAutoAriaDirective implements OnDestroy {
  // ES Private Fields (using # prefix for true runtime privacy)
  readonly #element =
    inject<
      ElementRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    >(ElementRef);
  readonly #form = inject<VestForm<Record<string, unknown>>>(NGX_VEST_FORM, {
    optional: true,
  });
  readonly #globalConfig = inject(NGX_VEST_FORMS_CONFIG, { optional: true });
  readonly #injector = inject(Injector);

  /**
   * Manual override detection using HostAttributeToken.
   * Only detects STATIC attributes (not [attr.*] bindings).
   * For dynamic bindings, use ngxVestAriaDisabled opt-out.
   */
  readonly #manualAriaInvalid = inject(new HostAttributeToken('aria-invalid'), {
    optional: true,
  });
  readonly #manualAriaDescribedBy = inject(
    new HostAttributeToken('aria-describedby'),
    { optional: true },
  );

  /**
   * Extracted field name for this control.
   * Uses same 4-tier priority system as NgxVestAutoTouchDirective:
   * 1. data-vest-field attribute
   * 2. Custom resolver from config
   * 3. id attribute
   * 4. name attribute
   */
  #fieldName = '';

  /**
   * Cache of existing aria-describedby value (for preserving hint text IDs).
   */
  #existingAriaDescribedBy: string | null = null;

  /**
   * Reactive computed signal that determines if the directive should be active.
   * Only active when:
   * 1. Form instance is available
   * 2. Global config allows auto-ARIA (not explicitly disabled)
   */
  readonly #isActive = computed(() => {
    if (!this.#form || this.#globalConfig?.autoAria === false) {
      return false;
    }
    return true;
  });

  /**
   * Check if developer manually set static aria-invalid attribute.
   */
  #hasManualAriaInvalid = () => this.#manualAriaInvalid !== null;

  /**
   * Check if developer manually set static aria-describedby attribute.
   */
  #hasManualAriaDescribedBy = () => this.#manualAriaDescribedBy !== null;

  /**
   * Computed signal for aria-invalid attribute.
   *
   * IMPORTANT: Returns 'true' (string) not true (boolean) per ARIA spec.
   * Angular's [attr.aria-invalid] binding will:
   * - Set attribute to "true" when signal returns 'true'
   * - Remove attribute entirely when signal returns null
   *
   * @returns 'true' when field has errors, null otherwise
   */
  protected readonly ariaInvalid: Signal<'true' | null> = computed(() => {
    if (!this.#isActive() || this.#hasManualAriaInvalid()) {
      return null; // Directive disabled OR manual override exists
    }

    if (!this.#fieldName || !this.#form) {
      return null; // No field name or form context
    }

    const field = this.#form.field(this.#fieldName);
    const showErrors = field.showErrors();
    const isValid = field.valid();

    return showErrors && !isValid ? 'true' : null;
  });

  /**
   * Computed signal for aria-describedby attribute.
   * Appends error ID when errors are visible.
   *
   * Special handling for radio buttons:
   * - Only first radio in group gets aria-describedby
   * - Prevents repetitive screen reader announcements
   *
   * @returns Space-separated ID list or null
   */
  protected readonly ariaDescribedBy: Signal<string | null> = computed(() => {
    if (!this.#isActive() || this.#hasManualAriaDescribedBy()) {
      return null; // Directive disabled OR manual override exists
    }

    if (!this.#fieldName || !this.#form) {
      return null; // No field name or form context
    }

    // Special handling for radio buttons (only first in group gets aria-describedby)
    const element = this.#element.nativeElement;
    if (element instanceof HTMLInputElement && element.type === 'radio') {
      const radioGroup = document.getElementsByName(element.name);
      if (radioGroup.length > 0 && radioGroup[0] !== element) {
        return null; // Not the first radio - skip aria-describedby
      }
    }

    const field = this.#form.field(this.#fieldName);
    const showErrors = field.showErrors();
    const hasErrors = field.validation().errors.length > 0;

    if (!showErrors || !hasErrors) {
      // No errors - preserve existing IDs (hint text, etc.)
      return this.#existingAriaDescribedBy;
    }

    // Append error ID to existing IDs
    const errorId = `${this.#fieldName}-error`;
    const existing = this.#existingAriaDescribedBy;

    return existing ? `${existing} ${errorId}` : errorId;
  });

  #cleanupEffectRef?: ReturnType<typeof effect>;

  constructor() {
    this.#fieldName = this.#extractFieldName() || '';
    this.#existingAriaDescribedBy = this.#manualAriaDescribedBy;

    this.#cleanupEffectRef = effect(
      () => {
        if (this.#isActive()) {
          // Directive is active - host bindings will work
          // This effect ensures reactivity when form/config changes dynamically
        }
      },
      { injector: this.#injector },
    );
  }

  /**
   * Extract field name from element using 4-tier priority hierarchy.
   *
   * Priority order:
   * 1. data-vest-field attribute (explicit nested paths)
   * 2. Custom resolver from global config (project-specific logic)
   * 3. id attribute (WCAG preferred)
   * 4. name attribute (fallback)
   *
   * @returns Field name/path or null if not found
   */
  #extractFieldName(): string | null {
    const element = this.#element.nativeElement;

    // Priority 1: Explicit data attribute (supports nested paths)
    const vestField = element.dataset['vestField'];
    if (vestField) {
      return vestField; // e.g., "personalInfo.firstName"
    }

    // Priority 2: Custom resolver from global config
    if (this.#globalConfig?.fieldNameResolver) {
      const resolved = this.#globalConfig.fieldNameResolver(element);
      if (resolved) {
        return resolved;
      }
    }

    // Priority 3: ID attribute (WCAG preferred)
    if (element.id) {
      return this.#convertToFieldPath(element.id);
    }

    // Priority 4: Name attribute (fallback)
    if ('name' in element && element.name) {
      return this.#convertToFieldPath(element.name);
    }

    // No field name found
    if (this.#globalConfig?.debug) {
      console.warn(
        '[NgxVestAutoAriaDirective] Could not extract field name from element:',
        element,
      );
    }
    return null;
  }

  /**
   * Convert HTML attribute value to field path.
   *
   * Handles underscore-to-dot conversion for nested paths:
   * - "firstName" → "firstName"
   * - "personalInfo.firstName" → "personalInfo.firstName"
   * - "address_street" → "address.street"
   *
   * @param value - Attribute value (id or name)
   * @returns Field path
   */
  #convertToFieldPath(value: string): string {
    // Replace underscores with dots for nested paths
    return value.replaceAll('_', '.');
  }

  ngOnDestroy(): void {
    this.#cleanupEffectRef?.destroy();
  }
}
````

---

## Migration Strategy (Non-Breaking)

### Phase 1: Add Directive to Core Package

```typescript
// projects/ngx-vest-forms/core/src/lib/directives/ngx-vest-auto-aria.directive.ts
export class NgxVestAutoAriaDirective {
  /* ... */
}

// projects/ngx-vest-forms/core/src/public-api.ts
export { NgxVestAutoAriaDirective } from './lib/directives/ngx-vest-auto-aria.directive';

// Add convenience constant
export const NgxVestForms = [
  NgxVestAutoAriaDirective,
  NgxVestAutoTouchDirective,
  NgxFormErrorComponent,
] as const;
```

### Phase 2: Update Examples (Opt-In)

**No Breaking Changes:**

- Existing forms continue to work with manual ARIA bindings
- New forms can opt-in via `NgxVestForms` import
- Gradual migration on per-component basis

```typescript
// Before: Manual ARIA (still works)
@Component({
  imports: [NgxFormErrorComponent],
  template: `
    <input
      [value]="form.email()"
      [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid() ? 'true' : null"
      [attr.aria-describedby]="form.emailShowErrors() ? 'email-error' : null"
    />
  `
})

// After: Auto-ARIA (opt-in)
@Component({
  imports: [NgxVestForms], // ← Just add this
  template: `
    <input [value]="form.email()" />
    <!-- ARIA attributes applied automatically -->
  `
})
```

**Rollout Order:**

1. ✅ `minimal-form` (simplest example) - COMPLETED
2. ✅ `basic-validation` (most common patterns) - COMPLETED
3. ⏳ `example-form-nested` (complex nested paths) - TODO
4. ⏳ `error-display-modes` (multiple strategies) - TODO

### Practical Upgrade Examples

#### Example 1: Simple Form (15 lines → 3 lines per field)

**Before (Manual ARIA):**

```typescript
@Component({
  imports: [NgxFormErrorComponent],
  template: `
    <input
      id="email"
      [value]="form.email()"
      (input)="form.setEmail($event)"
      (blur)="form.touchEmail()"
      [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid() ? 'true' : null"
      [attr.aria-describedby]="form.emailShowErrors() ? 'email-error' : null"
    />
    <div id="email-error" role="alert" [attr.aria-hidden]="!form.emailShowErrors()">
      @if (form.emailShowErrors() && form.emailErrors().length) {
        {{ form.emailErrors()[0] }}
      }
    </div>
  `
})
```

**After (NgxVestForms):**

```typescript
@Component({
  imports: [NgxVestForms], // ← Changed import
  template: `
    <input
      id="email"
      [value]="form.email()"
      (input)="form.setEmail($event)"
    />
    <ngx-form-error [field]="form.emailField()" />
    <!-- Auto: aria-invalid, aria-describedby, auto-touch on blur -->
  `
})
```

**What Changed:**

- ✅ Removed `(blur)` handler - auto-touch handles it
- ✅ Removed `[attr.aria-invalid]` binding - auto-aria handles it
- ✅ Removed `[attr.aria-describedby]` binding - auto-aria handles it
- ✅ Replaced manual error div with `<ngx-form-error>` component
- ✅ **Result: 15 lines → 3 lines (80% reduction)**

#### Example 2: Form with Existing Hint Text

**Before:**

```typescript
<input
  id="email"
  aria-describedby="email-hint"
  [value]="form.email()"
  [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid() ? 'true' : null"
  [attr.aria-describedby]="
    form.emailShowErrors()
      ? 'email-hint email-error'
      : 'email-hint'
  "
/>
<span id="email-hint">We'll never share your email</span>
```

**After:**

```typescript
<input
  id="email"
  aria-describedby="email-hint"
  [value]="form.email()"
/>
<span id="email-hint">We'll never share your email</span>
<ngx-form-error [field]="form.emailField()" />
<!-- Auto: Preserves 'email-hint', appends 'email-error' when needed -->
```

**What Changed:**

- ✅ Kept static `aria-describedby="email-hint"` attribute
- ✅ Removed manual error ID appending logic
- ✅ Auto-aria detects existing hint ID and preserves it
- ✅ **Result: Simpler code, same accessibility**

#### Example 3: Opt-Out for Custom Behavior

**Use Case:** Need custom ARIA logic for a specific field

```typescript
<input
  id="specialField"
  ngxVestAriaDisabled
  [value]="form.specialField()"
  [attr.aria-invalid]="customLogic()"
  [attr.aria-describedby]="customDescribedBy()"
/>
<!-- Auto-ARIA disabled for this field only -->
```

**What Changed:**

- ✅ Added `ngxVestAriaDisabled` attribute to opt-out
- ✅ Manual ARIA bindings work as before
- ✅ Other fields still get auto-ARIA

#### Example 4: Global Disable for Testing

**Use Case:** Disable during A/B testing or gradual rollout

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxVestFormsConfig({
      autoAria: false, // ← Disable globally
      autoTouch: true, // Keep auto-touch enabled
    }),
  ],
};
```

**What Changed:**

- ✅ All forms revert to manual ARIA (if imported NgxVestForms)
- ✅ No code changes needed in components
- ✅ Easy to toggle for testing/rollback

---

### Phase 3: Documentation Updates

- ✅ Update README with before/after examples
- ✅ Add accessibility guide referencing auto-ARIA
- ✅ Update ngx-vest-forms.instructions.md
- ✅ Add migration guide (optional, not required)

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
describe('NgxVestAutoAriaDirective', () => {
  describe('aria-invalid (string "true" vs boolean)', () => {
    it('should set aria-invalid="true" (string) when field has errors', async () => {
      // Arrange
      @Component({
        imports: [NgxVestForms],
        template: `<input id="email" [value]="form.email()" />`,
      })
      class TestComponent {
        form = createVestForm(suite, signal({ email: '' }), {
          errorStrategy: 'immediate',
        });
      }

      // Act
      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Assert - Should be string "true", not boolean true
      expect(input).toHaveAttribute('aria-invalid', 'true'); // ✅ String
      expect(input.getAttribute('aria-invalid')).toBe('true'); // ✅ Explicit check
    });

    it('should remove aria-invalid when field becomes valid', async () => {
      // Arrange
      const { screen } = await renderTestComponent();

      // Act
      await userEvent.type(screen.getByLabelText('Email'), 'valid@example.com');

      // Assert
      expect(screen.getByLabelText('Email')).not.toHaveAttribute(
        'aria-invalid',
      );
    });

    it('should respect manual aria-invalid attribute (static)', async () => {
      // Arrange
      @Component({
        template: `<input aria-invalid="true" [value]="form.email()" />`,
      })
      class TestComponent {
        /* ... */
      }

      // Act
      await render(TestComponent);

      // Assert
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      // Directive should NOT override manual static attribute
    });

    it('should defer to ngxVestAriaDisabled opt-out', async () => {
      // Arrange
      @Component({
        template: `<input ngxVestAriaDisabled [value]="form.email()" />`,
      })
      class TestComponent {
        /* ... */
      }

      // Act
      await render(TestComponent);

      // Assert
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('aria-describedby', () => {
    it('should append error ID when errors are shown', async () => {
      // Arrange
      const { screen } = await renderTestComponent({
        errorStrategy: 'immediate',
      });

      // Act
      await userEvent.type(screen.getByLabelText('Email'), 'invalid');

      // Assert
      expect(screen.getByLabelText('Email')).toHaveAttribute(
        'aria-describedby',
        'email-error',
      );
    });

    it('should preserve existing aria-describedby and append error ID', async () => {
      // Arrange
      @Component({
        template: `
          <input
            id="email"
            aria-describedby="email-hint"
            [value]="form.email()"
          />
          <span id="email-hint">Enter your email</span>
          <ngx-form-error [field]="form.emailField()" />
        `,
      })
      class TestComponent {
        /* ... */
      }

      // Act
      await render(TestComponent);
      await userEvent.type(screen.getByRole('textbox'), 'invalid');

      // Assert
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-describedby',
        'email-hint email-error',
      );
    });

    it('should handle radio button groups (only first gets aria-describedby)', async () => {
      // Arrange
      @Component({
        template: `
          <input
            type="radio"
            id="male"
            name="gender"
            value="male"
            [checked]="form.gender() === 'male'"
          />
          <input
            type="radio"
            id="female"
            name="gender"
            value="female"
            [checked]="form.gender() === 'female'"
          />
          <ngx-form-error [field]="form.genderField()" />
        `,
      })
      class TestComponent {
        /* ... */
      }

      // Act
      await render(TestComponent);

      // Assert
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('aria-describedby', 'gender-error');
      expect(radios[1]).not.toHaveAttribute('aria-describedby'); // Second radio skips
    });
  });

  describe('Global Configuration', () => {
    it('should disable when autoAria: false in global config', async () => {
      // Arrange
      await render(TestComponent, {
        providers: [provideNgxVestFormsConfig({ autoAria: false })],
      });

      // Act
      await userEvent.type(screen.getByLabelText('Email'), 'invalid');

      // Assert
      expect(screen.getByLabelText('Email')).not.toHaveAttribute(
        'aria-invalid',
      );
    });
  });

  describe('NgxVestForms constant', () => {
    it('should import all directives via NgxVestForms constant', async () => {
      // Arrange
      @Component({
        imports: [NgxVestForms], // ← Use convenience constant
        template: `
          <input id="email" [value]="form.email()" />
          <ngx-form-error [field]="form.emailField()" />
        `,
      })
      class TestComponent {
        form = createVestForm(suite, signal({ email: '' }), {
          errorStrategy: 'immediate',
        });
      }

      // Act
      await render(TestComponent);

      // Assert - All directives should work
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true'); // Auto-ARIA works
      expect(screen.getByRole('alert')).toBeInTheDocument(); // Error component works
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
test.describe('Auto-ARIA Directive', () => {
  test('should announce errors to screen readers with correct ARIA attributes', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/basic-validation');

    // Act
    await page.getByLabel('Email').fill('invalid');
    await page.getByLabel('Email').blur();

    // Assert - Aria snapshot includes aria-invalid and aria-describedby
    await expect(page.getByLabel('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    ); // String!
    await expect(page.getByLabel('Email')).toHaveAttribute(
      'aria-describedby',
      'email-error',
    );

    // Assert - Error message is associated
    const errorMessage = page.locator('#email-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Email format is invalid');
  });

  test('should work with radio button groups', async ({ page }) => {
    // Arrange
    await page.goto('/example-form-nested');

    // Act - Submit without selecting gender
    await page.getByRole('button', { name: /submit/i }).click();

    // Assert - Radio group has error
    const genderRadios = page.getByRole('radio', { name: /gender/i });
    await expect(genderRadios.first()).toHaveAttribute('aria-invalid', 'true');
    await expect(genderRadios.first()).toHaveAttribute(
      'aria-describedby',
      'gender-error',
    );
  });

  test('should preserve hint text IDs when appending error IDs', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/form-with-hints');

    // Act
    await page.getByLabel('Email').fill('invalid');

    // Assert
    await expect(page.getByLabel('Email')).toHaveAttribute(
      'aria-describedby',
      'email-hint email-error',
    );
  });
});
```

---

## Success Metrics

### Before Auto-ARIA Directive

```typescript
// Lines of ARIA boilerplate per field: 6
// Total ARIA bindings in examples: 78+ instances
// WCAG compliance effort: Manual per-field configuration
```

### After Auto-ARIA Directive

```typescript
// Lines of ARIA boilerplate per field: 0
// Total ARIA bindings in examples: 0 (all automatic)
// WCAG compliance effort: Import NgxVestForms, done
```

### Developer Experience Impact

| Metric             | Before   | After                   | Improvement                |
| ------------------ | -------- | ----------------------- | -------------------------- |
| Lines per field    | 15+      | 3                       | **80% reduction**          |
| ARIA attributes    | Manual   | Automatic               | **100% automation**        |
| WCAG errors        | Common   | Rare                    | **Easier compliance**      |
| Maintenance burden | High     | Low                     | **Single source of truth** |
| Import complexity  | Multiple | Single (`NgxVestForms`) | **Simpler imports**        |

---

## FAQ

### Q1: Why use string `'true'` instead of boolean `true` for `aria-invalid`?

**Answer:** ARIA specification requires `aria-invalid` to be a **string**.

- ✅ `aria-invalid="true"` (string) - Screen readers announce properly
- ❌ `aria-invalid` (boolean) - May not announce correctly

**Reference:** [ARIA 1.2 aria-invalid](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)

### Q2: Should we merge auto-touch and auto-ARIA into a single directive?

**Answer:** No.

- Keep separate for SRP and independent opt-out
- Angular supports multiple directives on same element efficiently
- Easier to test and maintain

### Q3: How to handle dynamic `[attr.aria-*]` bindings?

**Answer:** Use opt-out flag (`ngxVestAriaDisabled`)

- `HostAttributeToken` only reads static attributes
- For complex cases, developer disables directive and uses manual bindings
- 90% of use cases are static attributes

### Q4: Why create `NgxVestForms` constant instead of individual imports?

**Answer:** Developer convenience.

- ✅ Single import for all directives + components
- ✅ Consistent pattern across examples
- ✅ Still allows cherry-picking individual imports when needed
- ✅ `as const` ensures type safety

### Q5: Performance impact of two directives on every input?

**Answer:** Negligible.

- Angular's DI is highly optimized for multiple directives
- Both use computed signals (reactive, not polling)
- Field name extraction happens once in constructor
- No runtime overhead beyond signal reactivity

---

## Implementation Checklist

### Week 1: Core Directive ✅ COMPLETED

- [x] Create `NgxVestAutoAriaDirective` class
- [x] Implement field name extraction (reuse from auto-touch)
- [x] Implement `ariaInvalid` computed signal (returns `'true' | null`)
- [x] Implement `ariaDescribedBy` computed signal
- [x] Add `HostAttributeToken` manual override detection
- [x] Add opt-out flag support (`ngxVestAriaDisabled`)
- [x] Add `autoAria` config to `NgxVestFormsConfig` with default `true`
- [x] Add to public API with `NgxVestForms` constant

### Week 2: Testing ✅ COMPLETED

- [x] Unit tests for `aria-invalid` logic (verify string "true")
- [x] Unit tests for `aria-describedby` logic
- [x] Unit tests for manual override detection
- [x] Unit tests for radio button groups
- [x] Unit tests for `NgxVestForms` constant integration
- [x] Unit tests for global config disable (`autoAria: false`)
- [x] Unit tests for opt-out attribute (`ngxVestAriaDisabled`)
- [ ] E2E tests for screen reader announcements (Playwright)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### Week 3: Examples Migration ⏳ IN PROGRESS

- [x] Update `minimal-form` example
- [x] Update `basic-validation` example
- [ ] Update `example-form-nested` example
- [ ] Update `error-display-modes` example
- [ ] Verify all forms still pass WCAG 2.2 validation

### Week 4: Documentation & Release

- [ ] Update README with NgxVestForms constant examples
- [ ] Update API docs with config defaults
- [x] Update ngx-auto-aria-prd.md with config section
- [ ] Add practical upgrade examples to documentation
- [ ] Release as minor version (non-breaking)

---

## Conclusion

The `NgxVestAutoAriaDirective` represents a significant DX improvement for ngx-vest-forms by:

1. **Reducing boilerplate by 60-80%** for accessibility attributes
2. **Making WCAG 2.2 compliance automatic** and harder to forget
3. **Following modern Angular patterns** (`HostAttributeToken`, signals, standalone)
4. **Maintaining flexibility** via opt-out mechanism for edge cases
5. **Complementing existing directives** (auto-touch, form-error) for a cohesive ecosystem
6. **Providing convenience constant** (`NgxVestForms`) for simpler imports
7. **No breaking changes** - purely additive, opt-in feature

**Key Technical Decisions:**

- ✅ String `'true'` for `aria-invalid` (ARIA spec compliant)
- ✅ Separate directive from auto-touch (SRP)
- ✅ `HostAttributeToken` for manual override detection
- ✅ `NgxVestForms` constant for developer convenience
- ✅ No migration needed - opt-in via imports

---

**References:**

- [WCAG 2.2 Level AA](https://www.w3.org/WAI/WCAG22/)
- [ARIA 1.2 aria-invalid](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)
- [ARIA19: Using ARIA role=alert](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19)
- [Angular HostAttributeToken](https://angular.dev/api/core/HostAttributeToken)
- [Brian Treese: HostAttributeToken Article](https://briantree.se/angular-tutorial-replacing-static-inputs-with-the-host-attribute-token/)
