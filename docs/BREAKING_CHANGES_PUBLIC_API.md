# ngx-vest-forms Breaking Changes: v1 → v2 Migration Guide

> 📋 **Quick Start:** Looking for a streamlined migration guide? Check our [**v2 Migration Guide**](./MIGRATION_GUIDE_V2.md) for a complete step-by-step walkthrough.

This document lists all **public API breaking changes** when upgrading from v1 to v2 of `ngx-vest-forms`, with migration steps and rationale. For internal/architectural changes, see `BREAKING_CHANGES_INTERNAL.md`.

## Quick Overview of Major Changes

| Change                       | Version | Impact    | Migration Required                |
| ---------------------------- | ------- | --------- | --------------------------------- |
| Directive and API Naming     | v2      | 🟡 Medium | Update directive names and syntax |
| Control Wrapper Component    | v2      | 🟢 Low    | Update import and usage patterns  |
| Two-way Binding with model() | v2      | 🟡 Medium | Update form binding syntax        |
| Unified formState Signal     | v2      | 🟡 Medium | Update state access patterns      |
| Error Display Behavior       | v2      | 🟢 Low    | Minimal impact, improved UX       |

**📊 Bundle Impact:** Core users get a smaller bundle size. New features are modular and opt-in.

---

## 1. Directive and API Naming Changes (v1 → v2)

**What changed?**

All directive names and selectors have been updated to use the `ngx` prefix instead of `sc` (Simplified Courses) prefix.

**Why the change?**

- **Angular Conventions:** Follows standard Angular naming patterns for third-party libraries
- **Clarity:** The `ngx` prefix clearly indicates these are ngx-vest-forms components
- **Avoid Conflicts:** Prevents naming conflicts with other libraries or application code

**Migration Required:**

| v1 Pattern (Old)     | v2 Pattern (New)                  |
| -------------------- | --------------------------------- |
| `scVestForm`         | `ngxVestForm`                     |
| `sc-control-wrapper` | `ngx-control-wrapper`             |
| `vestForms` import   | `ngxVestForms` import             |
| `[suite]` input      | `[vestSuite]` input               |
| `(formValueChange)`  | `[(formValue)]` (two-way binding) |

### v1 Example

```html
<form
  scVestForm
  [suite]="suite"
  [formValue]="formValue()"
  (formValueChange)="formValue.set($event)"
>
  <sc-control-wrapper>
    <input name="email" ngModel />
  </sc-control-wrapper>
</form>
```

### v2 Example

```html
<form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
  <ngx-control-wrapper>
    <input name="email" ngModel />
  </ngx-control-wrapper>
</form>
```

---

## 2. Control Wrapper Component Updates (v1 → v2)

**What changed?**

The control wrapper component has been updated with new naming and modular imports.

**Migration Required:**

### v1 Control Wrapper Pattern

```typescript
import { vestForms } from 'ngx-vest-forms';

@Component({
  imports: [vestForms], // sc-control-wrapper was included
  template: `
    <sc-control-wrapper>
      <input name="field" ngModel />
    </sc-control-wrapper>
  `
})
```

### v2 Control Wrapper Pattern

```typescript
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

@Component({
  imports: [ngxVestForms, NgxControlWrapper],
  template: `
    <ngx-control-wrapper>
      <input name="field" ngModel />
    </ngx-control-wrapper>
  `
})
```

**Key Changes:**

1. **Import:** Control wrapper must be imported from `ngx-vest-forms/control-wrapper`
2. **Component Imports:** Add `NgxControlWrapper` to your component's `imports` array
3. **Template:** Update selector from `<sc-control-wrapper>` to `<ngx-control-wrapper>`

---

## 3. Two-way Binding with model() (v1 → v2)

**What changed?**

The `[formValue]` input and `(formValueChange)` output pattern is replaced by a single two-way binding using `[(formValue)]`.

**Why?**

- Simplifies form integration and reduces boilerplate
- Aligns with modern Angular best practices for signals and two-way binding
- Makes it easier to connect forms to signals or state stores

**Migration Required:**

### v1 Form Binding Pattern

```html
<form
  scVestForm
  [formValue]="formValue()"
  (formValueChange)="formValue.set($event)"
>
  <!-- form fields -->
</form>
```

### v2 Form Binding Pattern

```html
<form ngxVestForm [(formValue)]="formValue">
  <!-- form fields -->
</form>
```

**Migration steps:**

1. Replace `[formValue]="formValue()" (formValueChange)="formValue.set($event)"` with `[(formValue)]="formValue"`
2. Remove any manual event handlers for form value changes

