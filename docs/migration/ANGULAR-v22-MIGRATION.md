# Angular v22 Migration Guide for ngx-vest-forms

This guide covers the Angular v22 updates for both the **ngx-vest-forms library** and the **examples application**.

## 📋 Overview

ngx-vest-forms **v3.x** targets Angular v22. The examples application is aligned with Angular 22.1 best practices and APIs.

### Compatibility Matrix

| Package | Angular Version | Status |
|--------|-----------------|--------|
| `ngx-vest-forms` | >=22.0.0 <23.0.0 | ✅ Supported |
| Examples App | 22.1.x | ✅ Required |

Angular 22 tooling requires Node.js `^22.22.3 || ^24.15.0 || ^26.0.0`.

## 🔧 Library Changes (ngx-vest-forms)

### Peer Dependencies Update

The library's `peerDependencies` have been updated to explicitly support Angular v22:

```json
{
  "peerDependencies": {
    "@angular/common": ">=22.0.0 <23.0.0",
    "@angular/core": ">=22.0.0 <23.0.0",
    "@standard-schema/spec": ">=1.0.0",
    "rxjs": ">=7.8.0",
    "vest": ">=6.0.0"
  }
}
```

Angular 21 applications must upgrade to Angular 22 before adopting ngx-vest-forms v3.

### Change Detection Strategy

Angular 22 uses OnPush change detection by default. Library and example components therefore omit an explicit `changeDetection` option, as recommended by Angular's current best-practices guide.

### Angular 22.1 review

- `linkedSignal(..., { set })` was reviewed for form synchronization. It is not used in `FormDirective` because the linked signal is a derived Angular-form snapshot; write-through would blur ownership between the form and consumer model.
- The injectable-to-service migration is reflected in the examples: root-provided example services use `@Service()`.
- The new HTTP transfer-cache options are not relevant to the client-only mock API examples.
- Deprecated JSONP APIs are not used by either project.

## 🚀 Examples Application Updates

The examples application has been fully modernized to use Angular v22 best practices and features.

### 1. Service Registration with `@Service()`

All services in the examples app now use the new `@Service()` decorator instead of `@Injectable({ providedIn: 'root' })`.

**Before:**
```typescript
@Injectable({ providedIn: 'root' })
export class ProductService {
  // ...
}
```

**After:**
```typescript
@Service()
export class ProductService {
  // ...
}
```

**Files updated:**
- `apps/examples/src/app/pages/purchase-form/product.service.ts`
- `apps/examples/src/app/pages/purchase-form/swapi.service.ts`
- `apps/examples/src/app/pages/async-username-form/username-availability.service.ts`
- `apps/examples/src/app/pages/auto-save-demo/auto-save-demo.service.ts`
- `apps/examples/src/app/pages/submission-patterns-form/account.service.ts`

### 2. Lazy Service Loading with `injectAsync()`

The submission patterns demo now uses `injectAsync()` to lazy-load the `AccountService` with idle prefetching.

**Implementation:**
```typescript
private readonly accountService = injectAsync(
  () => import('./account.service').then((m) => m.AccountService),
  { prefetch: onIdle }
);

// Usage in component
private async callServer(): Promise<void> {
  const accountService = await this.accountService();
  // Use the service...
}
```

**Benefits:**
- Service bundle is loaded only when needed
- Prefetched when browser is idle for better UX
- Reduces initial bundle size

**File updated:**
- `apps/examples/src/app/pages/submission-patterns-form/submission-patterns.page.ts`

### 3. HTTP Resource API with Zod Parsing

The purchase form demo now uses `httpResource()` with Zod schema validation for data fetching.

**Implementation:**
```typescript
import { httpResource } from '@angular/common/http';
import { z } from 'zod';

const lukeApiResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.enum(['male', 'female', 'other']),
});

private readonly lukeResource = httpResource<LukeApiResponse>(
  () => {
    const request = this.requestedPersonId();
    if (!request) return undefined;
    return `/api/people/${request.personId}`;
  },
  {
    parse: lukeApiResponseSchema.parse, // Zod validation
  }
);

// Usage in template
private readonly lukeData = computed(() => {
  return this.lukeResource.hasValue() ? this.lukeResource.value() : undefined;
});
```

