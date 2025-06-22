# ngx-vest-forms v2 Migration Guide

> 📋 **Complete migration guide for upgrading from v1 to v2**

This guide provides step-by-step instructions for migrating from ngx-vest-forms v1 to v2. For detailed breaking changes documentation, see [Breaking Changes: Public API](./BREAKING_CHANGES_PUBLIC_API.md).

## Quick Migration Checklist

### ✅ **Step 1: Update Your Package**

```bash
npm install ngx-vest-forms@latest
```

### ✅ **Step 2: Check Your Usage**

Most users will have **zero breaking changes** and automatically get a **44% smaller bundle**:

```typescript
// ✅ This continues to work unchanged
import { ngxVestForms } from 'ngx-vest-forms';

@Component({
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <input name="firstName" ngModel />
    </form>
  `
})
```

### ✅ **Step 3: Update Advanced Features (If Used)**

Only if you use these advanced features, update imports:

```typescript
// Before v2
import {
  NgxControlWrapper,
  SmartStateOptions,
  modelToStandardSchema,
} from 'ngx-vest-forms';

// After v2
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import {
  NgxVestFormsSmartStateDirective,
  SmartStateOptions,
} from 'ngx-vest-forms/smart-state';
import { modelToStandardSchema } from 'ngx-vest-forms/schemas';
```

---

## Complete Migration Tables

### 🏗️ **Naming Convention Updates (v2)**

All public API elements now follow consistent NGX prefixing:

| **Category**          | **v1 Name**                  | **v2 Name**                      | **Migration Required** |
| --------------------- | ---------------------------- | -------------------------------- | ---------------------- |
| **Directive Classes** | `FormErrorDisplayDirective`  | `NgxFormErrorDisplayDirective`   | Update imports         |
|                       | `FormModelGroupDirective`    | `NgxFormModelGroupDirective`     | Update imports         |
|                       | `FormModelDirective`         | `NgxFormModelDirective`          | Update imports         |
|                       | `ValidateRootFormDirective`  | `NgxValidateRootFormDirective`   | Update imports         |
| **Types**             | `ValidationOptions`          | `NgxValidationOptions`           | Update type references |
|                       | `ErrorDisplayMode`           | `NgxErrorDisplayMode`            | Update type references |
| **Injection Tokens**  | `ERROR_DISPLAY_MODE_DEFAULT` | `NGX_ERROR_DISPLAY_MODE_DEFAULT` | Update providers       |
|                       | `ROOT_FORM`                  | `NGX_ROOT_FORM`                  | Update providers       |
| **Functions**         | `injectRootFormKey`          | `injectNgxRootFormKey`           | Update function calls  |

### 📦 **Modularization Changes**

| **Feature**         | **v1 Import**                                                            | **v2 Import**                                                                  | **Bundle Impact** |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------- |
| **Core Forms**      | `import { vestForms } from 'ngx-vest-forms'`                             | `import { ngxVestForms } from 'ngx-vest-forms'`                                | Smaller bundle    |
| **Control Wrapper** | `import { vestForms } from 'ngx-vest-forms'` (with `sc-control-wrapper`) | `import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper'`           | Optional module   |
| **Smart State**     | _Not available in v1_                                                    | `import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state'` | Optional module   |
| **Schema Utils**    | _Limited in v1_                                                          | `import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas'`            | Optional module   |
| **Smart State**     | _Not available in v1_                                                    | `import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state'` | Optional +10KB    |
| **Schema Utils**    | _Limited in v1_                                                          | `import { modelToStandardSchema } from 'ngx-vest-forms/schemas'`               | Optional +7KB     |

### 🔧 **Behavioral Changes**

| **Feature**          | **v1 Behavior**  | **v2 Behavior**      | **Migration**                         |
| -------------------- | ---------------- | -------------------- | ------------------------------------- |
| **validateRootForm** | Default: `false` | Default: `false`     | No change - same default behavior     |
| **Error Display**    | Always included  | Optional module      | Import from `control-wrapper` if used |
| **Schema Support**   | Basic            | Full Standard Schema | Import from `schemas` if used         |

---

## Quick Overview of Major Changes

