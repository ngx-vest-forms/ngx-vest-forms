# ngx-vest-forms V2 Implementation Plan

**Date**: September 27, 2025
**Project**: Complete V2 Refactor - Vest-First Architecture
**Status**: Planning Phase

## Executive Summary

This document outlines the step-by-step implementation plan for migrating ngx-vest-forms from V1 (NgForm-centric) to V2 (Vest-first architecture). The implementation follows a phased approach with no backward compatibility requirements.

## Phase 0: Preparation & Archival

### Archive V1 Code

```bash
# Create backup directory
mkdir -p _backup/v1

# Move all current library code to backup
mv projects/ngx-vest-forms/* _backup/v1/

# Keep examples for reference but move to backup
mkdir -p _backup/v1-examples
cp -r projects/examples/* _backup/v1-examples/

# Document V1 API for migration reference
echo "# V1 API Reference" > _backup/v1/API_REFERENCE.md
```

### Setup New V2 Structure

```bash
# Create new modular package structure
mkdir -p projects/ngx-vest-forms/{core,control-wrapper,ngform-sync,schemas,testing}

# Initialize package.json files for each module
# Setup tsconfig, build configs, and testing infrastructure
```

## Phase 1: Core Package Implementation

### 1.1 Core Foundation (`projects/ngx-vest-forms/core/`)

**Files to Create:**

```
core/
├── src/
│   ├── lib/
│   │   ├── create-vest-form.ts          # Primary factory function
│   │   ├── vest-form.types.ts           # Core type definitions
│   │   ├── enhanced-field-signals.ts    # Proxy-based field access
│   │   ├── form-arrays.ts               # Dynamic array management
│   │   ├── compose-vest-forms.ts        # Multi-form composition
│   │   ├── error-strategies.ts          # Error display strategies
│   │   └── utils/
│   │       ├── path-utils.ts            # Dot-path utilities
│   │       ├── value-extraction.ts      # Event/value parsing
│   │       └── type-guards.ts           # Runtime type checking
│   ├── public-api.ts                    # Exports
│   └── test/
│       ├── create-vest-form.spec.ts
│       ├── enhanced-field-signals.spec.ts
│       ├── form-arrays.spec.ts
│       └── integration.spec.ts
├── package.json
├── ng-package.json
└── README.md
```

**Implementation Priority:**

1. ✅ **`create-vest-form.ts`** - Core factory function
2. ✅ **`vest-form.types.ts`** - Type definitions
3. ✅ **`enhanced-field-signals.ts`** - Proxy-based API
4. ✅ **`utils/path-utils.ts`** - Path manipulation
5. ✅ **`utils/value-extraction.ts`** - Event handling
6. ✅ **`error-strategies.ts`** - Display strategies
7. ✅ **`form-arrays.ts`** - Array management
8. ✅ **`compose-vest-forms.ts`** - Form composition
9. ✅ **`utils/safe-suite.ts`** - Safe Vest suite wrappers (prevents `only(undefined)` bug)

### 1.2 Core API Design

```typescript
// create-vest-form.ts - Main API
export function createVestForm<TModel extends Record<string, any>>(
  suite: StaticSuite<any, string, any>,
  initialValue: TModel | Signal<TModel>,
  options?: VestFormOptions
): VestForm<TModel> {
  // Implementation with Enhanced Field Signals API
}

// Enhanced Field Signals API
export interface VestForm<TModel> {
  // Form-level operations
  value(): TModel;
  valid(): boolean;
  errors(): Record<string, string[]>;
  pending(): boolean;
  validate(field?: string): void;
  submit(): void;
  reset(): void;

  // Field operations (explicit API)
  field<K extends keyof TModel>(path: K): VestField<TModel[K]>;
  array<K extends keyof TModel>(path: K): VestFormArray<TModel[K]>;

  // Enhanced Field Signals API (proxy-based)
  [K in keyof TModel as K]: () => TModel[K];
  [K in keyof TModel as `${K}Valid`]: () => boolean;
  [K in keyof TModel as `${K}Errors`]: () => string[];
  [K in keyof TModel as `${K}Touched`]: () => boolean;
  [K in keyof TModel as `${K}Pending`]: () => boolean;
  [K in keyof TModel as `${K}ShowErrors`]: () => boolean;
  [K in keyof TModel as `set${Capitalize<K>}`]: (value: TModel[K] | Event) => void;
  [K in keyof TModel as `touch${Capitalize<K>}`]: () => void;
  [K in keyof TModel as `reset${Capitalize<K>}`]: () => void;
}
```

}