---

## 4. Unified formState Signal (v1 → v2)

**What changed?**

The new `formState` signal is now the unified way to access all form state. The old individual signals are deprecated.

**Migration Required:**

| v1 Pattern (Deprecated) | v2 Pattern (New)                |
| ----------------------- | ------------------------------- |
| `vestForm.errors()`     | `vestForm.formState().errors`   |
| `vestForm.isValid()`    | `vestForm.formState().valid`    |
| `vestForm.isPending()`  | `vestForm.formState().pending`  |
| `vestForm.isDisabled()` | `vestForm.formState().disabled` |

### v1 State Access Pattern

```typescript
// Individual signals
const valid = vestForm.isValid();
const errors = vestForm.errors();
const pending = vestForm.isPending();
```

### v2 State Access Pattern

```typescript
// Unified formState signal
const formState = vestForm.formState();
const valid = formState.valid;
const errors = formState.errors;
const pending = formState.pending;
```

---

## 5. Error Display Behavior Improvements (v1 → v2)

**What changed?**

Error messages are now shown on blur OR after form submission (instead of only on blur).

**Why?**

This improves user experience by ensuring validation errors are visible after a user attempts to submit a form.

**Migration Required:**

**No code changes required** - this is an improvement to the default behavior.

**To keep v1 behavior (errors only on blur):**

```typescript
// Global configuration
providers: [{ provide: NGX_ERROR_DISPLAY_MODE_DEFAULT, useValue: 'on-blur' }];

// Or per control wrapper
```

```html
<ngx-control-wrapper errorDisplayMode="on-blur">
  <input name="field" ngModel />
</ngx-control-wrapper>
```

---

## New Features in v2 (Non-Breaking)

These features are **additive** and don't require migration from v1:

### Smart State Management

Optional smart state management for handling external data updates and conflict resolution.

```html
<!-- v1 forms continue to work unchanged -->
<form ngxVestForm [vestSuite]="suite" [(formValue)]="userProfile">
  <!-- form fields -->
</form>

<!-- v2: Optional smart state features -->
<form
  ngxVestForm
  ngxSmartStateExtension
  [vestSuite]="suite"
  [(formValue)]="userProfile"
  [externalData]="externalData()"
  [smartStateOptions]="{ mergeStrategy: 'smart' }"
>
  <!-- form fields -->
</form>
```

### Schema Integration

Enhanced schema support with multiple schema libraries:

```typescript
import { NgxVestForms } from 'ngx-vest-forms';
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';

// Use with Zod, ArkType, Valibot, or simple models
const schema = ngxModelToStandardSchema(userTemplate);
```

### Advanced Composition APIs

New directives for building custom form components:

```typescript
@Component({
  hostDirectives: [NgxFormErrorDisplayDirective],
  template: `
    @if (errorDisplay.shouldShowErrors()) {
      <div class="errors">
        @for (error of errorDisplay.errors(); track error) {
          <div>{{ error }}</div>
        }
      </div>
    }
  `,
})
export class CustomFieldComponent {
  readonly errorDisplay = inject(NgxFormErrorDisplayDirective);
}
```

---

## Migration Summary

### Essential Changes (Required for all users)

1. **Update directive names:** `scVestForm` → `ngxVestForm`
2. **Update imports:** `vestForms` → `ngxVestForms`
3. **Update control wrapper:** `sc-control-wrapper` → `ngx-control-wrapper`
4. **Add control wrapper import:** Import `NgxControlWrapper` from `ngx-vest-forms/control-wrapper`
5. **Update suite input:** `[suite]` → `[vestSuite]`
6. **Update form binding:** `[formValue]` + `(formValueChange)` → `[(formValue)]`

### Recommended Changes

1. **Update to formState signal:** Replace individual signals with `formState()`
2. **Review error display behavior:** Ensure the new on-blur-or-submit behavior works for your UX

### Optional Enhancements

1. **Add smart state management:** For forms with external data updates
2. **Use schema integration:** For enhanced type safety and validation
3. **Build custom components:** Using the new composition APIs

---

## Related Documentation

- [v2 Migration Guide](./MIGRATION_GUIDE_V2.md) - Complete step-by-step migration
- [Smart State Management Guide](smart-state-management.md) - Advanced state features
- [Schema Utilities Guide](../../projects/ngx-vest-forms/schemas/README.md) - Schema integration
- [Control Wrapper Guide](../../projects/ngx-vest-forms/control-wrapper/README.md) - Custom form fields
