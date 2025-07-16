# ngx-vest-forms Breaking Changes: v1 → v2 Migration Guide

> 📋 **Quick Start:** For a step-by-step migration, see the [v2 Migration Guide](./MIGRATION_GUIDE_V2.md).

This document lists all **public API breaking changes** when upgrading from v1 to v2 of `ngx-vest-forms`, with migration steps and rationale. For internal/architectural changes, see `BREAKING_CHANGES_INTERNAL.md`.

## Quick Overview of Major Changes

| Change                       | v1 Pattern/Behavior                          | v2 Pattern/Behavior                           | Migration Required                          |
| ---------------------------- | -------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| Directive and API Naming     | `scVestForm`, `sc-control-wrapper`,          | `ngxVestForm`, `ngx-control-wrapper`,         | Update directive names and syntax           |
|                              | `FormDirective`, `ValidationOptions`         | `NgxFormDirective`, `NgxValidationOptions`    |                                             |
| Control Wrapper Component    | Always included, attribute selector          | Optional import, component selector           | Update import and usage patterns            |
| Two-way Binding with model() | `[formValue]` + `(formValueChange)`          | `[(formValue)]` (banana-in-a-box)             | Update form binding syntax                  |
| Unified formState Signal     | Multiple outputs/signals                     | Single `formState` signal                     | Update state access patterns                |
| Error Display Behavior       | Errors shown on blur only                    | Errors shown on blur or submit                | Minimal impact, improved UX                 |
| Modular Architecture         | Monolithic, all features bundled             | Modular entry points, tree-shaking            | Optional tree-shaking benefits              |
| Schema Support               | Basic, limited                               | Full adapters for Zod, ArkType, Valibot       | Update imports if using schemas             |
| Smart State                  | Not available                                | New feature, opt-in                           | Optional, new usage                         |
| Error Object Structure       | Errors as strings (`Record<string, string>`) | Errors as arrays (`Record<string, string[]>`) | Update error display logic to handle arrays |
| Deprecated APIs Removed      | Legacy signals, old error config, etc.       | Not available in v2                           | Remove usage, migrate to new APIs           |

**Bundle Impact:** v2 is modular and opt-in. Core and main entry points have identical bundle sizes; optional features add only what you use.

---

## 1. Modular Architecture (NEW in v2)

**v1:** All features bundled together. No modular entry points.
**v2:** Modular architecture with multiple entry points for better organization and optional features.

| Entry Point     | v1 Import Example                            | v2 Import Example                                                              |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| Main/Core       | `import { vestForms } from 'ngx-vest-forms'` | `import { ngxVestForms } from 'ngx-vest-forms'` or `ngx-vest-forms/core`       |
| Control Wrapper | Included in main                             | `import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper'`           |
| Smart State     | Not available                                | `import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state'` |
| Schema Adapters | Basic                                        | `import { modelToStandardSchema } from 'ngx-vest-forms/schemas'`               |

**Migration:** Update imports for optional features as needed.

---

## 2. Directive and API Naming Changes

**v1:** Uses `scVestForm`, `sc-control-wrapper`, and non-prefixed directive/type names.
**v2:** Consistent `ngx` prefix for all directives, selectors, types, and tokens.

| v1 Name/Selector             | v2 Name/Selector                 | Migration Required             |
| ---------------------------- | -------------------------------- | ------------------------------ |
| `scVestForm`                 | `ngxVestForm`                    | Update directive usage         |
| `sc-control-wrapper`         | `ngx-control-wrapper`            | Update selector usage          |
| `FormDirective`              | `NgxFormDirective`               | Update imports and references  |
| `FormErrorDisplayDirective`  | `NgxFormErrorDisplayDirective`   | Update imports and references  |
| `ValidationOptions`          | `NgxValidationOptions`           | Update type references         |
| `ROOT_FORM`                  | `NGX_ROOT_FORM`                  | Update token usage             |
| `ERROR_DISPLAY_MODE_DEFAULT` | `NGX_ERROR_DISPLAY_MODE_DEFAULT` | Update provider configurations |
| `injectRootFormKey()`        | `injectNgxRootFormKey()`         | Update function calls          |

---

## 3. Control Wrapper Component Updates

**v1:** Attribute selector, always included.
**v2:** Component selector, optional import.

| v1 Usage Example                    | v2 Usage Example                                 |
| ----------------------------------- | ------------------------------------------------ |
| `<div sc-control-wrapper>...</div>` | `<ngx-control-wrapper>...</ngx-control-wrapper>` |

**Migration:** Import `NgxControlWrapper` from `ngx-vest-forms/control-wrapper` and update template selectors.

---

## 4. Two-way Binding with model()

**v1:** `[formValue]` input and `(formValueChange)` output; manual signal updates.
**v2:** `[(formValue)]` two-way binding; aligns with Angular signal idioms.