| Change                          | Version | Impact       | Migration Required                      |
| ------------------------------- | ------- | ------------ | --------------------------------------- |
| Directive and API Naming        | v2      | � Medium     | Update directive names and syntax       |
| Smart State Modularization      | v2      | 🟡 Medium    | Only if using smart state features      |
| Control Wrapper Modularization  | v2      | 🟢 Low       | Only if using NgxControlWrapper         |
| Schema Utilities Modularization | v2      | 🟢 Low       | Only if using schema utilities          |
| Control Wrapper Component       | v2      | 🟢 Low       | Only if using sc-control-wrapper in v1  |
| **NGX Naming Convention**       | **v2**  | **� Medium** | **Update all public API imports/usage** |

**📊 Bundle Impact:** Core users get a smaller bundle size with modularized optional features.

---

## Detailed Migration Steps

### 🚀 **For Basic Users (No Changes Needed)**

If you only use basic form validation:

```typescript
// ✅ Works unchanged in v2
import { ngxVestForms } from 'ngx-vest-forms';

@Component({
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <input name="email" ngModel />
      <input name="password" ngModel />
    </form>
  `,
})
export class LoginForm {
  model = signal({ email: '', password: '' });
  suite = loginValidationSuite;
}
```

**Result**: 44% smaller bundle, zero code changes required.

### 🔄 **For Control Wrapper Users**

#### Before (v1):

```typescript
import { vestForms } from 'ngx-vest-forms';

@Component({
  imports: [vestForms],
  template: `
    <form scVestForm [suite]="suite" (formValueChange)="model.set($event)">
      <sc-control-wrapper>
        <input name="email" [ngModel]="model().email" />
      </sc-control-wrapper>
    </form>
  `
})
```

#### After (v2):

```typescript
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

