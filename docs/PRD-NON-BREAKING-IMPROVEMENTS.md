# Product Requirements Document: Non-Breaking Improvements for ngx-vest-forms

**Version:** 1.0
**Date:** November 8, 2025
**Status:** Draft
**Priority:** High

## Executive Summary

This PRD outlines 6 high-impact, non-breaking improvements for ngx-vest-forms that will significantly enhance developer experience, type safety, accessibility, and performance. All changes maintain full backward compatibility with the current API.

---

## 1. Enhanced Field Path Types with Template Literal Autocomplete

### Problem Statement

Currently, field names in `validationConfig`, Vest suite `test()` calls, and other APIs are plain strings with no compile-time validation. This leads to:

- Typos in field names that only manifest at runtime
- No IDE autocomplete for nested field paths
- Manual string concatenation prone to errors (e.g., `'addresses.billingAddress.street'`)
- Difficult refactoring when model properties change

### Current State

```typescript
// Current implementation - plain strings
type FormModel = DeepPartial<{
  firstName: string;
  addresses: {
    billingAddress: {
      street: string;
      city: string;
    };
  };
}>;

// No autocomplete, no validation
const validationConfig = {
  firstName: ['addresses.billingAddress.street'], // typo-prone
  'addresses.billingAddress.city': ['firstName'],
};

// In Vest suite
test('addresses.billingAddress.street', 'Required', () => {
  // manually typed, error-prone
});
```

### Proposed Solution

Implement recursive template literal types for field path generation with full type safety and IDE autocomplete.

```typescript
// New utility types
type Primitive = string | number | boolean | Date | null | undefined;

/**
 * Recursively generates all valid field paths for a type as string literals
 * @example
 * type Paths = FieldPath<{ user: { name: string; address: { city: string } } }>
 * // 'user' | 'user.name' | 'user.address' | 'user.address.city'
 */
export type FieldPath<T, Prefix extends string = ''> = T extends Primitive
  ? never
  : {
      [K in keyof T & string]: T[K] extends Primitive
        ? `${Prefix}${K}`
        : `${Prefix}${K}` | FieldPath<T[K], `${Prefix}${K}.`>;
    }[keyof T & string];

/**
 * Type-safe validation config builder
 */
export type ValidationConfigMap<T> = {
  [K in FieldPath<T>]?: FieldPath<T>[];
};

/**
 * Type-safe field name for Vest tests
 */
export type FormFieldName<T> = FieldPath<T> | typeof ROOT_FORM;
```

**Usage Example:**

```typescript
type FormModel = DeepPartial<{
  firstName: string;
  addresses: {
    billingAddress: {
      street: string;
      city: string;
    };
  };
}>;

// ✅ Autocomplete works! IDE suggests valid paths
const validationConfig: ValidationConfigMap<FormModel> = {
  firstName: ['addresses.billingAddress.street'], // autocomplete
  'addresses.billingAddress.city': ['firstName'], // autocomplete
};

// ✅ Type-safe Vest suite
export const suite = staticSuite(
  (data: FormModel, field?: FormFieldName<FormModel>) => {
    only(field);

    // IDE autocomplete for field names
    test('firstName', 'Required', () => {
      /*...*/
    });
    test('addresses.billingAddress.street', 'Required', () => {
      /*...*/
    });

    // ❌ TypeScript error on typo
    // test('addresses.billingAdress.street', 'Required', () => { /*...*/ });
  }
);
```

### Technical Implementation

**New Files:**

- `projects/ngx-vest-forms/src/lib/utils/field-path-types.ts`

**Modified Files:**

- `projects/ngx-vest-forms/src/lib/directives/form.directive.ts` - Update `validationConfig` input type
- `projects/ngx-vest-forms/src/lib/utils/validation-suite.ts` - Update suite type signature
- `projects/ngx-vest-forms/src/public-api.ts` - Export new types

**Breaking Changes:** None (enhanced types are backward compatible)

### Benefits

- **Type Safety:** Compile-time validation of field names
- **Developer Experience:** IDE autocomplete for all field paths
- **Refactoring Safety:** Renaming model properties updates all references
- **Error Prevention:** Typos caught at build time, not runtime
- **Documentation:** Types serve as inline documentation

### Success Metrics

- [ ] Zero TypeScript errors in existing codebase after implementation
- [ ] IDE autocomplete works for all field path scenarios
- [ ] Unit tests verify type inference for nested objects (3+ levels deep)
- [ ] Documentation with before/after examples

### Risks & Mitigations

| Risk                                        | Impact | Mitigation                                                            |
| ------------------------------------------- | ------ | --------------------------------------------------------------------- |
| Complex types slow down TypeScript compiler | Medium | Add compiler performance tests; provide `string` fallback type helper |
| Breaking change for complex generic usage   | Low    | Types are assignable from `string`, maintaining compatibility         |
| Confusing for beginners                     | Low    | Comprehensive documentation with progressive examples                 |