| v1 Pattern                                                            | v2 Pattern                  |
| --------------------------------------------------------------------- | --------------------------- |
| `[formValue]="formValue()" (formValueChange)="formValue.set($event)"` | `[(formValue)]="formValue"` |

**Migration:** Replace `[formValue]` + `(formValueChange)` with `[(formValue)]`.

---

## 5. Unified formState Signal

**v1:** Multiple signals/outputs for form state (`validChange`, `errorsChange`, etc.).
**v2:** Unified `formState` signal for all state (valid, errors, pending, disabled).

| v1 Pattern              | v2 Pattern                      |
| ----------------------- | ------------------------------- |
| `vestForm.errors()`     | `vestForm.formState().errors`   |
| `vestForm.isValid()`    | `vestForm.formState().valid`    |
| `vestForm.isPending()`  | `vestForm.formState().pending`  |
| `vestForm.isDisabled()` | `vestForm.formState().disabled` |

**Migration:** Use `formState()` for all form state access.

---

## 6. Error Display Behavior Improvements

**v1:** Errors shown on blur only.
**v2:** Errors shown on blur **or** after submit (improved UX). Configurable via token or per-control.

| v1 Pattern           | v2 Pattern                                                       |
| -------------------- | ---------------------------------------------------------------- |
| Errors shown on blur | Errors shown on blur or submit                                   |
|                      | Configurable via `NGX_ERROR_DISPLAY_MODE_DEFAULT` or per-control |

**Migration:** No code changes required for default behavior. To keep v1 behavior, set error display mode to `on-blur`.

---

## 7. Schema Support

**v1:** Basic, limited schema support with `validateShape` utility.
**v2:** Full support for Zod, ArkType, Valibot via adapters in `schemas` entry point. `validateShape` replaced by `modelToStandardSchema`.

## Schema Migration (v2)

- **Recommended:** Use [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), or [ArkType](https://arktype.io/) for schema validation and type safety. These libraries follow the [Standard Schema](https://standardschema.dev/) initiative and are supported via adapters in `ngx-vest-forms/schemas`.
- **Fallback:** Use `modelToStandardSchema` only for legacy or custom scenarios where standard schema libraries are not suitable.

**Example:**

```typescript
import { z } from 'zod';
import { InferSchemaType } from 'ngx-vest-forms/schemas';
const userSchema = z.object({ name: z.string(), email: z.string().email() });
type User = InferSchemaType<typeof userSchema>;

@Component({
  template: `
    <form ngxVestForm [formSchema]="userSchema" [(formValue)]="userData">
      <input name="name" [ngModel]="userData().name" placeholder="Name" />
      <input
        name="email"
        type="email"
        [ngModel]="userData().email"
        placeholder="Email"
      />
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>({ name: '', email: '' });
}
```

**Migration:** Update imports and usage. See [Schema Utilities Guide](../../projects/ngx-vest-forms/schemas/README.md) for details.

---

## 8. Smart State

**v1:** Not available.
**v2:** New feature, opt-in via `smart-state` entry point.

| v1 Pattern    | v2 Pattern                                                                     |
| ------------- | ------------------------------------------------------------------------------ |
| Not available | `import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state'` |

**Migration:** Import and use smart state directive if needed.

---

## Migration Checklist

- [ ] Update directive names: `scVestForm` → `ngxVestForm`
- [ ] Update imports: `vestForms` → `ngxVestForms`
- [ ] Update control wrapper: `sc-control-wrapper` → `ngx-control-wrapper`
- [ ] Add control wrapper import: Import `NgxControlWrapper` from `ngx-vest-forms/control-wrapper`
- [ ] Update suite input: `[suite]` → `[vestSuite]`
- [ ] Update form binding: `[formValue]` + `(formValueChange)` → `[(formValue)]`
- [ ] Use unified `formState()` signal for all form state access
- [ ] Review error display behavior and configure as needed
- [ ] (Optional) Use smart state and schema integration for advanced features

---

## Troubleshooting Migration Issues

- **Type Errors:** Update type names and imports to NGX-prefixed versions.
- **Import Errors:** Ensure optional features are imported from their respective entry points.
- **validateRootForm Issues:** Ensure `[validateRootForm]="true"` is set for cross-field validation.
- **Error Object Migration:** v2 errors are arrays, not strings. Update your error display logic to handle multiple errors per field.
- **Deprecated API Removal:** If you used legacy signals or old error config, migrate to the new unified APIs and configuration system.
- **General Tips:** Run `npx tsc --noEmit` to check for type errors after migration. Use the automated migration script for large codebases.

---

## Related Documentation

- [v2 Migration Guide](./MIGRATION_GUIDE_V2.md) - Complete step-by-step migration
- [Smart State Management Guide](smart-state-management.md) - Advanced state features
- [Schema Utilities Guide](../../projects/ngx-vest-forms/schemas/README.md) - Schema integration
- [Control Wrapper Guide](../../projects/ngx-vest-forms/control-wrapper/README.md) - Custom form fields