**Benefits:**
- Type-safe HTTP responses
- Automatic validation with Zod
- Reactive data fetching integrated with signals
- Automatic re-fetching when parameters change

**File updated:**
- `apps/examples/src/app/pages/purchase-form/purchase.form.ts`

### 4. OnPush as Default Change Detection

All components in the examples app now use OnPush change detection by default (no explicit strategy needed).

**Before:**
```typescript
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
```

**After:**
```typescript
@Component({
  selector: 'app-example',
  template: `...`
})
// OnPush is now the default in Angular v22
```

### 5. Router Parameter Inheritance

The examples app now benefits from the new default `paramsInheritanceStrategy: 'always'` in Angular v22.

**Before (workaround needed):**
```typescript
// Accessing grandparent route params
const grandparentId = this.route.parent?.parent?.snapshot.params['id'];
```

**After (direct access):**
```typescript
// Params are now inherited by default
const grandparentId = this.route.snapshot.params['id'];
```

### 6. Template and control-flow alignment

Examples are aligned with Angular v22 template syntax and keep the repository's
recommended ngx-vest-forms usage patterns:

- unidirectional `[ngModel]` bindings
- `@if`/`@for` control-flow where appropriate
- stable `name` paths that match model field paths

## 🔄 Migration Steps for Users

### For Library Users (No Changes Required)

If you're using ngx-vest-forms with Angular v22:

1. **No code changes needed** - The library is fully backward compatible
2. **Update dependencies** (optional):
   ```bash
  pnpm up @angular/*@22.1 ngx-vest-forms@latest
   ```

### For Examples App Contributors

If you're working on the examples app:

1. **Ensure Angular v22:**
   ```bash
  pnpm up @angular/*@22.1 @angular/cli@22.1
   ```

2. **Use new patterns:**
   - Use `@Service()` for root-provided services
   - Use `injectAsync()` for lazy-loaded services
   - Use `httpResource()` for data fetching
   - Remove explicit `OnPush` declarations (it's now default)

## 🧪 Testing

Both the library and examples app have been tested with Angular v22:

### Library Tests
```bash
pnpm nx run ngx-vest-forms:test
```

### Examples App Tests
```bash
pnpm nx run examples:test
```

### Build Verification
```bash
pnpm nx run-many -t build
```

Run these commands in your branch to verify current status.

## 📚 New Angular v22 Features Demonstrated

The examples app now showcases these Angular v22 features:

| Feature | Location | Description |
|--------|----------|-------------|
| `@Service()` | All services | Simplified service registration |
| `injectAsync()` | Submission patterns | Lazy service loading with prefetch |
| `httpResource()` | Purchase form | Reactive HTTP with Zod validation |
| OnPush Default | All components | Automatic OnPush change detection |

## 🔍 Troubleshooting

### Issue: "Cannot find name 'Service'"

**Solution:** Ensure you're using Angular v22+ and import from `@angular/core`:
```typescript
import { Service } from '@angular/core';
```

### Issue: "injectAsync is not a function"

**Solution:** Ensure you're using Angular v22+ and import from `@angular/core`:
```typescript
import { injectAsync, onIdle } from '@angular/core';
```

### Issue: "httpResource is not a function"

**Solution:** Import from `@angular/common/http`:
```typescript
import { httpResource } from '@angular/common/http';
```

## 📖 Additional Resources

- [Angular v22 Official Announcement](https://blog.angular.dev/announcing-angular-v22-c52bb83a4664)
- [Angular v22 Key Features](https://angular.love/angular-22-key-features-and-changes)
- [What's New in Angular 22.0](https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0)

## 🎯 Summary

- **Library**: ✅ Compatible with Angular v22
- **Examples**: ✅ Fully modernized with Angular v22 best practices
- **Breaking Changes**: ❌ None for library users
- **New Features**: ✅ All major Angular v22 features demonstrated

The migration is designed to be **non-breaking** for existing users while providing a **modern, forward-looking** examples application that showcases Angular v22's latest capabilities.