---

## 2. Development-Mode Error Messages with Context-Aware Helpers

### Problem Statement

When developers make mistakes with ngx-vest-forms, error messages are generic Angular errors that don't provide guidance on how to fix the issue. Common issues include:

- `name` attribute doesn't match model property path
- Missing `vestFormsViewProviders` in child components
- Incorrect `validationConfig` setup
- Vest suite not properly structured

### Current State

```typescript
// User creates this (wrong):
<input name="user_email" [ngModel]="formValue().email" />

// Angular throws generic error:
// "Cannot find control with name: 'user_email'"

// No guidance on what's wrong or how to fix it
```

### Proposed Solution

Add development-mode helper utilities that provide actionable error messages with:

- Clear explanation of what went wrong
- Specific guidance on how to fix it
- Link to documentation
- Code examples when relevant

```typescript
// New error catalog
export const NGX_VEST_ERRORS = {
  'NGX-001': {
    code: 'NGX-001',
    title: 'Name attribute mismatch',
    message: (name: string, path: string) =>
      `The 'name' attribute "${name}" does not match the model property path "${path}".`,
    solution: `Ensure the 'name' attribute exactly matches the property path in [ngModel].`,
    example: `
<!-- ✅ Correct -->
<input name="email" [ngModel]="formValue().email" />

<!-- ❌ Wrong -->
<input name="user_email" [ngModel]="formValue().email" />`,
    docUrl:
      'https://github.com/ngx-vest-forms/ngx-vest-forms/docs/errors/NGX-001',
  },
  'NGX-002': {
    code: 'NGX-002',
    title: 'ViewProviders missing in child component',
    message: (componentName: string) =>
      `Component '${componentName}' contains form controls but is missing 'vestFormsViewProviders'.`,
    solution: `Add 'vestFormsViewProviders' to the component's viewProviders array.`,
    example: `
@Component({
  selector: 'app-user-form',
  viewProviders: [vestFormsViewProviders], // ← Add this
  template: \`<input name="email" ngModel />\`
})`,
    docUrl:
      'https://github.com/ngx-vest-forms/ngx-vest-forms/docs/errors/NGX-002',
  },
  'NGX-003': {
    code: 'NGX-003',
    title: 'Validation suite execution error',
    message: (field: string, error: string) =>
      `Vest suite failed to execute for field '${field}': ${error}`,
    solution: `Check your Vest suite implementation. Common issues:
- Missing 'only(field)' call at the top of the suite
- Async validation without proper promise handling
- Accessing undefined properties without optional chaining`,
    example: `
// ✅ Correct
export const suite = staticSuite((data, field) => {
  only(field); // ← Must be first, unconditional

  test('email', 'Required', () => {
    enforce(data?.email).isNotBlank(); // ← Use optional chaining
  });
});`,
    docUrl:
      'https://github.com/ngx-vest-forms/ngx-vest-forms/docs/errors/NGX-003',
  },
  'NGX-004': {
    code: 'NGX-004',
    title: 'Invalid validationConfig dependency',
    message: (triggerField: string, dependentField: string) =>
      `ValidationConfig references non-existent dependent field '${dependentField}' for trigger '${triggerField}'.`,
    solution: `Verify that all fields in validationConfig exist in your form model and template.`,
    example: `
// Model
type FormModel = { password: string; confirmPassword: string };

// ✅ Correct - both fields exist
validationConfig = {
  'password': ['confirmPassword']
};

// ❌ Wrong - typo in dependent field
validationConfig = {
  'password': ['confirmPasswrd'] // ← typo
};`,
    docUrl:
      'https://github.com/ngx-vest-forms/ngx-vest-forms/docs/errors/NGX-004',
  },
  'NGX-005': {
    code: 'NGX-005',
    title: 'Shape validation mismatch',
    message: (path: string, expectedType: string, actualType: string) =>
      `Shape validation failed at path '${path}': expected ${expectedType}, got ${actualType}`,
    solution: `Ensure your form model matches the shape definition. This validation only runs in development mode.`,
    example: `
// Shape definition
const shape: DeepRequired<FormModel> = {
  age: 0 // ← expects number
};

// ❌ Wrong - passing string
formValue.set({ age: '25' }); // type error + runtime warning`,
    docUrl:
      'https://github.com/ngx-vest-forms/ngx-vest-forms/docs/errors/NGX-005',
  },
} as const;

/**
 * Helper to throw development-mode errors with rich context
 */
