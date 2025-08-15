# ngx-vest-forms v2 Migration Guide

> 📋 **Complete migration guide for upgrading from v1 to v2**

This guide provides step-by-step instructions for migrating from ngx-vest-forms v1 to v2. For detailed breaking changes documentation, see [Breaking Changes: Public API](./BREAKING_CHANGES_PUBLIC_API.md).

## Quick Migration Checklist

### ✅ Step 1: Update Your Package

```bash
npm install ngx-vest-forms@latest
```

### ✅ Step 2: Check Your Usage

Most users will have **zero breaking changes** and automatically get a **smaller bundle**:

#### v1 Example

```typescript
import { vestForms } from 'ngx-vest-forms';

@Component({
  imports: [vestForms],
  // ...
})
```

#### v2 Example

```typescript
import { ngxVestForms } from 'ngx-vest-forms';

@Component({
  imports: [ngxVestForms],
  // ...
})
```

If you prefer the lightest setup (minimal directive only), you can opt into the core preset:

```typescript
import { ngxVestFormsCore } from 'ngx-vest-forms/core';

@Component({
  imports: [ngxVestFormsCore],
  // ...
})
```

### ✅ Step 3: Update Advanced Features (If Used)

#### v1 Advanced Imports Example

```typescript
import {
  FormDirective,
  ControlWrapperComponent,
  ValidationOptions,
} from 'ngx-vest-forms';
```

#### v2 Advanced Imports Example

```typescript
import { NgxFormDirective } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { NgxValidationOptions } from 'ngx-vest-forms';
```

---

## Migration Tables

### Naming Convention Updates

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

## Modularization Changes

| Feature         | v1 Import Example                            | v2 Import Example                                                              |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| Core Forms      | `import { vestForms } from 'ngx-vest-forms'` | `import { ngxVestForms } from 'ngx-vest-forms'` or `ngx-vest-forms/core`       |
| Control Wrapper | Included in main                             | `import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper'`           |
| Smart State     | Not available                                | `import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state'` |
| Schema Adapters | Basic                                        | `import { modelToStandardSchema } from 'ngx-vest-forms/schemas'`               |

---

## Step-by-Step Migration

### 1. Update Directive Selectors

**v1:**

```html
<form scVestForm ...>
  <div sc-control-wrapper>...</div>
</form>
```

**v2:**

```html
<form ngxVestForm ...>
  <ngx-control-wrapper>...</ngx-control-wrapper>
</form>
```

### 2. Update Imports

**v1:**

```typescript
import { vestForms } from 'ngx-vest-forms';
```

**v2:**

```typescript
import { ngxVestForms } from 'ngx-vest-forms';
```

### 3. Update Form Binding

**v1:**

```html
<form
  [formValue]="formValue()"
  (formValueChange)="formValue.set($event)"
></form>
```

**v2:**

```html
<form [(formValue)]="formValue"></form>
```

### 4. Update Control Wrapper Usage

**v1:**

```html
<div sc-control-wrapper>...</div>
```

**v2 (element selector):**

```html
<ngx-control-wrapper>...</ngx-control-wrapper>
```

**v2 (attribute/directive selector):**

```html
<div ngxControlWrapper>...</div>
```

Both usages are supported. Use the element selector for semantic clarity and the attribute selector for wrapping existing elements or groups.

### 5. Update Error Display Mode (if needed)

**v1:** Errors shown on blur only.

**v2:** Errors shown on blur or submit (default). To keep v1 behavior:

```typescript
providers: [{ provide: NGX_ERROR_DISPLAY_MODE_DEFAULT, useValue: 'on-blur' }];
```

Or per control:

```html
<ngx-control-wrapper errorDisplayMode="on-blur">...</ngx-control-wrapper>
```

## Migration from Core

If you were previously using shape validation in v1:

```typescript
// Before (v1)
import { validateShape } from 'ngx-vest-forms';
validateShape(formValue, shape);

// After (v2)
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const schema = ngxModelToStandardSchema(shape);
// Use schema for validation, type inference, etc.
```

### 6. Update Schema Utilities (if used)

**v1:**

```typescript
import { validateShape } from 'ngx-vest-forms';
validateShape(formValue, shape);
```

**v2:**

```typescript
import { modelToStandardSchema } from 'ngx-vest-forms/schemas';
modelToStandardSchema(formValue, shape);
```

**Rationale:**

- `validateShape` is replaced by `modelToStandardSchema` for modularity, type safety, and adapter support.
- v2 supports Zod, ArkType, and Valibot schemas for advanced type inference and validation.
- For custom logic, migrate your shape validation to use the new utility or a schema adapter:

#### Example: Using Zod Adapter

```typescript
import { z } from 'zod';

const userSchema = z.object({ name: z.string(), email: z.string().email() });
```

## Schema Migration

