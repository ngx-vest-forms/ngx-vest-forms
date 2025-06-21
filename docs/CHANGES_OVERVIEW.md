# ngx-vest-forms Changes Overview

## At a Glance

`ngx-vest-forms` v2 introduces **modularization** as the major architectural change. The library has been split into multiple secondary entry points to provide:

- 🎯 **Smaller core bundle** (44% reduction for basic usage)
- 🔧 **Pay-only-for-what-you-use** approach
- 📦 **Better tree-shaking** and performance

## What's New in v2

### 🏗️ Modular Architecture

The library is now split into focused packages:

| Package                          | Purpose                   | When to Use                            |
| -------------------------------- | ------------------------- | -------------------------------------- |
| `ngx-vest-forms`                 | Core form validation      | **Always required**                    |
| `ngx-vest-forms/smart-state`     | Advanced state management | User profiles, real-time collaboration |
| `ngx-vest-forms/control-wrapper` | UI wrapper component      | Rapid prototyping, consistent styling  |
| `ngx-vest-forms/schemas`         | Schema utilities          | Type safety with Zod/ArkType/Valibot   |

### 🚀 Enhanced Features

- **Smart State Management**: Intelligent conflict resolution for external data updates
- **Improved Control Wrapper**: Better accessibility and configuration options
- **Enhanced Schema Support**: First-class integration with popular schema libraries
- **Modern Angular Patterns**: Full Angular 17+ compatibility with signals and new control flow

## Migration Impact by Usage

### ✅ Basic Form Users (No Changes Required)

If you only use basic form validation:

```typescript
import { ngxVestForms } from 'ngx-vest-forms';
// This continues to work unchanged
```

**Result**: 44% smaller bundle size, no code changes needed.

### ⚠️ Advanced Feature Users (Migration Required)

If you use any of these features, you'll need to update imports:

- Smart state management → Import from `ngx-vest-forms/smart-state`
- `NgxControlWrapper` → Import from `ngx-vest-forms/control-wrapper`
- Schema utilities → Import from `ngx-vest-forms/schemas`

## Quick Migration Checklist

### Step 1: Identify Your Usage

Check your imports for these patterns:

```typescript
// ❌ These need to be updated
import { SmartStateOptions } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms';
import { ngxModelToStandardSchema } from 'ngx-vest-forms';
```

### Step 2: Update Imports

Replace with modular imports:

```typescript
// ✅ Updated imports
import { SmartStateOptions } from 'ngx-vest-forms/smart-state';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
```

### Step 3: Update Component Imports

Add new directive imports to your components:

```typescript
@Component({
  imports: [
    ngxVestForms,
    NgxVestFormsSmartStateDirective, // If using smart state
    NgxControlWrapper, // If using control wrapper
  ],
  // ...
})
```

### Step 4: Update Templates

Add new directives to forms:

```html
<form
  ngxVestForm
  ngxSmartStateExtension  <!-- If using smart state -->
  [vestSuite]="suite"
  [(formValue)]="model"
>
```

## Bundle Size Comparison

### Before v2 (Monolithic)

```text
All features bundled: ~45KB
```

### After v2 (Modular)

```text
Core only:           ~25KB (-44%)
+ Smart State:       ~35KB (+10KB)
+ Control Wrapper:   ~30KB (+5KB)
+ Schema Utilities:  ~32KB (+7KB)
```

**Impact**: Most users see significant bundle size reduction, advanced users pay only for features they use.

## Breaking Changes Summary

### v2.1: Smart State Modularization

- **What**: Smart state moved to `ngx-vest-forms/smart-state`
- **Impact**: Only affects users of smart state features
- **Migration**: Update imports and add directive

### v2.2: Control Wrapper Modularization

- **What**: `NgxControlWrapper` moved to `ngx-vest-forms/control-wrapper`
- **Impact**: Only affects users of the control wrapper
- **Migration**: Update imports, rename component
- **Bonus**: Configuration token renamed for clarity

### v2.3: Schema Utilities Modularization

- **What**: Schema utilities moved to `ngx-vest-forms/schemas`
- **Impact**: Only affects users of schema features
- **Migration**: Update imports only

## New Configuration

### Control Wrapper Configuration (Renamed)

```typescript
// Before
import { CONTROL_WRAPPER_ERROR_DISPLAY } from 'ngx-vest-forms';

// After
import { NGX_ERROR_DISPLAY_MODE_DEFAULT } from 'ngx-vest-forms';
```

## Recommended Upgrade Path

### For Basic Users

1. Update to v2.x
2. Test existing functionality
3. Enjoy smaller bundle size

### For Advanced Users

1. Review [Migration Guide](./MIGRATION_GUIDE_V2.md)
2. Update imports based on features used
3. Update component imports and templates
4. Test functionality
5. Consider new features

## Support Resources

- 📖 **[Complete Migration Guide](./MIGRATION_GUIDE_V2.md)** - Step-by-step instructions
- 📝 **[Breaking Changes Details](./BREAKING_CHANGES_PUBLIC_API.md)** - Comprehensive changes list
- 🏗️ **[Internal Changes](./BREAKING_CHANGES_INTERNAL.md)** - For contributors
- 💡 **[Examples](../projects/examples/)** - Updated working examples
- 🔧 **[Smart State Guide](./smart-state-management.md)** - Advanced state management
- 🎨 **[Control Wrapper Guide](../projects/ngx-vest-forms/control-wrapper/README.md)** - UI helpers

## FAQ

### Q: Do I need to migrate if I only use basic forms?

**A**: No! Your existing code will continue to work, and you'll get a smaller bundle automatically.

### Q: How do I know if I'm using advanced features?

**A**: Check your imports. If you import anything other than `ngxVestForms` from the main package, you may need to update.

### Q: Will this break my existing application?

**A**: Only if you're using advanced features. Basic form functionality remains unchanged.

### Q: Can I migrate gradually?

**A**: Yes! You can update one feature at a time. See the migration guide for a phased approach.

### Q: Is the API otherwise the same?

**A**: Yes! Only import paths have changed. The actual APIs and functionality remain the same or are enhanced.

---

_For detailed migration instructions, see our [Migration Guide](./MIGRATION_GUIDE_V2.md)._