export function throwNgxVestError(
  errorCode: keyof typeof NGX_VEST_ERRORS,
  ...args: any[]
): never {
  if (!isDevMode()) {
    throw new Error(`[ngx-vest-forms] ${errorCode}`);
  }

  const errorDef = NGX_VEST_ERRORS[errorCode];
  const message =
    typeof errorDef.message === 'function'
      ? errorDef.message(...args)
      : errorDef.message;

  console.group(`❌ [ngx-vest-forms] ${errorDef.code}: ${errorDef.title}`);
  console.error(message);
  console.log('\n💡 Solution:', errorDef.solution);
  if (errorDef.example) {
    console.log('\n📝 Example:', errorDef.example);
  }
  console.log(`\n📖 Documentation: ${errorDef.docUrl}`);
  console.groupEnd();

  throw new Error(`[ngx-vest-forms:${errorCode}] ${message}`);
}

/**
 * Helper to log development-mode warnings
 */
export function warnNgxVest(
  errorCode: keyof typeof NGX_VEST_ERRORS,
  ...args: any[]
): void {
  if (!isDevMode()) return;

  const errorDef = NGX_VEST_ERRORS[errorCode];
  const message =
    typeof errorDef.message === 'function'
      ? errorDef.message(...args)
      : errorDef.message;

  console.group(`⚠️ [ngx-vest-forms] ${errorDef.code}: ${errorDef.title}`);
  console.warn(message);
  console.log('\n💡 Solution:', errorDef.solution);
  if (errorDef.example) {
    console.log('\n📝 Example:', errorDef.example);
  }
  console.log(`\n📖 Documentation: ${errorDef.docUrl}`);
  console.groupEnd();
}
```

**Integration in form.directive.ts:**

```typescript
// In validationConfig effect
if (!dependentControl) {
  if (isDevMode()) {
    warnNgxVest('NGX-004', triggerField, depField);
  }
  continue;
}

// In createAsyncValidator
suite(snap, field)
  .done((result: any) => {
    // ... existing logic
  })
  .catch((error) => {
    if (isDevMode()) {
      warnNgxVest('NGX-003', field, error.message);
    }
    observer.next({ vestInternalError: 'Validation failed' });
  });
```

### Technical Implementation

**New Files:**

- `projects/ngx-vest-forms/src/lib/errors/error-catalog.ts`
- `projects/ngx-vest-forms/src/lib/errors/error-helpers.ts`
- `docs/ERRORS.md` - Error reference documentation

**Modified Files:**

- `projects/ngx-vest-forms/src/lib/directives/form.directive.ts` - Add error helpers
- `projects/ngx-vest-forms/src/lib/utils/shape-validation.ts` - Add shape mismatch errors
- `projects/ngx-vest-forms/src/public-api.ts` - Export error helpers (for testing)

### Benefits

- **Faster Debugging:** Clear error messages reduce time to resolution
- **Better Onboarding:** New developers understand mistakes immediately
- **Documentation as Code:** Error messages link to comprehensive docs
- **Production Safety:** All helpers wrapped in `isDevMode()` checks (zero prod overhead)

### Success Metrics

- [ ] All common error scenarios have dedicated error codes
- [ ] Error messages include code examples
- [ ] Zero production bundle size impact (tree-shaken in prod builds)
- [ ] Documentation page with all error codes and solutions

---

## 3. Configurable Debouncing via Dependency Injection Token

### Problem Statement

The `VALIDATION_CONFIG_DEBOUNCE_TIME` is currently hardcoded to 100ms. Different applications have different needs:

- Fast networks → lower debounce (50ms) for snappier UX
- Slow networks/expensive validations → higher debounce (300ms) to reduce load
- Testing → 0ms for synchronous behavior

### Current State

```typescript
// constants.ts
export const VALIDATION_CONFIG_DEBOUNCE_TIME = 100; // ← hardcoded

// form.directive.ts
debounceTime(VALIDATION_CONFIG_DEBOUNCE_TIME); // ← cannot configure
```

### Proposed Solution

Introduce an InjectionToken for configurable debounce timing at app/route/component level.

```typescript
// New DI token
export const NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN = new InjectionToken<number>(
  'NgxValidationConfigDebounceTime',
  {
    providedIn: 'root',
    factory: () => 100, // default value
  }
);

// form.directive.ts
export class FormDirective<T> {
  private readonly configDebounceTime = inject(
    NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN
  );

  constructor() {
    // Use injected value instead of constant
    debounceTime(this.configDebounceTime);
  }
}
```

**Usage Examples:**

```typescript
// Global configuration
export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxVestForms(),
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: 200 // slower debounce for expensive async validations
    }
  ]
};

// Per-route configuration
{
  path: 'checkout',
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: 50 // fast feedback for checkout forms
    }
  ]
}