**Recommended:** Migrate to [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), or [ArkType](https://arktype.io/) for schema validation and type safety. These libraries follow the [Standard Schema](https://standardschema.dev/) initiative and provide robust, interoperable schemas for your forms.

- **Zod**: Popular, expressive, and TypeScript-first schema library.
- **Valibot**: Lightweight, fast, and modern schema validation.
- **ArkType**: Advanced type-level schema validation and inference.

**Migration Steps:**

1. Install your preferred schema library (e.g., `npm i zod`).
2. Define your schema using Zod, Valibot, or ArkType.
3. Pass the schema directly to your form via `[formSchema]`.
4. Type your form value using `z.infer<typeof userSchema>` for Zod schemas.

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

**Fallback:** If you cannot migrate to a standard schema library, use `ngxModelToStandardSchema` to generate a schema from a plain object template.

```typescript
import {
  ngxModelToStandardSchema,
  InferSchemaType,
} from 'ngx-vest-forms/schemas';
const userTemplate = { name: '', age: 0 };
const userSchema = ngxModelToStandardSchema(userTemplate);
type User = InferSchemaType<typeof userSchema>;

@Component({
  template: `
    <form ngxVestForm [formSchema]="userSchema" [(formValue)]="userData">
      <input name="name" [ngModel]="userData().name" placeholder="Name" />
      <input
        name="age"
        type="number"
        [ngModel]="userData().age"
        placeholder="Age"
      />
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>(userTemplate);
}
```

**API Reference & Migration Guidance:**

- Prefer Zod, Valibot, or ArkType for new and migrated forms.
- Use `modelToStandardSchema` only for legacy or custom scenarios.
- See the [schemas README](../../projects/ngx-vest-forms/schemas/README.md) for details and migration notes.

### 6a. Error Object Structure Change

**v1:** Errors were strings (e.g., `errors: Record<string, string>`)

**v2:** Errors are arrays (multi-error support):

```typescript
const errors = vestForm.formState().errors; // Record<string, string[]>
```

### 6c. Schema Validation State Separation (Breaking)

In earlier v2 previews, failed schema issues were merged into `formState().root.errors` as flattened strings (e.g. `email: Invalid email`). Final v2 separates schema validation into a dedicated `formState().schema` object for clarity and stronger typing.

New additions to `NgxFormState`:

```txt
submitted: boolean;              // true after first submit attempt
errorCount: number;              // Vest-only errors (fields + root)
warningCount: number;            // Vest-only warnings
firstInvalidField?: string|null; // First field with a Vest error, else first schema issue path
schema?: {                       // Present only when [formSchema] is provided
  hasRun: boolean;               // false until first submit
  success: boolean | null;       // null pre-run
  issues: { path?: string; message: string }[]; // Failure issues only
  errorMap: Record<string, string[]>;          // Grouped by path ("_root" for issues without a path)
};
```

Access pattern:

```typescript
const state = vestForm.formState();
if (state.schema?.issues.length) {
  // show schema issues
}
```

Migration from merged root errors:

| Previous (preview)                            | Now                                                                |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `state.root?.errors` contained schema strings | `state.schema?.issues` holds structured issues                     |
| `ngForm.form.errors.schemaErrors`             | Deprecated: read `state.schema?.issues` / `state.schema?.errorMap` |

If you previously concatenated root + schema errors for a summary banner, update as:

```typescript
const summary = [
  ...(state.root?.errors ?? []),
  ...(state.schema?.issues.map((issue) =>
    issue.path ? `${issue.path}: ${issue.message}` : issue.message,
  ) ?? []),
];
```

Rationale: Separation preserves structure (path/message), avoids accidental double counting, and keeps Vest vs schema concerns distinct.

````

**Migration Tip:** Update your error display logic to handle arrays of errors per field.

### 6b. Smart State Migration (Advanced)

**v2:** For complex forms needing external sync or conflict resolution:

```typescript
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';
// ...use as needed, see Smart State Management Guide...
````

---

## Automated Migration Script

For large codebases, use this script to automate the migration:

```bash
# Save as migrate-ngx-naming.sh
#!/bin/bash
cd your-project-directory
git add . && git commit -m "Backup before NGX naming migration"
find . -name "*.ts" -type f -exec sed -i '' 's/scVestForm/ngxVestForm/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/sc-control-wrapper/ngx-control-wrapper/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/FormDirective/NgxFormDirective/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/FormErrorDisplayDirective/NgxFormErrorDisplayDirective/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/ValidationOptions/NgxValidationOptions/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/ROOT_FORM/NGX_ROOT_FORM/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/ERROR_DISPLAY_MODE_DEFAULT/NGX_ERROR_DISPLAY_MODE_DEFAULT/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/injectRootFormKey/injectNgxRootFormKey/g' {} \;
echo "NGX naming migration completed!"
echo "Please review the changes and test your application."
```

---

## Troubleshooting

- **Type Errors:** Update type names and imports to NGX-prefixed versions.
- **Import Errors:** Ensure optional features are imported from their respective entry points.
- **validateRootForm Issues:** Ensure `[validateRootForm]="true"` is set for cross-field validation.
- **General Tips:** Run `npx tsc --noEmit` to check for type errors after migration. Use the automated migration script for large codebases.

---

## Related Documentation

- [Breaking Changes: Public API](./BREAKING_CHANGES_PUBLIC_API.md)
- [Smart State Management](../../projects/ngx-vest-forms/smart-state/README.md)
- [Schema Utilities Guide](../../projects/ngx-vest-forms/schemas/README.md)
- [Control Wrapper Guide](../../projects/ngx-vest-forms/control-wrapper/README.md)