### 1.2.1 Type Safety Implementation with ts-essentials

**Core Type Infrastructure**:

```typescript
// vest-form.types.ts - Leveraging ts-essentials for path utilities
export type { Paths as Path, PathValue } from 'ts-essentials';

// Type-safe path access with automatic inference
export type VestField<TValue> = {
  value: Signal<TValue>;
  errors: Signal<string[]>;
  valid: Signal<boolean>;
  // ... other field properties
};

// Enhanced Field Signals API with proper typing
export type VestForm<TModel> = {
  [K in keyof TModel as K extends string ? K : never]: Signal<TModel[K]>;
} & {
  [K in keyof TModel as K extends string
    ? `${K}Valid`
    : never]: Signal<boolean>;
} & {
  [K in keyof TModel as K extends string ? `${K}Errors` : never]: Signal<
    string[]
  >;
} & {
  [K in keyof TModel as K extends string ? `set${Capitalize<K>}` : never]: (
    value: TModel[K] | Event,
  ) => void;
};
```

**Why ts-essentials Over Custom Implementation**:

1. **Robust Path Type Generation**: Handles complex nested structures with proper array indexing
2. **Edge Case Coverage**: Manages optional properties, undefined handling, and deep nesting
3. **Performance Optimized**: Battle-tested type utilities with optimized compilation
4. **Maintenance Free**: Zero custom type logic to debug or update
5. **Ecosystem Compatibility**: Familiar API for developers using ts-essentials elsewhere

**Implementation Benefits**:

```typescript
interface ComplexForm {
  user: {
    profile: { name: string; email?: string };
    preferences: { theme: 'light' | 'dark' }[];
  };
}

// Automatic path generation with ts-essentials
type FormPaths = Path<ComplexForm>;
// ^? 'user' | 'user.profile' | 'user.profile.name' | 'user.profile.email' |
//    'user.preferences' | `user.preferences.${number}` | `user.preferences.${number}.theme`

// Type-safe value extraction
type UserEmail = PathValue<ComplexForm, 'user.profile.email'>;
// ^? string | undefined (properly handles optional)
```

### 1.3 Testing Strategy

**Unit Tests (95% Coverage Target):**

```typescript
// create-vest-form.spec.ts
describe('createVestForm', () => {
  it('should create form instance with initial values', () => {
    const form = createVestForm(mockSuite, { email: 'test@example.com' });
    expect(form.email()).toBe('test@example.com');
  });

  it('should trigger validation on field changes', () => {
    const form = createVestForm(mockSuite, { email: '' });
    form.setEmail('invalid');
    expect(form.emailErrors()).toContain('Invalid email format');
  });

  it('should support Enhanced Field Signals API', () => {
    const form = createVestForm(mockSuite, { email: '', password: '' });

    // Automatic signal generation
    expect(form.email).toBeDefined();
    expect(form.emailValid).toBeDefined();
    expect(form.emailErrors).toBeDefined();
    expect(form.setEmail).toBeDefined();
  });
});
```

## Phase 2: Optional Packages

### 2.1 Control Wrapper Package (`projects/ngx-vest-forms/control-wrapper/`)

**Purpose**: Accessible, reusable UI components for form fields