// Per-component override
@Component({
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: 0 // immediate for testing
    }
  ]
})
export class TestFormComponent {}
```

### Technical Implementation

**New Files:**

- `projects/ngx-vest-forms/src/lib/tokens/debounce.token.ts`

**Modified Files:**

- `projects/ngx-vest-forms/src/lib/constants.ts` - Deprecate constant, add migration note
- `projects/ngx-vest-forms/src/lib/directives/form.directive.ts` - Inject token instead of constant
- `projects/ngx-vest-forms/src/public-api.ts` - Export new token
- Documentation updates

### Benefits

- **Flexibility:** Configure per app/route/component needs
- **Performance Tuning:** Optimize for network/validation speed
- **Testing:** Zero debounce for synchronous tests
- **Backward Compatible:** Default value maintains current behavior

### Success Metrics

- [ ] Token works at app/route/component level
- [ ] Default behavior unchanged (100ms)
- [ ] Tests verify configuration hierarchy
- [ ] Documentation with performance tuning guide

---

## 4. ValidationConfig Fluent Builder API

### Problem Statement

Creating `validationConfig` objects is verbose and error-prone:

- Manual object construction
- Easy to forget bidirectional dependencies
- No type safety for field names (addresses by #1)
- No validation of configuration logic

### Current State

```typescript
// Manual, verbose, error-prone
protected validationConfig = {
  'password': ['confirmPassword'],
  'confirmPassword': ['password'], // easy to forget reverse
  'startDate': ['endDate'],
  'endDate': ['startDate'],
  'addresses.billingAddress.street': ['addresses.billingAddress.city']
};
```

### Proposed Solution

Fluent builder API with type-safe field names and convenience methods for common patterns.

```typescript
/**
 * Fluent builder for creating type-safe validation configurations
 */
export class ValidationConfigBuilder<T> {
  private config: Record<string, string[]> = {};

  /**
   * Add a one-way dependency: when `trigger` changes, revalidate `dependents`
   */
  whenChanged<K extends FieldPath<T>>(
    trigger: K,
    revalidate: FieldPath<T> | FieldPath<T>[]
  ): this {
    const deps = Array.isArray(revalidate) ? revalidate : [revalidate];
    this.config[trigger] = [...(this.config[trigger] || []), ...deps];
    return this;
  }

  /**
   * Add bidirectional dependency: when either field changes, revalidate the other
   */
  bidirectional<K1 extends FieldPath<T>, K2 extends FieldPath<T>>(
    field1: K1,
    field2: K2
  ): this {
    this.whenChanged(field1, field2);
    this.whenChanged(field2, field1);
    return this;
  }

  /**
   * Add multiple dependencies at once
   */
  group<K extends FieldPath<T>>(fields: K[]): this {
    // Each field triggers validation of all other fields in the group
    for (const field of fields) {
      const others = fields.filter((f) => f !== field);
      this.whenChanged(field, others);
    }
    return this;
  }

  /**
   * Merge with existing configuration
   */
  merge(other: ValidationConfigMap<T>): this {
    for (const [key, deps] of Object.entries(other)) {
      this.config[key] = [...(this.config[key] || []), ...deps];
    }
    return this;
  }

  /**
   * Build the final configuration object
   */
  build(): ValidationConfigMap<T> {
    return { ...this.config };
  }
}

/**
 * Helper function to create a builder
 */
export function createValidationConfig<T>(): ValidationConfigBuilder<T> {
  return new ValidationConfigBuilder<T>();
}
```

**Usage Examples:**

```typescript
// ✅ Clean, fluent, type-safe
protected validationConfig = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .bidirectional('startDate', 'endDate')
  .whenChanged('addresses.billingAddress.street', 'addresses.billingAddress.city')
  .build();

// ✅ Complex scenarios
protected validationConfig = createValidationConfig<FormModel>()
  .group(['firstName', 'lastName', 'email']) // all trigger each other
  .whenChanged('country', ['state', 'zipCode']) // country affects both
  .bidirectional('minPrice', 'maxPrice')
  .build();

// ✅ Conditional configuration
protected validationConfig = createValidationConfig<FormModel>()
  .whenChanged('orderType', 'deliveryDate')
  .merge(
    this.isInternational()
      ? { 'country': ['customsForm'] }
      : {}
  )
  .build();
