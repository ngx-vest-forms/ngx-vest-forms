# Selector Prefix Migration Guide: `sc-` → `ngx-`

## Overview

As of **v2.0.0**, ngx-vest-forms recommends using the `ngx-` prefix for all selectors. The legacy `sc-` prefix is **deprecated** and will be **removed in v3.0.0**.

**Timeline:**

- ✅ **v2.0+**: Both prefixes supported (dual selector support)
- ⚠️ **v2.x**: `sc-` prefix deprecated (warnings in console)
- ❌ **v3.0**: `sc-` prefix removed (breaking change)

## What Changed

### Components

| Old (Deprecated)       | New (Recommended)       | Status            |
| ---------------------- | ----------------------- | ----------------- |
| `<sc-control-wrapper>` | `<ngx-control-wrapper>` | Both work in v2.x |
| `[scControlWrapper]`   | `[ngxControlWrapper]`   | Both work in v2.x |
| `[sc-control-wrapper]` | `[ngx-control-wrapper]` | Both work in v2.x |

### Directives

| Old (Deprecated)     | New (Recommended)     | Status            |
| -------------------- | --------------------- | ----------------- |
| `scVestForm`         | `ngxVestForm`         | Both work in v2.x |
| `validateRootForm`   | `ngxValidateRootForm` | Both work in v2.x |
| `[formControlState]` | `[ngxControlState]`   | Both work in v2.x |

### Template References

| Old (Deprecated)         | New (Recommended)         |
| ------------------------ | ------------------------- |
| `#vestForm="scVestForm"` | `#vestForm="ngxVestForm"` |

## Migration Steps

### Step 1: Find All Usages

Search your codebase for deprecated selectors:

```bash
# Find component usages
grep -r "sc-control-wrapper" --include="*.html" --include="*.ts"
grep -r "scControlWrapper" --include="*.html" --include="*.ts"

# Find directive usages
grep -r "scVestForm" --include="*.html" --include="*.ts"
grep -r 'validateRootForm' --include="*.html" --include="*.ts"
grep -r "formControlState" --include="*.html" --include="*.ts"

# Find template references
grep -r '"scVestForm"' --include="*.html" --include="*.ts"
```

### Step 2: Replace Selectors

You can do a global search and replace, or migrate gradually since both prefixes work in v2.x:

#### Component Selectors

```html
<!-- Before (v1.x / deprecated) -->
<sc-control-wrapper>
  <label>Email</label>
  <input name="email" [ngModel]="formValue().email" />
</sc-control-wrapper>

<!-- After (v2.x+) -->
<ngx-control-wrapper>
  <label>Email</label>
  <input name="email" [ngModel]="formValue().email" />
</ngx-control-wrapper>
```

```html
<!-- Before (attribute directive, deprecated) -->
<div scControlWrapper>
  <input name="email" [ngModel]="formValue().email" />
</div>

<!-- After (v2.x+) -->
<div ngxControlWrapper>
  <input name="email" [ngModel]="formValue().email" />
</div>
```

#### Form Directive

```html
<!-- Before (deprecated) -->
<form scVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
  <!-- form fields -->
</form>

<!-- After (v2.x+) -->
<form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
  <!-- form fields -->
</form>
```

#### Root Form Validation

```html
<!-- Before (deprecated) -->
<form scVestForm validateRootForm [validateRootFormMode]="'submit'">
  <!-- form fields -->
</form>

<!-- After (v2.x+) -->
<form ngxVestForm ngxValidateRootForm [validateRootFormMode]="'submit'">
  <!-- form fields -->
</form>
```

#### Template References

```typescript
// Before (deprecated)
@Component({
  template: `
    <form scVestForm #vestForm="scVestForm">
      <!-- form fields -->
    </form>
  `,
})
class MyComponent {
  @ViewChild('vestForm', { read: FormDirective })
  private readonly vestFormRef!: FormDirective<MyFormModel>;
}

// After (v2.x+)
@Component({
  template: `
    <form ngxVestForm #vestForm="ngxVestForm">
      <!-- form fields -->
    </form>
  `,
})
class MyComponent {
  // Modern Angular 20+: Use viewChild() instead
  private readonly vestFormRef = viewChild.required('vestForm', {
    read: FormDirective<MyFormModel>,
  });
}
```

### Step 3: Update Imports (if needed)

Most imports don't change, but verify you're using the recommended type names:

```typescript
// Before (legacy aliases still work)
import { DeepPartial, DeepRequired } from 'ngx-vest-forms';

// After (recommended with Ngx prefix)
import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';
```

### Step 4: Test Thoroughly

After migration:

1. ✅ Run your test suite
2. ✅ Test all forms manually
3. ✅ Verify validation behavior
4. ✅ Check error display components
5. ✅ Test conditional form logic

## Automated Migration Script

You can use this bash script to automate most replacements:

```bash
#!/bin/bash
# migrate-selectors.sh

# Find all TypeScript and HTML files
find . -type f \( -name "*.ts" -o -name "*.html" \) -not -path "*/node_modules/*" | while read file; do
  # Component selectors
  sed -i '' 's/sc-control-wrapper/ngx-control-wrapper/g' "$file"
  sed -i '' 's/scControlWrapper/ngxControlWrapper/g' "$file"

  # Directives
  sed -i '' 's/scVestForm/ngxVestForm/g' "$file"
  sed -i '' 's/validateRootForm/ngxValidateRootForm/g' "$file"
  sed -i '' 's/\[formControlState\]/[ngxControlState]/g' "$file"

  # Template references
  sed -i '' 's/"scVestForm"/"ngxVestForm"/g' "$file"

  echo "Migrated: $file"
done

echo "✅ Migration complete! Review changes before committing."
```

**Usage:**

```bash
chmod +x migrate-selectors.sh
./migrate-selectors.sh
```

**⚠️ Important:** Review all changes before committing! The script does global replacements that might need manual adjustments.

## Gradual Migration Strategy

You don't have to migrate everything at once. Both prefixes work in v2.x:

### Phase 1: New Code (Immediate)

- Use `ngx-` prefix in all new components and forms
- Update team coding standards

### Phase 2: High-Traffic Forms (Week 1-2)

- Migrate your most-used forms first
- Focus on critical user flows
- Test thoroughly

### Phase 3: Remaining Forms (Week 3-4)

- Migrate less frequently used forms
- Update documentation and examples

### Phase 4: Final Cleanup (Before v3.0)

- Search for any remaining `sc-` prefixes
- Remove any commented-out old code
- Update all tests

## Common Migration Issues

### Issue 1: Template Reference Type Errors

**Problem:**

```typescript
// Error: Type 'FormDirective<unknown>' is not assignable to type 'FormDirective<MyModel>'
@ViewChild('vestForm') vestFormRef!: FormDirective<MyModel>;
```

**Solution:**

```typescript
// Specify read option
@ViewChild('vestForm', { read: FormDirective })
vestFormRef!: FormDirective<MyModel>;

// Or use modern viewChild() (Angular 20+)
vestFormRef = viewChild.required('vestForm', { read: FormDirective<MyModel> });
```

### Issue 2: CSS Selectors

**Problem:** Custom styles targeting old selectors

```scss
// ❌ Old styles won't work after migration
sc-control-wrapper {
  margin-bottom: 1rem;
}
```

**Solution:** Update CSS/SCSS files

```scss
// ✅ New styles
ngx-control-wrapper {
  margin-bottom: 1rem;
}

// Or during migration, target both:
sc-control-wrapper,
ngx-control-wrapper {
  margin-bottom: 1rem;
}
```

### Issue 3: E2E/Integration Tests

**Problem:** Tests selecting elements by old selectors

```typescript
// ❌ Old test
await page.locator('sc-control-wrapper').first();
```

**Solution:** Update test selectors

```typescript
// ✅ New test
await page.locator('ngx-control-wrapper').first();
```

## Verification Checklist

After migration, verify:

- [ ] All forms render correctly
- [ ] Validation works as expected
- [ ] Error messages display properly
- [ ] Conditional logic still works
- [ ] Tests pass (unit, integration, e2e)
- [ ] No console warnings about deprecated selectors
- [ ] CSS styles still apply correctly
- [ ] Template references work
- [ ] Form submission works
- [ ] No `sc-` prefixes remain in code

## Why This Change?

### Consistency with Angular Ecosystem

Most Angular libraries use the package name as selector prefix:

- `@angular/material` → `mat-button`
- `@ng-bootstrap/ng-bootstrap` → `ngb-modal`
- **`ngx-vest-forms`** → `ngx-control-wrapper` ✅

### Avoid Naming Conflicts

The `sc-` prefix was from the original "Simplified Courses" context. The `ngx-` prefix:

- Clearly identifies the package origin
- Reduces conflict potential with other libraries
- Follows Angular community conventions

### Future-Proofing

Using `ngx-` prefix allows the library to evolve independently of its original context while maintaining clear package identity.

## Need Help?

If you encounter issues during migration:

1. **Check the Examples**: See [complete examples](../projects/examples/src/app/) in the repo
2. **Review Documentation**: All docs use the new `ngx-` prefix
3. **Open an Issue**: [GitHub Issues](https://github.com/ngx-vest-forms/ngx-vest-forms/issues) for bugs
4. **Ask Questions**: Use GitHub Discussions for migration questions

## See Also

- [Dual Selector Support Technical Details](./dev/DUAL-SELECTOR-SUPPORT.md)
- [Complete Example](./COMPLETE-EXAMPLE.md) - Full working example with new selectors
- [Migration Guide (v1.4 → v1.5)](./MIGRATION.md) - For older version upgrades
- [Migration Guide (v1.x → v2.0.0)](./archive/MIGRATION-v1.x-to-v2.0.0.md) - Complete migration guide for v2.0.0 upgrade
- [Main README](../README.md) - Library overview and quick start

---

**Version:** 1.0.0
**Last Updated:** November 15, 2025
**Applies To:** v2.0.0+