@Component({
  imports: [ngxVestForms, NgxControlWrapper],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-control-wrapper>
        <input name="email" ngModel />
      </ngx-control-wrapper>
    </form>
  `
})
```

### ⚡ **For Smart State Users**

Smart state management is a **new feature in v2**. If you want to add smart state capabilities to existing v1 forms:

#### v1 Form (Without Smart State):

```typescript
import { vestForms } from 'ngx-vest-forms';

@Component({
  imports: [vestForms],
  template: `
    <form scVestForm [suite]="suite" [formValue]="model()" (formValueChange)="model.set($event)">
    </form>
  `
})
```

#### v2 Form (With Smart State):

```typescript
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxVestFormsSmartStateDirective, SmartStateOptions } from 'ngx-vest-forms/smart-state';

@Component({
  imports: [ngxVestForms, NgxVestFormsSmartStateDirective],
  template: `
    <form ngxVestForm ngxSmartStateExtension
          [vestSuite]="suite" [(formValue)]="model"
          [externalData]="external()" [smartStateOptions]="options">
    </form>
  `
})
```

### 🔧 **For Configuration Token Users**

#### Before (v1 Configuration):

```typescript
import { ERROR_DISPLAY_MODE_DEFAULT, ErrorDisplayMode } from 'ngx-vest-forms';

@Component({
  providers: [
    {
      provide: ERROR_DISPLAY_MODE_DEFAULT,
      useValue: 'on-blur' as ErrorDisplayMode
    }
  ]
})
```

#### After (v2 Configuration):

```typescript
import { NGX_ERROR_DISPLAY_MODE_DEFAULT, NgxErrorDisplayMode } from 'ngx-vest-forms';

@Component({
  providers: [
    {
      provide: NGX_ERROR_DISPLAY_MODE_DEFAULT,
      useValue: 'on-blur' as NgxErrorDisplayMode
    }
  ]
})
```

### 📋 **For Schema Users**

#### Before (v1 Schema):

```typescript
import {
  ngxVestForms,
  modelToStandardSchema,
  InferSchemaType,
} from 'ngx-vest-forms';

const schema = modelToStandardSchema(template);
type User = InferSchemaType<typeof schema>;
```

#### After (v2 Schema):

```typescript
import { ngxVestForms } from 'ngx-vest-forms';
import { modelToStandardSchema, InferSchemaType } from 'ngx-vest-forms/schemas';

const schema = modelToStandardSchema(template);
type User = InferSchemaType<typeof schema>;
```

---

## NGX Naming Convention Update (v2)

**What changed?**

All public API elements (directives, types, tokens, functions) have been updated to use a consistent NGX prefix to follow Angular naming conventions and avoid naming conflicts.

**Why the change?**

- **Angular Conventions:** Follows standard Angular naming patterns for third-party libraries
- **Clarity:** The `Ngx` prefix clearly indicates these are ngx-vest-forms components/types
- **Avoid Conflicts:** Prevents naming conflicts with other libraries or application code
- **Consistency:** Aligns with widely adopted Angular ecosystem naming practices

**Migration Required:**

Update all imports and usage of public API elements to use the new NGX-prefixed names:

### Directive and Component Names

| Old Name (v1)               | New Name (v2)                  | Migration Required                      |
| --------------------------- | ------------------------------ | --------------------------------------- |
| `FormDirective`             | `NgxFormDirective`             | Update imports and component references |
| `FormErrorDisplayDirective` | `NgxFormErrorDisplayDirective` | Update imports and directive usage      |
| `FormModelDirective`        | `NgxFormModelDirective`        | Update imports and directive usage      |
| `FormModelGroupDirective`   | `NgxFormModelGroupDirective`   | Update imports and directive usage      |
| `FormControlStateDirective` | `NgxFormControlStateDirective` | Update imports and directive usage      |
| `ValidateRootFormDirective` | `NgxValidateRootFormDirective` | Update imports and directive usage      |

### Type Names

| Old Name (v1)                   | New Name (v2)                      | Migration Required                  |
| ------------------------------- | ---------------------------------- | ----------------------------------- |
| `FormState<T>`                  | `NgxFormState<T>`                  | Update type annotations and imports |
| `ValidationOptions`             | `NgxValidationOptions`             | Update type annotations and imports |
| `FormControlState`              | `NgxFormControlState`              | Update type annotations and imports |
| `ErrorDisplayMode`              | `NgxErrorDisplayMode`              | Update type annotations and imports |
| `NgxDeepPartial<T>`             | `NgxDeepPartial<T>`                | Update type annotations and imports |
| `NgxDeepRequired<T>`            | `NgxDeepRequired<T>`               | Update type annotations and imports |
| `FormCompatibleDeepRequired<T>` | `NgxFormCompatibleDeepRequired<T>` | Update type annotations and imports |
| `FieldKey<T>`                   | `NgxFieldKey<T>`                   | Update type annotations and imports |
| `NgxVestSuite<T>`               | `NgxVestSuite<T>`                  | Update type annotations and imports |
| `InjectRootFormKeyOptions`      | `NgxInjectRootFormKeyOptions`      | Update type annotations and imports |

### Token and Function Names

| Old Name (v1)                | New Name (v2)                    | Migration Required             |
| ---------------------------- | -------------------------------- | ------------------------------ |
| `ERROR_DISPLAY_MODE_DEFAULT` | `NGX_ERROR_DISPLAY_MODE_DEFAULT` | Update provider configurations |
| `ROOT_FORM`                  | `NGX_ROOT_FORM`                  | Update provider configurations |
| `injectRootFormKey()`        | `injectNgxRootFormKey()`         | Update function calls          |

### Migration Steps

#### 1. Update Component Imports

**Before:**

```typescript
import {
  FormDirective,
  FormErrorDisplayDirective,
  ValidationOptions,
  FormState,
} from 'ngx-vest-forms';

@Component({
  imports: [FormDirective, FormErrorDisplayDirective],
  // ...
})
export class MyFormComponent {
  protected formState: FormState<UserModel>;
  protected options: ValidationOptions = { debounceTime: 300 };
}
```

**After:**

```typescript
import {
  NgxFormDirective,
  NgxFormErrorDisplayDirective,
  NgxValidationOptions,
  NgxFormState,
} from 'ngx-vest-forms';

@Component({
  imports: [NgxFormDirective, NgxFormErrorDisplayDirective],
  // ...
})
export class MyFormComponent {
  protected formState: NgxFormState<UserModel>;
  protected options: NgxValidationOptions = { debounceTime: 300 };
}
```

#### 2. Update Type Annotations

**Before:**

```typescript
import { NgxVestSuite, NgxDeepRequired } from 'ngx-vest-forms';

const userSuite: NgxVestSuite<UserModel> = staticSuite(/* ... */);
type RequiredUser = NgxDeepRequired<UserModel>;
```

**After:**

```typescript
import { NgxVestSuite, NgxDeepRequired } from 'ngx-vest-forms';

const userSuite: NgxVestSuite<UserModel> = staticSuite(/* ... */);
type RequiredUser = NgxDeepRequired<UserModel>;
```

#### 3. Update Provider Configurations

**Before:**

```typescript
import { ERROR_DISPLAY_MODE_DEFAULT } from 'ngx-vest-forms';

providers: [
  {
    provide: ERROR_DISPLAY_MODE_DEFAULT,
    useValue: 'on-submit',
  },
];
```

**After:**

```typescript
import { NGX_ERROR_DISPLAY_MODE_DEFAULT } from 'ngx-vest-forms';

providers: [
  {
    provide: NGX_ERROR_DISPLAY_MODE_DEFAULT,
    useValue: 'on-submit',
  },
];
```

#### 4. Update Function Calls

**Before:**

```typescript
import { injectRootFormKey } from 'ngx-vest-forms';

const rootFormKey = injectRootFormKey();
```

**After:**

```typescript
import { injectNgxRootFormKey } from 'ngx-vest-forms';

const rootFormKey = injectNgxRootFormKey();
```

### Automated Migration Script

For large codebases, you can use this script to automate the migration:

```bash
# Save this as migrate-ngx-naming.sh
#!/bin/bash

# Navigate to your project directory
cd your-project-directory

# Create backup
git add . && git commit -m "Backup before NGX naming migration"

# Replace directive class names in TypeScript files
find . -name "*.ts" -type f -exec sed -i '' 's/FormDirective/NgxFormDirective/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/FormErrorDisplayDirective/NgxFormErrorDisplayDirective/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/FormModelDirective/NgxFormModelDirective/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/FormModelGroupDirective/NgxFormModelGroupDirective/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/FormControlStateDirective/NgxFormControlStateDirective/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/ValidateRootFormDirective/NgxValidateRootFormDirective/g' {} \;

# Replace type names (be careful with common names)
find . -name "*.ts" -type f -exec sed -i '' 's/\bFormState</NgxFormState</g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/\bValidationOptions\b/NgxValidationOptions/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/\bFormControlState\b/NgxFormControlState/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/\bErrorDisplayMode\b/NgxErrorDisplayMode/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/\bDeepPartial</NgxDeepPartial</g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/\bDeepRequired</NgxDeepRequired</g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/\bFormCompatibleDeepRequired</NgxFormCompatibleDeepRequired</g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/\bFieldKey</NgxFieldKey</g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/\bVestSuite</NgxVestSuite</g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/\bInjectRootFormKeyOptions\b/NgxInjectRootFormKeyOptions/g' {} \;

# Replace token and function names
find . -name "*.ts" -type f -exec sed -i '' 's/ERROR_DISPLAY_MODE_DEFAULT/NGX_ERROR_DISPLAY_MODE_DEFAULT/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/ROOT_FORM/NGX_ROOT_FORM/g' {} \;
find . -name "*.ts" -type f -exec sed -i '' 's/injectRootFormKey/injectNgxRootFormKey/g' {} \;

echo "NGX naming migration completed!"
echo "Please review the changes and test your application."
```

**Impact:**

- 🟢 **Low impact:** Mostly import and type annotation changes
- 🔧 **Easy migration:** Can be largely automated with find/replace
- 📦 **No bundle impact:** Pure naming changes, no functional differences
- ⚙️ **Backwards compatibility:** Old names are deprecated but still work

**If you're not using any ngx-vest-forms public API directly:** No changes required if you only use the directives in templates.

---

## Automated Migration Script

For large codebases, you can use this find/replace script:

### **Step 1: Update Imports**

```bash
# Update directive imports
find . -name "*.ts" -exec sed -i '' 's/FormErrorDisplayDirective/NgxFormErrorDisplayDirective/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/FormModelGroupDirective/NgxFormModelGroupDirective/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/FormModelDirective/NgxFormModelDirective/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/ValidateRootFormDirective/NgxValidateRootFormDirective/g' {} \;

# Update type imports
find . -name "*.ts" -exec sed -i '' 's/ValidationOptions/NgxValidationOptions/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/ErrorDisplayMode/NgxErrorDisplayMode/g' {} \;

# Update token imports
find . -name "*.ts" -exec sed -i '' 's/ERROR_DISPLAY_MODE_DEFAULT/NGX_ERROR_DISPLAY_MODE_DEFAULT/g' {} \;
find . -name "*.ts" -exec sed -i '' 's/ROOT_FORM/NGX_ROOT_FORM/g' {} \;

# Update function imports
find . -name "*.ts" -exec sed -i '' 's/injectRootFormKey/injectNgxRootFormKey/g' {} \;
```

### **Step 2: Update Secondary Entry Points**

```bash
# Control Wrapper
find . -name "*.ts" -exec sed -i '' 's|NgxControlWrapper.*from.*ngx-vest-forms|NgxControlWrapper} from '\''ngx-vest-forms/control-wrapper'\''|g' {} \;

# Smart State
find . -name "*.ts" -exec sed -i '' 's|NgxVestFormsSmartStateDirective.*from.*ngx-vest-forms|NgxVestFormsSmartStateDirective} from '\''ngx-vest-forms/smart-state'\''|g' {} \;

# Schema Utils
find . -name "*.ts" -exec sed -i '' 's|modelToStandardSchema.*from.*ngx-vest-forms|modelToStandardSchema} from '\''ngx-vest-forms/schemas'\''|g' {} \;
```

---

## Testing Your Migration

### **1. Build Test**

```bash
npm run build
# Should complete without errors and show smaller bundle sizes
```

### **2. Runtime Test**

```bash
npm start
# All forms should work exactly as before
```

### **3. Type Check**

```bash
npx tsc --noEmit
# Should pass without type errors
```

---

## Bundle Size Verification

After migration, verify your bundle improvements:

```bash
# Before migration
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/stats.json

# After migration (should show significant reduction)
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

**Expected results:**

- **Basic users**: ~44% smaller bundle
- **Control Wrapper users**: ~30% smaller bundle
- **Full feature users**: Modular loading, pay-per-feature

---

## Troubleshooting

### **Common Issues:**

#### **Type Errors After Migration**

```typescript
// ❌ Error: Cannot find name 'ValidationOptions'
function validate(options: ValidationOptions) {}

// ✅ Fix: Use new prefixed name
function validate(options: NgxValidationOptions) {}
```

#### **Import Errors**

```typescript
// ❌ Error: Module not found 'NgxControlWrapper'
import { NgxControlWrapper } from 'ngx-vest-forms';

// ✅ Fix: Use secondary entry point
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
```

#### **validateRootForm Issues**

```typescript
// ❌ Cross-field validation stopped working
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model">

// ✅ Fix: Explicitly enable root validation
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model" [validateRootForm]="true">
```

### **Getting Help**

- 📖 [Complete Breaking Changes Guide](./BREAKING_CHANGES_PUBLIC_API.md)
- 🏗️ [Internal Changes for Contributors](./BREAKING_CHANGES_INTERNAL.md)
- 📋 [What's New Overview](./CHANGES_OVERVIEW.md)
- 🐛 [Report Issues](https://github.com/simplifiedcourses/ngx-vest-forms/issues)

---

## Summary

ngx-vest-forms v2 provides:

- ✅ **44% smaller bundle** for basic users
- ✅ **Modular architecture** - pay only for what you use
- ✅ **Consistent NGX prefixing** - professional Angular library naming
- ✅ **Enhanced type safety** - better developer experience
- ✅ **Modern Angular patterns** - signals, standalone components
- ✅ **Backward compatibility** - minimal breaking changes for basic usage

Most users will experience **automatic bundle size improvements** with **zero code changes required**. Advanced users get a **cleaner, more modular API** with clear migration paths.

Welcome to ngx-vest-forms v2! 🚀