```

### Technical Implementation

**New Files:**

- `projects/ngx-vest-forms/src/lib/utils/validation-config-builder.ts`
- `projects/ngx-vest-forms/src/lib/utils/validation-config-builder.spec.ts`

**Modified Files:**

- `projects/ngx-vest-forms/src/public-api.ts` - Export builder
- Documentation with examples

### Benefits

- **Type Safety:** Leverages FieldPath types from #1
- **Readability:** Intent is clear (bidirectional, group, etc.)
- **Maintainability:** Less boilerplate, easier to understand
- **Error Prevention:** Builder validates configuration structure

### Success Metrics

- [ ] Builder produces correct config object
- [ ] Type inference works with complex models
- [ ] All common patterns have convenience methods
- [ ] Unit tests for all builder methods
- [ ] Migration guide from manual config to builder

---

## 5. Optimized Computed Signal Memoization

### Problem Statement

The `formState` computed signal recalculates on every status change, even when the actual errors and validity haven't changed. For large forms with frequent status changes, this causes unnecessary work.

### Current State

```typescript
// form.directive.ts
public readonly formState = computed<NgxFormState<T>>(() => {
  this.#statusSignal(); // triggers on EVERY status change
  return {
    valid: this.ngForm.form.valid,
    errors: getAllFormErrors(this.ngForm.form), // expensive traversal
    value: this.#formValueSignal(),
  };
});
```

**Problem:** Even if status changes from `VALID` → `VALID` (no actual change), the computed recalculates.

### Proposed Solution

Add shallow equality checking with custom comparator to prevent unnecessary recalculations.

```typescript
/**
 * Shallow equality for form state to prevent unnecessary recalculations
 */
function formStateEqual<T>(
  a: NgxFormState<T> | undefined,
  b: NgxFormState<T> | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.valid === b.valid &&
    fastDeepEqual(a.errors, b.errors) &&
    fastDeepEqual(a.value, b.value)
  );
}

// Optimized computed signal
public readonly formState = computed<NgxFormState<T>>(
  () => {
    this.#statusSignal();
    return {
      valid: this.ngForm.form.valid,
      errors: getAllFormErrors(this.ngForm.form),
      value: this.#formValueSignal(),
    };
  },
  { equal: formStateEqual } // ← Add equality comparator
);
```

**Additional optimization for error collection:**

```typescript
// Cache error collection results
private errorCache = new WeakMap<AbstractControl, Record<string, any>>();

function getAllFormErrorsCached(form: AbstractControl): Record<string, any> {
  // Check if form structure/status actually changed
  const cacheKey = `${form.status}_${JSON.stringify(Object.keys(form.errors || {}))}`;
  const cached = this.errorCache.get(form);

  if (cached && cached.__cacheKey === cacheKey) {
    return cached;
  }

  const errors = getAllFormErrors(form);
  (errors as any).__cacheKey = cacheKey;
  this.errorCache.set(form, errors);

  return errors;
}
```

### Technical Implementation

**Modified Files:**

- `projects/ngx-vest-forms/src/lib/directives/form.directive.ts` - Add memoization
- `projects/ngx-vest-forms/src/lib/utils/form-utils.ts` - Add caching for error collection

**Performance Tests:**

- Create benchmark with 100+ field form
- Measure recalculation frequency before/after
- Verify memory usage with caching

### Benefits

- **Performance:** Reduces unnecessary recalculations by ~60-80%
- **Scalability:** Especially beneficial for large forms (50+ fields)
- **Zero API Changes:** Internal optimization, no breaking changes
- **Memory Efficient:** WeakMap ensures no memory leaks

### Success Metrics

- [ ] Benchmark shows 60%+ reduction in recalculations
- [ ] Large form (100 fields) performance improved
- [ ] Memory profiling shows no leaks
- [ ] All existing tests pass unchanged

---

## 6. Enhanced ARIA Management for Accessibility Compliance

### Problem Statement

Current ARIA implementation in `control-wrapper.component.html` has room for improvement to meet WCAG 2.2 AA standards:

- Error messages use `role="alert"` which may be too aggressive for some contexts
- No distinction between blocking errors and progressive warnings in ARIA semantics
- Missing `aria-describedby` association between controls and error messages
- No `aria-invalid` state on the actual input element

### Current V2 Implementation (Reference)

```html
<!-- v2-development control-wrapper.component.html -->
@if (errorDisplay.shouldShowErrors()) {
<div class="text-sm text-red-600" role="alert" aria-live="polite">
  <ul>
    @for (error of errorDisplay.errors(); track error) {
    <li>{{ error }}</li>
    }
  </ul>
</div>
} @if (errorDisplay.shouldShowWarnings() && errorDisplay.warnings().length > 0)
{
<div class="text-sm text-yellow-700" role="status" aria-live="polite">
  <ul>
    @for (warn of errorDisplay.warnings(); track warn) {
    <li>{{ warn }}</li>
    }
  </ul>
</div>
}
```

### Proposed Solution

Enhance ARIA management following WCAG 2.2 AA guidelines and best practices from the v2 branch.

#### Component Enhancement

```typescript
// Enhanced control-wrapper.component.ts
@Component({
  selector: 'sc-control-wrapper, [scControlWrapper], [sc-control-wrapper]',
  templateUrl: './control-wrapper.component.html',
  styleUrls: ['./control-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sc-control-wrapper',
    '[class.sc-control-wrapper--invalid]': 'errorDisplay.shouldShowErrors()',
    '[class.sc-control-wrapper--has-warnings]':
      'errorDisplay.shouldShowWarnings()',
    '[attr.aria-busy]': "errorDisplay.isPending() ? 'true' : null",
  },
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode'],
    },
  ],
})
export class ControlWrapperComponent implements AfterContentInit {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
  private readonly elementRef = inject(ElementRef);