```typescript
// control-wrapper.component.ts
@Component({
  selector: 'ngx-control-wrapper',
  template: `
    <div class="control-wrapper" [class]="wrapperClasses()">
      <ng-content select="label" />
      <div class="input-container">
        <ng-content />
        @if (showErrors()) {
          <div class="error-container" role="alert">
            @for (error of errors(); track error) {
              <p class="error-message">{{ error }}</p>
            }
          </div>
        }
      </div>
      @if (showWarnings()) {
        <div class="warning-container">
          @for (warning of warnings(); track warning) {
            <p class="warning-message">{{ warning }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class NgxControlWrapper {
  field = input.required<VestField<any>>();
  strategy = input<ErrorStrategy>('on-touch');

  // Computed state from field
  errors = computed(() => this.field().errors());
  warnings = computed(() => this.field().warnings());
  showErrors = computed(() => this.field().showErrors(this.strategy()));
}
```

### 2.2 NgForm Sync Package (`projects/ngx-vest-forms/ngform-sync/`)

**Purpose**: Optional bidirectional synchronization with Angular NgForm

```typescript
// ngx-vest-sync.directive.ts
@Directive({
  selector: '[ngxVestSync]',
})
export class NgxVestSyncDirective implements OnInit, OnDestroy {
  vestForm = input.required<VestForm<any>>();

  private ngForm = inject(NgForm);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Sync Vest state → NgForm
    this.vestForm().subscribe((result) => {
      Object.keys(result.getErrors()).forEach((fieldName) => {
        const control = this.ngForm.controls[fieldName];
        if (control) {
          control.setErrors(result.getErrors(fieldName));
          if (result.isTested(fieldName)) {
            control.markAsTouched();
          }
        }
      });
    });
  }
}
```

### 2.3 Schema Adapters Package (`projects/ngx-vest-forms/schemas/`)

**Purpose**: Integration with runtime schema validation libraries

```typescript
// zod-adapter.ts
export function withZodSchema<T>(schema: ZodSchema<T>) {
  return {
    validate: (data: unknown): SchemaValidationResult => {
      const result = schema.safeParse(data);
      return {
        valid: result.success,
        errors: result.success ? {} : formatZodErrors(result.error),
      };
    },
  };
}

// Usage in forms
const form = createVestForm(vestSuite, initialData, {
  schema: withZodSchema(userSchema),
});
```

## Phase 3: Examples Refactoring

### 3.1 Example Categories Structure

```
projects/examples/src/app/
├── 01-fundamentals-pure/           # Clean Vest-first API (Recommended)
│   ├── minimal-form/
│   ├── basic-validation/
│   ├── error-display-modes/
│   └── form-state-demo/
├── 01-fundamentals-ngform/         # NgForm integration (Migration path)
│   ├── minimal-form-ngform/
│   ├── basic-validation-ngform/
│   └── migration-from-v1/
├── 02-advanced-patterns/           # Complex scenarios
│   ├── dynamic-arrays/
│   ├── multi-step-form/
│   └── server-side-validation/
├── 03-ui-patterns/                # Control wrapper examples
│   ├── control-wrapper-intro/
│   └── custom-error-display/
├── 04-schema-integration/         # Schema adapter examples
│   ├── zod-integration/
│   ├── valibot-integration/
│   └── schema-comparison/
└── comparisons/                   # Side-by-side analysis
    ├── api-differences/
    ├── performance-comparison/
    └── bundle-size-analysis/
```

### 3.2 Pure Vest-First Examples (Priority 1)

**Minimal Form (Clean API):**

```typescript
// 01-fundamentals-pure/minimal-form/minimal-form.component.ts
@Component({
  selector: 'app-minimal-form-pure',
  imports: [], // No FormsModule needed!
  template: `
    <form (ngSubmit)="handleSubmit()">
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
        [attr.aria-invalid]="form.emailShowErrors() ? 'true' : null"
        [attr.aria-describedby]="form.emailShowErrors() ? 'email-error' : null"
      />

      @if (form.emailShowErrors()) {
        <p id="email-error" role="alert" class="error">
          {{ form.emailErrors()[0] }}
        </p>
      }

      <button type="submit" [disabled]="!form.valid()">Submit</button>
    </form>
  `,
})
export class MinimalFormPureComponent {
  form = createVestForm(emailValidationSuite, { email: '' });

  handleSubmit() {
    if (this.form.valid()) {
      console.log('Submitted:', this.form.value());
    }
  }
}
```

### 3.3 NgForm Integration Examples (Priority 2)

**Same Form with NgForm Integration:**

```typescript
// 01-fundamentals-ngform/minimal-form-ngform/minimal-form-ngform.component.ts
@Component({
  selector: 'app-minimal-form-ngform',
  imports: [FormsModule, NgxVestSyncDirective],
  template: `
    <form
      ngxVestSync
      [vestForm]="form"
      (ngSubmit)="handleSubmit()"
      #ngForm="ngForm"
    >
      <label for="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        [(ngModel)]="emailValue"
        #emailControl="ngModel"
      />
      <!-- NgForm automatically applies .ng-valid, .ng-invalid, .ng-touched classes -->

      @if (emailControl.invalid && emailControl.touched) {
        <p role="alert" class="error">
          {{ form.emailErrors()[0] }}
        </p>
      }

      <button type="submit" [disabled]="ngForm.invalid">Submit (NgForm)</button>
    </form>
  `,
})
export class MinimalFormNgFormComponent {
  form = createVestForm(emailValidationSuite, { email: '' });

  // Two-way binding helper
  get emailValue() {
    return this.form.email();
  }
  set emailValue(value: string) {
    this.form.setEmail(value);
  }
}
```

### 3.4 Side-by-Side Comparison Examples

**API Comparison Page:**

```typescript
// comparisons/api-differences/api-comparison.component.ts
@Component({
  template: `
    <div class="comparison-grid">
      <div class="pure-api">
        <h3>Pure Vest-First API</h3>
        <app-minimal-form-pure />
        <div class="metrics">
          <p>Bundle Size: ~3KB</p>
          <p>Dependencies: None</p>
          <p>Performance: Optimal</p>
        </div>
      </div>

      <div class="ngform-api">
        <h3>NgForm Integration API</h3>
        <app-minimal-form-ngform />
        <div class="metrics">
          <p>Bundle Size: ~5KB</p>
          <p>Dependencies: FormsModule</p>
          <p>Performance: Good</p>
        </div>
      </div>
    </div>

    <div class="recommendations">
      <h3>When to Use Each Approach</h3>
      <ul>
        <li>
          <strong>Pure API</strong>: New projects, performance-critical apps,
          custom UI libraries
        </li>
        <li>
          <strong>NgForm API</strong>: Migration from V1, Angular Material
          integration, existing template-driven codebases
        </li>
      </ul>
    </div>
  `,
})
export class ApiComparisonComponent {}
```

## Phase 4: Implementation Phases

### Phase 4.1: Core Foundation (Critical Priority)

- [ ] Archive V1 code to `_backup/v1/`
- [ ] Set up new package structure with build configuration
- [ ] Implement `createVestForm()` core function
- [ ] Implement Enhanced Field Signals API with Proxy
- [ ] Add path utilities and value extraction helpers
- [ ] Write comprehensive unit tests (95% coverage)
- [ ] Set up Vitest testing infrastructure

### Phase 4.2: Core Features (High Priority)

- [ ] Implement form arrays (`form.array()`)
- [ ] Implement form composition (`composeVestForms()`)
- [ ] Add error display strategies
- [ ] Performance optimizations (lazy signals, caching)
- [ ] Integration tests with Vest.js v5
- [ ] Documentation for core package

### Phase 4.3: Optional Packages (Medium Priority)

- [ ] Build Control Wrapper package with accessibility
- [ ] Build NgForm Sync package with bidirectional binding
- [ ] Build Schema adapters (Zod, Valibot, ArkType)
- [ ] Testing utilities package
- [ ] Cross-package integration tests

### Phase 4.4: Examples & Documentation (Medium Priority)

- [x] ✅ Refactor all examples to V2 API structure (using `staticSafeSuite`)
- [ ] Create pure vs NgForm comparison examples
- [ ] Build performance comparison demos
- [x] ✅ Write migration guides from V1 (Safe Suite Migration Guide)
- [ ] Complete API documentation
- [ ] E2E tests with Playwright

### Phase 4.5: Developer Tooling (Optional - Future Enhancement)

**Purpose**: Automate detection and migration of unsafe validation patterns

- [ ] **Task 3**: Create ESLint rule `@ngx-vest-forms/require-safe-suite`
  - Detects unsafe `staticSuite`/`create` usage without proper `only(field)` guard
  - Suggests using `staticSafeSuite`/`createSafeSuite` instead
  - Auto-fixable where possible
  - See [`docs/ESLINT_RULE_PROPOSAL.md`](../ESLINT_RULE_PROPOSAL.md) for specification

- [ ] **Task 4**: Create codemod for automatic migration
  - Converts `staticSuite((data, field) => { if (field) { only(field); } ... })` → `staticSafeSuite<T>((data) => { ... })`
  - Converts `create((data, field) => { if (field) { only(field); } ... })` → `createSafeSuite<T>((data) => { ... })`
  - Removes unnecessary imports (`only` from 'vest')
  - Adds required imports (`staticSafeSuite`/`createSafeSuite` from 'ngx-vest-forms/core')
  - Preserves type parameters and comments
  - Dry-run mode for preview before applying changes
  - CLI: `npx @ngx-vest-forms/codemod migrate-to-safe-suite src/**/*.ts`

## Testing Strategy

### Unit Testing (Vitest)

- **Target**: 95% coverage for core package
- **Approach**: Test behavior, not implementation
- **Focus**: Pure functions, signal reactivity, Vest integration

### Component Testing (Vitest Browser + Angular Testing Library)

- **Target**: All example components
- **Approach**: User-centric testing with accessible queries
- **Focus**: Form interactions, validation display, error states

### E2E Testing (Playwright)

- **Target**: Critical user journeys
- **Scenarios**: Form submission, validation flows, error recovery
- **Focus**: Accessibility, keyboard navigation, screen reader support

### Performance Testing

- **Bundle Size**: Track and enforce size budgets per package
- **Runtime**: Benchmark form operations for large forms (100+ fields)
- **Memory**: Monitor signal creation and cleanup patterns

## Success Criteria

### Technical Metrics

- [ ] Core package < 3KB gzipped
- [ ] 95%+ test coverage across all packages
- [ ] Zero TypeScript errors in strict mode
- [ ] <100ms form creation for 100-field forms
- [ ] Memory usage scales linearly with form size

### Developer Experience

- [ ] Clear TypeScript IntelliSense for Enhanced Field Signals API
- [ ] Comprehensive documentation with runnable examples
- [ ] Migration guides with clear before/after comparisons
- [ ] No breaking changes within V2.x lifecycle

### Ecosystem Compatibility

- [ ] Angular 18+ compatibility (signals-first)
- [ ] Vest.js v5+ compatibility
- [ ] SSR/SSG compatible (no browser-only dependencies)
- [ ] Tree-shakeable (unused packages don't affect bundle)

## Risk Mitigation

### High Risk: Breaking Changes

- **Risk**: Complete API redesign frustrates existing users
- **Mitigation**:
  - Clear migration documentation with automated migration scripts where possible
  - Gradual rollout with RC versions for community feedback
  - Maintain V1 branch for critical fixes during transition period

### Medium Risk: Performance Regression

- **Risk**: Signal overhead in large forms
- **Mitigation**:
  - Lazy signal creation (only create signals when accessed)
  - Performance benchmarks in CI pipeline
  - Memory profiling for signal cleanup

### Low Risk: Browser Compatibility

- **Risk**: Enhanced Field Signals API requires Proxy support
- **Mitigation**:
  - Fallback to explicit field API when Proxy unavailable
  - Clear browser support documentation
  - Feature detection and graceful degradation

## Next Steps

1. **✅ Phase 0**: Complete PRD review and team alignment
2. **🚀 Phase 1**: Begin core package implementation
3. **📋 Phase 2**: Start optional packages development
4. **📚 Phase 3**: Examples refactoring and documentation
5. **🔄 Phase 4**: Community feedback and iteration

---

_This implementation plan provides the tactical roadmap for executing the ngx-vest-forms V2 refactor outlined in the PRD. All development work should follow this plan for consistency and successful delivery._