  // Generate unique IDs for ARIA associations
  protected readonly errorId = `error-${Math.random().toString(36).substr(2, 9)}`;
  protected readonly warningId = `warning-${Math.random().toString(36).substr(2, 9)}`;
  protected readonly hintId = `hint-${Math.random().toString(36).substr(2, 9)}`;

  ngAfterContentInit(): void {
    // Associate control with error/warning messages via aria-describedby
    this.setupAriaAssociations();
  }

  private setupAriaAssociations(): void {
    const control = this.findControl();
    if (!control) return;

    effect(() => {
      const descriptions: string[] = [];

      // Add hint if present
      const hint = this.elementRef.nativeElement.querySelector('[data-hint]');
      if (hint) {
        descriptions.push(this.hintId);
      }

      // Add errors if shown
      if (this.errorDisplay.shouldShowErrors()) {
        descriptions.push(this.errorId);
      }

      // Add warnings if shown
      if (this.errorDisplay.shouldShowWarnings()) {
        descriptions.push(this.warningId);
      }

      // Update aria-describedby
      if (descriptions.length > 0) {
        control.setAttribute('aria-describedby', descriptions.join(' '));
      } else {
        control.removeAttribute('aria-describedby');
      }

      // Update aria-invalid state
      control.setAttribute(
        'aria-invalid',
        this.errorDisplay.shouldShowErrors() ? 'true' : 'false'
      );
    });
  }

  private findControl(): HTMLElement | null {
    const nativeEl = this.elementRef.nativeElement;
    return nativeEl.querySelector('input, select, textarea, [ngModel]');
  }
}
```

#### Template Enhancement

```html
<!-- Enhanced control-wrapper.component.html -->
<div class="ngx-control-wrapper">
  <div class="sc-control-wrapper__content">
    <ng-content />
  </div>

  <!-- Hints (always visible, referenced by aria-describedby) -->
  <ng-content select="[data-hint]" />

  <!-- Errors: role="alert" for blocking validation failures -->
  @if (errorDisplay.shouldShowErrors()) {
  <div
    [id]="errorId"
    class="text-sm text-red-600"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    <ul>
      @for (error of errorDisplay.errors(); track error) {
      <li>{{ error.message || error }}</li>
      }
    </ul>
  </div>
  }

  <!-- Warnings: role="status" for non-blocking progressive guidance -->
  @if (errorDisplay.shouldShowWarnings() && errorDisplay.warnings().length > 0)
  {
  <div
    [id]="warningId"
    class="text-sm text-yellow-700"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <ul>
      @for (warn of errorDisplay.warnings(); track warn) {
      <li>{{ warn }}</li>
      }
    </ul>
  </div>
  }

  <!-- Pending state with accessible loading indicator -->
  @if (errorDisplay.isPending()) {
  <div
    class="flex items-center gap-1 text-xs text-gray-500"
    role="status"
    aria-live="polite"
  >
    <span
      class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
      aria-hidden="true"
    ></span>
    <span>Validating…</span>
  </div>
  }
</div>
```

### Key Improvements

1. **Proper ARIA Roles:**
   - Errors: `role="alert"` + `aria-live="assertive"` (blocking failures)
   - Warnings: `role="status"` + `aria-live="polite"` (progressive guidance)
   - Pending: `role="status"` (non-critical updates)

2. **ARIA Associations:**
   - `aria-describedby` links controls to error/warning/hint messages
   - Dynamic updates when errors appear/disappear
   - Supports multiple message types simultaneously

3. **State Management:**
   - `aria-invalid="true"` on controls with errors
   - `aria-busy="true"` during async validation
   - Automatic cleanup when states change

4. **Accessibility Features:**
   - `aria-atomic="true"` ensures complete message announcement
   - Unique IDs for proper associations
   - Hidden spinner from screen readers (`aria-hidden="true"`)

### Usage Example

```html
<sc-control-wrapper>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" [ngModel]="formValue().email" />
  <span data-hint [id]="hintId">
    We'll never share your email with anyone else.
  </span>
</sc-control-wrapper>
```

**Screen reader experience:**

1. Focus on input: "Email, edit text. We'll never share your email with anyone else."
2. After blur with error: "Invalid. Email is required." (assertive announcement)
3. While typing with warning: "Email format looks unusual." (polite announcement)
4. During async validation: "Validating…" (polite status update)

### Technical Implementation

**Modified Files:**

- `projects/ngx-vest-forms/src/lib/components/control-wrapper/control-wrapper.component.ts`
- `projects/ngx-vest-forms/src/lib/components/control-wrapper/control-wrapper.component.html`
- `projects/ngx-vest-forms/src/lib/components/control-wrapper/control-wrapper.component.scss`
- `projects/ngx-vest-forms/src/lib/directives/form-error-display.directive.ts`

**New Files:**

- `docs/ACCESSIBILITY.md` - Comprehensive accessibility guide

### Benefits

- **WCAG 2.2 AA Compliance:** Meets accessibility standards
- **Better Screen Reader UX:** Proper announcements for errors/warnings/pending
- **Keyboard Navigation:** Full keyboard accessibility maintained
- **Developer-Friendly:** Automatic ARIA management, no manual work

### Success Metrics

- [ ] WCAG 2.2 AA compliance verified with axe DevTools
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation works correctly
- [ ] All ARIA attributes dynamically update
- [ ] Documentation with accessibility examples

### Risks & Mitigations

| Risk                            | Impact | Mitigation                                         |
| ------------------------------- | ------ | -------------------------------------------------- |
| Breaking existing CSS selectors | Medium | Maintain existing classes, add new ones            |
| Performance with many controls  | Low    | Use efficient signal tracking, minimal DOM queries |
| Complex screen reader behavior  | Medium | Extensive testing with multiple screen readers     |

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

- [ ] #1: Field Path Types
- [ ] #2: Error Messages & Catalog
- [ ] #3: Debouncing Token

**Priority:** These provide immediate DX improvements and foundation for other features.

### Phase 2: Advanced Features (Week 3-4)

- [ ] #4: ValidationConfig Builder (depends on #1)
- [ ] #5: Signal Memoization
- [ ] #6: ARIA Management

**Priority:** Build on foundation with advanced features.

### Phase 3: Testing & Documentation (Week 5)

- [ ] Comprehensive testing of all features
- [ ] Performance benchmarks
- [ ] Accessibility audits
- [ ] Documentation updates
- [ ] Migration guides

### Phase 4: Release (Week 6)

- [ ] Beta release for community testing
- [ ] Address feedback
- [ ] Final release

---

## Testing Strategy

### Unit Tests

- [ ] Field path type inference correctness
- [ ] Error helper behavior in dev/prod modes
- [ ] Debounce token injection hierarchy
- [ ] ValidationConfig builder outputs
- [ ] Signal memoization prevents recalculations
- [ ] ARIA attribute updates

### Integration Tests

- [ ] Field paths work in real forms
- [ ] Error messages display correctly
- [ ] Debouncing affects validation timing
- [ ] Builder config works with form directive
- [ ] Memoization improves performance
- [ ] ARIA associations work end-to-end

### Accessibility Tests

- [ ] axe DevTools audit passes
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard navigation works
- [ ] Focus management correct

### Performance Tests

- [ ] Benchmark large forms (100+ fields)
- [ ] Memory leak detection
- [ ] Bundle size impact (should be 0 for prod)

---

## Documentation Requirements

### For Each Feature

- [ ] API documentation with examples
- [ ] Migration guide (if applicable)
- [ ] Best practices guide
- [ ] Troubleshooting section

### New Documentation

- [ ] `docs/FIELD-PATHS.md` - Type-safe field path guide
- [ ] `docs/ERRORS.md` - Error catalog reference
- [ ] `docs/PERFORMANCE.md` - Performance tuning guide
- [ ] `docs/ACCESSIBILITY.md` - Accessibility compliance guide
- [ ] `docs/VALIDATION-CONFIG-BUILDER.md` - Builder API reference

### Updated Documentation

- [ ] README - Add new features
- [ ] MIGRATION.md - Add upgrade notes
- [ ] examples/ - Add examples for each feature

---

## Success Criteria

### Developer Experience

- [ ] Type safety prevents common errors at compile time
- [ ] Error messages reduce debugging time by 50%+
- [ ] API is more intuitive and discoverable

### Performance

- [ ] Large forms (100+ fields) show measurable improvement
- [ ] Zero production bundle size increase
- [ ] Memory usage remains stable

### Accessibility

- [ ] WCAG 2.2 AA compliance verified
- [ ] Screen reader experience improved
- [ ] Keyboard navigation excellent

### Adoption

- [ ] Documentation covers all features
- [ ] Community feedback positive
- [ ] Migration path clear and easy

---

## Open Questions

1. **Field Path Types:** Should we provide an escape hatch for dynamic field names?
2. **Error Messages:** Should error codes be configurable/translatable?
3. **Debouncing:** Should we also add per-field debounce configuration?
4. **Builder API:** Should builder support conditional logic (if/else)?
5. **Memoization:** Should we expose cache control APIs for advanced users?
6. **ARIA:** Should we support custom ARIA strategies for complex controls?

---

## Appendix A: ValidationConfigBuilder API Reference

### Example: What the Builder Does

The `ValidationConfigBuilder` transforms verbose configuration into a clean fluent API:

```typescript
// BEFORE: Manual object creation (current)
const validationConfig = {
  password: ['confirmPassword'],
  confirmPassword: ['password'],
  minPrice: ['maxPrice'],
  maxPrice: ['minPrice'],
  startDate: ['endDate'],
  endDate: ['startDate'],
  country: ['state', 'zipCode', 'phoneFormat'],
};

// AFTER: Fluent builder API (proposed)
const validationConfig = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .bidirectional('minPrice', 'maxPrice')
  .bidirectional('startDate', 'endDate')
  .whenChanged('country', ['state', 'zipCode', 'phoneFormat'])
  .build();
```

**The builder produces the exact same object**, but:

- Intent is clearer (bidirectional vs one-way)
- Less typing (no need to specify both directions)
- Type-safe (IDE autocomplete for field names)
- Harder to make mistakes (e.g., forgetting reverse dependency)

### Complete Builder API

```typescript
class ValidationConfigBuilder<T> {
  // One-way dependency
  whenChanged(trigger: FieldPath<T>, revalidate: FieldPath<T>[]): this;

  // Two-way dependency (sugar for whenChanged both ways)
  bidirectional(field1: FieldPath<T>, field2: FieldPath<T>): this;

  // All fields trigger each other
  group(fields: FieldPath<T>[]): this;

  // Merge with existing config
  merge(other: ValidationConfigMap<T>): this;

  // Build final config object
  build(): ValidationConfigMap<T>;
}
```

### Real-World Example: Complex Form

```typescript
type CheckoutFormModel = DeepPartial<{
  orderType: 'domestic' | 'international';
  shippingMethod: 'standard' | 'express';
  deliveryDate: Date;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  billingAddress: Address;
  shippingAddress: Address;
  sameAsShipping: boolean;
}>;

// Complex validation dependencies
const config = createValidationConfig<CheckoutFormModel>()
  // Email confirmation
  .bidirectional('email', 'confirmEmail')

  // Password confirmation
  .bidirectional('password', 'confirmPassword')

  // Order type affects delivery and address
  .whenChanged('orderType', ['deliveryDate', 'billingAddress.country'])

  // Shipping method affects delivery date
  .whenChanged('shippingMethod', 'deliveryDate')

  // Address toggle affects validation
  .whenChanged('sameAsShipping', [
    'shippingAddress.street',
    'shippingAddress.city',
    'shippingAddress.state',
  ])

  // All address fields in each group trigger each other
  .group([
    'billingAddress.street',
    'billingAddress.city',
    'billingAddress.zipCode',
  ])
  .group([
    'shippingAddress.street',
    'shippingAddress.city',
    'shippingAddress.zipCode',
  ])

  .build();
```

**Without the builder, this would be ~30 lines of error-prone object configuration. With the builder, it's 25 lines of clear, type-safe, intent-revealing code.**

---

## Appendix B: Error Message Examples

### Example 1: Name Attribute Mismatch

**Developer creates this:**

```html
<input name="user_email" [ngModel]="formValue().email" />
```

**Console output:**

```
❌ [ngx-vest-forms] NGX-001: Name attribute mismatch

The 'name' attribute "user_email" does not match the model property path "email".

💡 Solution: Ensure the 'name' attribute exactly matches the property path in [ngModel].

📝 Example:
<!-- ✅ Correct -->
<input name="email" [ngModel]="formValue().email" />

<!-- ❌ Wrong -->
<input name="user_email" [ngModel]="formValue().email" />

📖 Documentation: https://github.com/ngx-vest-forms/ngx-vest-forms/docs/errors/NGX-001
```

### Example 2: Missing ViewProviders

**Developer creates child component without providers:**

```typescript
@Component({
  selector: 'app-user-form',
  template: `<input name="email" ngModel />`,
})
export class UserFormComponent {}
```

**Console output:**

```
⚠️ [ngx-vest-forms] NGX-002: ViewProviders missing in child component

Component 'UserFormComponent' contains form controls but is missing 'vestFormsViewProviders'.

💡 Solution: Add 'vestFormsViewProviders' to the component's viewProviders array.

📝 Example:
@Component({
  selector: 'app-user-form',
  viewProviders: [vestFormsViewProviders], // ← Add this
  template: `<input name="email" ngModel />`
})

📖 Documentation: https://github.com/ngx-vest-forms/ngx-vest-forms/docs/errors/NGX-002
```

---

## Conclusion

These 6 improvements represent high-value, low-risk enhancements that will significantly improve the ngx-vest-forms developer experience while maintaining full backward compatibility. Implementation follows Angular best practices and aligns with v2 development patterns where appropriate.

**Total Estimated Effort:** 6 weeks
**Risk Level:** Low
**Impact Level:** High
**Breaking Changes:** None
