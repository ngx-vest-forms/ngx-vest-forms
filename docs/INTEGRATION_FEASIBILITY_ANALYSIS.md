# ngx-vest-forms Integration Feasibility Analysis

**Date:** October 7, 2025
**Version:** 2.x (feat/v2-inverted-vest-forms branch)
**Status:** Strategic Decision Point

## Executive Summary

This document analyzes three potential evolution paths for ngx-vest-forms:

1. **NgForm/NgModel Integration** - Optional backward compatibility package
2. **Core Abstraction** - Framework-agnostic validation layer
3. **Signal Forms Alignment** - Future-proof Angular integration

**TL;DR Recommendation:**

- ✅ **Maintain Independence** - ngx-vest-forms v2 already uses Angular 20+ best practices (signal-based)
- ✅ **Add Standard Schema** - Focus on type validation layer (Zod, Valibot, ArkType) to complement Vest.js
- ❌ **Skip NgForm Integration** - Legacy technology with declining usage
- ❌ **Skip Core Abstraction** - Over-engineering without clear demand
- ⏳ **Monitor Signal Forms** - Re-evaluate as Angular Signal Forms evolves

---

## 📋 Table of Contents

- [Background](#background)
- [Path 1: NgForm/NgModel Integration](#path-1-ngformngmodel-integration)
- [Path 2: Core Abstraction Layer](#path-2-core-abstraction-layer)
- [Path 3: Signal Forms Alignment](#path-3-signal-forms-alignment)
- [Comparative Analysis](#comparative-analysis)
- [Strategic Recommendation](#strategic-recommendation)
- [Implementation Roadmap](#implementation-roadmap)

---

## Background

### Current Architecture (v2)

ngx-vest-forms v2 uses a **Vest-first, signal-based** architecture:

```typescript
// Current approach
const form = createVestForm(
  userSuite,
  signal({ email: '', password: '' })
);

// Template
<form [ngxVestForm]="form">
  <input [value]="form.email()" (input)="form.setEmail($event)" />
</form>
```

**Key Characteristics:**

- ✅ Vest.js is single source of truth
- ✅ Signal-based reactivity
- ✅ Native HTML controls (no ngModel)
- ✅ Factory functions over decorators
- ✅ WCAG 2.2 compliant

### Angular Forms Landscape (October 2025)

1. **Template-Driven Forms (NgForm/NgModel)**
   - Status: Legacy/maintenance mode
   - Usage: Declining in new projects
   - Future: Not actively developed

2. **Reactive Forms (FormControl/FormGroup)**
   - Status: Current standard
   - Usage: Dominant in enterprise
   - Future: Stable, but not signal-native

3. **Signal Forms (Experimental)**
   - Status: RFC/Developer Preview
   - Usage: Early adopters only
   - Future: Official Angular direction

---

## Path 1: NgForm/NgModel Integration

### Overview

Create an optional `ngx-vest-forms/ngform-sync` package allowing v1-style NgModel integration:

```typescript
// Desired usage
<form #form="ngForm">
  <input [(ngModel)]="model.email" name="email" [vestValidation]="emailSuite" />
</form>
```

### Technical Approach

#### 1. NgModel Integration Architecture

```typescript
// ngform-sync/src/lib/ngx-vest-ngmodel.directive.ts
import { Directive, input, inject, DestroyRef, Self } from '@angular/core';
import { NgModel, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive({
  selector: '[ngModel][vestValidation]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: NgxVestNgModelDirective,
      multi: true,
    },
  ],
})
export class NgxVestNgModelDirective implements Validator {
  // Angular 20+: Signal-based inputs
  readonly vestValidation = input.required<VestSuite>();
  readonly vestField = input<string>();

  // Angular 20+: inject() for DI
  private readonly ngModel = inject(NgModel, { self: true });
  private readonly destroyRef = inject(DestroyRef);

  private control?: AbstractControl;

  ngOnInit() {
    this.control = this.ngModel.control;

    // Angular 20.3: Use takeUntilDestroyed() instead of Subject
    // Sync Vest validation → NgModel errors
    this.control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const fieldName = this.vestField() || this.ngModel.name;
        const result = this.vestValidation()(
          { [fieldName]: value },
          fieldName,
        );

        const errors = result.hasErrors(fieldName)
          ? { vest: result.getErrors(fieldName) }
          : null;

        this.control.setErrors(errors);
      });
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const validation = this.vestValidation();
    if (!validation) return null;

    const fieldName = this.vestField() || 'value';
    const result = validation(
      { [fieldName]: control.value },
      fieldName,
    );

    return result.hasErrors(fieldName)
      ? { vest: result.getErrors(fieldName) }
      : null;
  }
}
}
```

#### 2. NgForm Integration

```typescript
// ngform-sync/src/lib/ngx-vest-form.directive.ts
import { Directive, input, inject, Self } from '@angular/core';
import { NgForm } from '@angular/forms';

@Directive({
  selector: 'form[vestSuite]',
  exportAs: 'vestForm',
})
export class NgxVestFormDirective {
  // Angular 20+: Signal-based inputs
  readonly vestSuite = input.required<VestSuite>();

  // Angular 20+: inject() for DI
  private readonly ngForm = inject(NgForm, { self: true });

  ngOnInit() {
    // Sync NgForm submission → Vest validation
    this.ngForm.ngSubmit.subscribe(() => {
      const result = this.vestSuite()(this.ngForm.value);

      if (!result.isValid()) {
        // Mark all controls as touched
        Object.keys(this.ngForm.controls).forEach((key) => {
          this.ngForm.controls[key].markAsTouched();
        });
      }
    });
  }

  getVestResult(): SuiteResult {
    return this.vestSuite(this.ngForm.value);
  }
}
```

### Feasibility Assessment

#### ✅ Technical Feasibility: **HIGH**

**Proven Patterns:**

- ControlValueAccessor interface is well-documented
- Vest's `suite(data, field)` aligns with NgModel's per-field approach
- NgForm control registration lifecycle is straightforward
- Similar implementations exist in the ecosystem

**Integration Points:**

- ✅ Validator interface: `validate(control) → ValidationErrors | null`
- ✅ State sync: Vest result → NgModel errors via `setErrors()`
- ✅ Touch tracking: NgModel's touched state → Vest field testing
- ✅ Async validation: Vest's `isPending()` → `PENDING` status

**Challenges:**

- ⚠️ State synchronization timing (Vest vs NgModel lifecycle)
- ⚠️ Handling Vest's `include().when()` cross-field dependencies
- ⚠️ Async validation cancellation (AbortSignal integration)

#### 📊 Effort Estimate: **MEDIUM-HIGH** (3-4 weeks)

**Phase 1: Core Integration (1-2 weeks)**

- Implement NgxVestNgModelDirective
- Implement NgxVestFormDirective
- Basic validation sync

**Phase 2: Advanced Features (1 week)**

- Cross-field validation
- Async validation with cancellation
- Touch state management
- CSS class synchronization

**Phase 3: Testing & Documentation (1 week)**

- Unit tests (Vitest)
- E2E tests (Playwright)
- Migration guide from v1
- API documentation

#### ⚖️ Value vs Cost: **QUESTIONABLE**

**Arguments FOR:**

- ✅ Backward compatibility for v1 users
- ✅ Familiar NgModel patterns for existing Angular devs
- ✅ Lower barrier to entry for newcomers
- ✅ Reuse existing Vest validation suites

**Arguments AGAINST:**

- ❌ NgForm/NgModel are **legacy patterns** Angular is moving away from
- ❌ Signal Forms are Angular's stated future direction
- ❌ Maintenance burden supporting two paradigms indefinitely
- ❌ Users wanting NgModel can stick with v1
- ❌ Investment in **deprecated technology**
- ❌ Doesn't align with ngx-vest-forms v2 philosophy

**Market Reality (October 2025):**

- Template-driven forms usage declining in new Angular projects
- Enterprise teams prefer Reactive Forms or waiting for Signal Forms
- Community momentum behind signals, not NgModel

### Risks & Mitigation

| Risk                                  | Impact | Likelihood | Mitigation                            |
| ------------------------------------- | ------ | ---------- | ------------------------------------- |
| Low adoption (users prefer v1 or v2)  | Medium | High       | Start with minimal viable integration |
| Maintenance burden across paradigms   | High   | High       | Clear deprecation timeline            |
| Conflicts with Signal Forms migration | Medium | Medium     | Ensure compatibility layer            |
| Breaking changes in Angular NgForm    | Low    | Low        | Monitor Angular deprecations          |

### Decision Matrix

| Criteria              | Score (1-5) | Weight | Weighted   |
| --------------------- | ----------- | ------ | ---------- |
| Technical Feasibility | 4           | 20%    | 0.8        |
| Strategic Alignment   | 2           | 30%    | 0.6        |
| User Value            | 3           | 25%    | 0.75       |
| Maintenance Cost      | 2           | 15%    | 0.3        |
| Future-Proofing       | 1           | 10%    | 0.1        |
| **Total**             |             |        | **2.55/5** |

**Verdict: NOT RECOMMENDED** - Low strategic value despite technical feasibility

---

## Path 2: Core Abstraction Layer

### Overview

Refactor `createVestForm` to be form-system agnostic, allowing plugins for different frameworks:

```typescript
// Proposed architecture
const form = createVestForm(suite, model, {
  adapter: new NgModelAdapter(), // or ReactiveFormsAdapter, SignalFormsAdapter
});
```

### Technical Approach

#### 1. Abstraction Layer Design

```typescript
// core/src/lib/adapters/form-adapter.interface.ts
export interface FormAdapter<TModel> {
  // State management
  getValue(): TModel;
  setValue(value: TModel): void;
  patchValue(partial: Partial<TModel>): void;

  // Validation integration
  setFieldError(field: string, errors: string[]): void;
  clearFieldError(field: string): void;

  // Touch state
  setFieldTouched(field: string): void;
  isFieldTouched(field: string): boolean;

  // Change detection
  markForCheck?(): void;
  detectChanges?(): void;

  // Lifecycle
  destroy(): void;
}

// Signal-based adapter (current default)
export class SignalFormAdapter<TModel> implements FormAdapter<TModel> {
  constructor(private model: WritableSignal<TModel>) {}

  getValue(): TModel {
    return this.model();
  }

  setValue(value: TModel): void {
    this.model.set(value);
  }

  // ... implement other methods
}

// NgModel adapter
export class NgModelFormAdapter<TModel> implements FormAdapter<TModel> {
  constructor(
    private model: TModel,
    private ngForm: NgForm,
    private cdr: ChangeDetectorRef,
  ) {}

  getValue(): TModel {
    return this.ngForm.value as TModel;
  }

  setFieldError(field: string, errors: string[]): void {
    const control = this.ngForm.controls[field];
    if (control) {
      control.setErrors(errors.length ? { vest: errors } : null);
      this.cdr.markForCheck();
    }
  }

  // ... implement other methods
}
```

#### 2. Refactored Core

```typescript
// core/src/lib/create-vest-form.ts
export function createVestForm<TModel>(
  suite: VestSuite,
  source: WritableSignal<TModel> | FormAdapter<TModel>,
  config?: VestFormConfig,
): VestForm<TModel> {
  // Detect adapter or create default
  const adapter = isFormAdapter(source)
    ? source
    : new SignalFormAdapter(source);

  // Use adapter for all state operations
  const validate = (field?: string) => {
    const data = adapter.getValue();
    const result = suite(data, field);

    // Sync errors via adapter
    if (field) {
      adapter.setFieldError(field, result.getErrors(field));
    } else {
      Object.keys(data).forEach((key) => {
        adapter.setFieldError(key, result.getErrors(key));
      });
    }

    adapter.markForCheck?.();
    return result;
  };

  // Return form with adapter-agnostic API
  return {
    validate,
    submit: async () => {
      const result = validate();
      return {
        valid: result.isValid(),
        data: adapter.getValue(),
        errors: result.getErrors(),
      };
    },
    // ... rest of API
  };
}
```

### Feasibility Assessment

#### ⚠️ Technical Feasibility: **MEDIUM**

**Challenges:**

- Different form systems have fundamentally different lifecycles
- State synchronization complexity multiplies with each adapter
- Type safety across adapters is difficult
- Signal reactivity doesn't translate to other systems
- Enhanced Field Signals API would break with adapters

**Architectural Conflicts:**

- Current Proxy-based field accessors assume signals
- Auto-ARIA directive assumes signal-based change detection
- Error display strategies tightly coupled to signal reactivity

#### 📊 Effort Estimate: **HIGH** (6-8 weeks)

**Phase 1: Adapter Architecture (2-3 weeks)**

- Design FormAdapter interface
- Extract adapter-agnostic core logic
- Refactor createVestForm

**Phase 2: Adapter Implementations (2-3 weeks)**

- SignalFormAdapter (migrate existing)
- NgModelFormAdapter
- ReactiveFormsAdapter

**Phase 3: Integration & Testing (2 weeks)**

- Update directives for adapter support
- Comprehensive testing across adapters
- Performance optimization
- Documentation

#### ⚖️ Value vs Cost: **POOR**

**Arguments FOR:**

- ✅ Maximum flexibility
- ✅ Support multiple form paradigms
- ✅ Framework-agnostic core (could target React/Vue?)

**Arguments AGAINST:**

- ❌ **Massive complexity** for uncertain benefit
- ❌ Dilutes the Vest-first signal-based vision
- ❌ **Performance overhead** from abstraction layer
- ❌ **Type safety degradation** across adapters
- ❌ **Maintenance nightmare** - bug in any adapter affects all
- ❌ Enhanced Field Signals API would be impossible
- ❌ Who actually needs this? (no user demand)

**Reality Check:**

- ngx-vest-forms is **Angular-specific** by design
- Signals are **core** to the v2 value proposition
- Framework-agnostic validation = just use Vest.js directly
- Abstraction without clear use case = premature optimization

### Risks & Mitigation

| Risk                        | Impact | Likelihood | Mitigation                     |
| --------------------------- | ------ | ---------- | ------------------------------ |
| Over-engineering complexity | High   | Very High  | Don't do it                    |
| Performance degradation     | Medium | High       | Extensive benchmarking         |
| Type safety loss            | High   | High       | Complex generic constraints    |
| Breaking existing features  | High   | Medium     | Comprehensive regression tests |
| Zero user demand            | High   | Very High  | Validate need first            |

### Decision Matrix

| Criteria              | Score (1-5) | Weight | Weighted   |
| --------------------- | ----------- | ------ | ---------- |
| Technical Feasibility | 3           | 20%    | 0.6        |
| Strategic Alignment   | 1           | 30%    | 0.3        |
| User Value            | 2           | 25%    | 0.5        |
| Maintenance Cost      | 1           | 15%    | 0.15       |
| Future-Proofing       | 2           | 10%    | 0.2        |
| **Total**             |             |        | **1.75/5** |

**Verdict: STRONGLY NOT RECOMMENDED** - Over-engineering without clear value

---

## Path 3: Signal Forms Alignment

### Overview

Incrementally evaluate Angular Signal Forms APIs as they evolve, maintaining compatibility with current architecture.

### Angular Signal Forms Status (October 2025)

**Status: Available in Angular 21+**

#### Current Status

- **Available**: Angular 21+ includes Signal Forms in `@angular/forms/signals`
- **Active Development**: Community testing and feedback actively being incorporated

#### Core Concepts

Signal Forms introduce a **signal-first** approach to form state management with four key components:

1. **Data Model** - Form state as a `signal()` (developer-managed, NOT framework-internal)
2. **Field State** - Derived metadata signals for each field (validity, errors, touched, dirty)
3. **Field Logic** - Declarative validation and business rules defined via schemas
4. **UI Controls** - `[control]` directive for two-way binding to native/custom elements

**Key Philosophy:**

- ✅ **External State Management** - Developer owns the data model signal
- ✅ **No Internal State** - Form doesn't maintain duplicate state internally
- ✅ **Bidirectional Sync** - Model changes update form, form changes update model
- ✅ **Declarative Validation** - Schema-based rules, not imperative methods

#### API Surface

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  Control,
  required,
  email,
  validate,
} from '@angular/forms/signals';

interface UserForm {
  name: string;
  email: string;
  age: number;
}

@Component({
  selector: 'app-user-form',
  imports: [Control], // Import Control directive for [control] binding
  template: `
    <form>
      <!-- Bind fields using [control] directive -->
      <input type="text" [control]="f.name" placeholder="Name" />
      @if (f.name().invalid()) {
        <div class="error">{{ f.name().errors()[0].message }}</div>
      }

      <input type="email" [control]="f.email" placeholder="Email" />
      @if (f.email().invalid()) {
        <div class="error">{{ f.email().errors()[0].message }}</div>
      }

      <input type="number" [control]="f.age" placeholder="Age" />

      <button type="submit" [disabled]="f().invalid()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  // Developer owns the model signal - single source of truth
  userModel = signal<UserForm>({
    name: '',
    email: '',
    age: 0,
  });

  // Create form from model with validation schema
  f = form(this.userModel, (path) => {
    // Declarative validation rules
    required(path.name, { message: 'Name is required' });
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Invalid email format' });
    validate(path.age, ({ value }) => {
      return value() >= 18
        ? []
        : [{ kind: 'min-age', message: 'Must be 18 or older' }];
    });
  });

  onSubmit() {
    if (this.f().valid()) {
      console.log('Form data:', this.userModel()); // Access model directly
    }
  }
}
```

**Key Characteristics:**

- ✅ **`form()` function** - Creates form tree from model signal
- ✅ **`[control]` directive** - Binds fields to UI elements (replaces `formControl`, `ngModel`)
- ✅ **Schema-based validation** - Declarative rules via `required()`, `email()`, `validate()`, etc.
- ✅ **Field tree navigation** - Access fields via dot notation: `f.name`, `f.user.address.street`
- ✅ **Field state signals** - `field().valid()`, `field().errors()`, `field().touched()`, `field().dirty()`
- ✅ **Computed validity** - Form/field validity derived from validation rules automatically
- ✅ **No `FormGroup`/`FormControl`** - Plain objects + signals replace class-based API

#### API Comparison: Reactive Forms vs Signal Forms

| Aspect                  | Reactive Forms (Current)                         | Signal Forms (Angular 21+)                                |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| **State Management**    | `FormGroup`, `FormControl` classes               | Plain `signal()` objects                                  |
| **Validation**          | Validator functions in `FormControl` constructor | Declarative schema with `required()`, `validate()`, etc.  |
| **Template Binding**    | `[formControl]`, `formControlName`, `formGroup`  | `[control]` directive                                     |
| **Value Access**        | `form.get('email')?.value` or `form.value.email` | `f.email().value()` or `userModel().email`                |
| **Validity Check**      | `form.get('email')?.valid` (nullable)            | `f.email().valid()` (guaranteed signal)                   |
| **Errors**              | `form.get('email')?.errors` (object or null)     | `f.email().errors()` (array of error objects)             |
| **Cross-Field**         | Custom validator on `FormGroup`                  | `validate(path, fn)` with access to whole form value      |
| **Async Validation**    | `AsyncValidator` class                           | `validateHttp()` or `validateAsync()` with `rxResource()` |
| **Conditional Logic**   | Imperative `enable()`, `disable()` calls         | Declarative `disabled(field, when)`, `required(when)`     |
| **Arrays**              | `FormArray` with manual index management         | Plain array in model, `applyEach()` for validation        |
| **State Updates**       | Observable streams (`valueChanges`)              | Signal reactivity (automatic with `computed()`)           |
| **Two-Way Binding**     | `[(ngModel)]` (separate from reactive forms)     | `[control]` directive (native two-way)                    |
| **Zone Dependency**     | Requires ZoneJS for change detection             | Zoneless-ready (signal-based CD)                          |
| **Type Safety**         | `FormControl<string>` (typed forms in v14+)      | Inferred from model signal type                           |
| **Bundle Size**         | Larger (RxJS + forms classes)                    | Smaller (signals + plain objects)                         |
| **Learning Curve**      | High (observables, lifecycle, manual sync)       | Lower (declarative, automatic sync)                       |
| **Change Detection**    | Triggers Angular CD via observables/zone         | Fine-grained signal updates (OnPush-friendly)             |
| **Developer Ownership** | Framework manages internal `FormControl` state   | Developer owns model signal (framework mirrors it)        |
| **Composability**       | Limited (class-based, imperative)                | High (schema composition via `apply()`, `applyEach()`)    |

### Compatibility Analysis with Angular Signal Forms

#### High-Level Architecture Comparison

| Aspect                     | ngx-vest-forms v2                         | Angular Signal Forms                      | Alignment     |
| -------------------------- | ----------------------------------------- | ----------------------------------------- | ------------- |
| **Core Philosophy**        | Vest.js validation + Signal reactivity    | Angular Forms + Signal reactivity         | ✅ Compatible |
| **State Management**       | Developer-owned `signal(model)`           | Developer-owned `signal(model)`           | ✅ Identical  |
| **Validation Engine**      | Vest.js (external library)                | Angular built-in validators + schema      | ⚠️ Different  |
| **Template Binding**       | `[value]`/`(input)` + custom directives   | `[control]` directive                     | ⚠️ Different  |
| **Field Access**           | Proxy-based: `form.email()`               | Path-based: `form.email` → `Field<T>`     | ⚠️ Different  |
| **Validation Definition**  | Vest suite (external file)                | Schema function (inline or external)      | ⚠️ Different  |
| **Error Handling**         | `form.emailErrors()` → `string[]`         | `field().errors()` → `ErrorObject[]`      | ⚠️ Different  |
| **Async Validation**       | Vest `test.memo()` + AbortSignal          | `validateHttp()`, `validateAsync()`       | ⚠️ Different  |
| **Cross-Field Validation** | Vest `include().when()`                   | `validate(rootPath, fn)`                  | ⚠️ Different  |
| **Conditional Logic**      | Vest `skipWhen()`, `omitWhen()`           | `disabled(field, when)`, `required(when)` | ⚠️ Different  |
| **Type Safety**            | Generic `TModel` via Vest suite           | Inferred from model signal type           | ✅ Compatible |
| **Framework Integration**  | Angular directives (optional enhancement) | Angular `[control]` directive (required)  | ⚠️ Different  |
| **Zoneless Support**       | ✅ Signal-based CD                        | ✅ Signal-based CD                        | ✅ Identical  |
| **OnPush Compatibility**   | ✅ Default strategy                       | ✅ Works seamlessly                       | ✅ Identical  |
| **Bundle Size Impact**     | Small (Vest.js ~5KB + directives)         | Medium (Angular Forms signals)            | ✅ Both small |
| **Migration from v1**      | Vest suite migration (straightforward)    | Full rewrite (class-based → signal-based) | N/A           |
| **Interoperability**       | Works with Reactive Forms (parallel)      | Replaces Reactive Forms                   | ⚠️ Different  |
| **Community Ecosystem**    | Vest.js ecosystem (Zod, Valibot adapters) | Angular Forms ecosystem                   | ⚠️ Different  |
| **Learning Curve**         | Learn Vest.js (external library)          | Learn Signal Forms (Angular native)       | ⚠️ Different  |

**Philosophical Alignment: 100% ✅ | Implementation: Intentionally Different 🎯**

**Key Clarification:** ngx-vest-forms v2 **already uses Angular 20+ best practices**:

- ✅ Signal-based APIs throughout
- ✅ Signal-first reactivity
- ✅ Standalone components
- ✅ Zoneless + OnPush ready

The differences with Angular Signal Forms are **intentional design choices** to serve Vest.js better, not compatibility issues.

#### What ngx-vest-forms v2 and Signal Forms Share ✅

**1. Signal-First State Management**

Both use developer-owned signals as the single source of truth:

```typescript
// ngx-vest-forms v2
const model = signal({ email: '', password: '' });
const form = createVestForm(userSuite, model);

// Angular 21 Signal Forms
const model = signal({ email: '', password: '' });
const form = form(model, (path) => {
  /* validation */
});
```

**2. Automatic Bidirectional Sync**

Both automatically sync model ↔ form:

- Model changes update form fields ✅
- Form field changes update model ✅
- No manual `setValue()` or `patchValue()` needed ✅

**3. Reactive Derived State**

Both use computed signals for derived values:

```typescript
// ngx-vest-forms v2
const canSubmit = computed(() => form.valid() && !form.pending());

// Angular 21 Signal Forms
const canSubmit = computed(() => f().valid() && !f().pending());
```

**4. Zoneless + OnPush Ready**

Both work without ZoneJS and default to `OnPush` change detection ✅

**5. Template Signal Access**

Both call signals in templates:

```typescript
// ngx-vest-forms v2
<button [disabled]="form.pending()">Submit</button>

// Angular 21 Signal Forms
<button [disabled]="f().pending()">Submit</button>
```

#### Key Architectural Differences ⚠️

**1. Validation Engine**

| Aspect              | ngx-vest-forms v2                         | Angular 21 Signal Forms                   |
| ------------------- | ----------------------------------------- | ----------------------------------------- |
| **Library**         | Vest.js (external, framework-agnostic)    | Angular Forms (built-in)                  |
| **Definition**      | Vest suite (external file, reusable)      | Schema function (inline or exported)      |
| **Syntax**          | `test('email', msg, () => enforce()...)`  | `required(path.email, { message: msg })`  |
| **Async**           | `test.memo()` with deps array             | `validateHttp()` or `validateAsync()`     |
| **Cross-Field**     | `include('confirm').when('password')`     | `validate(rootPath, ({ value }) => ...)`  |
| **Conditional**     | `skipWhen(res => res.hasErrors('email'))` | `required(field, { when: () => ... })`    |
| **Error Format**    | `string[]` (messages only)                | `{ kind, message }[]` (structured)        |
| **Ecosystem**       | Vest + schema adapters (Zod, Valibot)     | Angular validators only                   |
| **Reusability**     | Suite can be used in Node.js, React, etc. | Angular-specific only                     |
| **Learning Curve**  | Learn Vest.js (separate documentation)    | Learn Angular Signal Forms (unified docs) |
| **Type Safety**     | Generic `TModel` in suite                 | Inferred from model type                  |
| **Memoization**     | Built-in via `test.memo()`                | Manual via `rxResource()` or custom       |
| **AbortSignal**     | Native support in async tests             | Via `validateHttp()` options              |
| **Field Targeting** | `only(field)` to run specific tests       | Schema applies to all fields always       |

**2. Template Binding Strategy**

```typescript
// ngx-vest-forms v2: Direct value binding
<input [value]="form.email()" (input)="form.setEmail($event)" />

// Angular 21 Signal Forms: Control directive
<input [control]="f.email" />
```

**3. Field Access Pattern**

```typescript
// ngx-vest-forms v2: Proxy-based accessors (camelCase)
form.email(); // Signal<string>
form.emailValid(); // Signal<boolean>
form.emailErrors(); // Signal<string[]>
form.setEmail(value); // Setter
form.touchEmail(); // Mark touched

// Angular 21 Signal Forms: Field tree navigation
const emailField: Field<string> = f.email;
emailField().value(); // WritableSignal<string>
emailField().valid(); // Signal<boolean>
emailField().errors(); // Signal<ErrorObject[]>
// No setters - use emailField().value.set()
```

**4. Error Display**

```typescript
// ngx-vest-forms v2: Array of strings
@if (form.emailShowErrors() && form.emailErrors().length) {
  <span role="alert">{{ form.emailErrors()[0] }}</span>
}

// Angular 21 Signal Forms: Array of error objects
@if (f.email().invalid()) {
  <div>{{ f.email().errors()[0].message }}</div>
}
```

#### Migration Complexity Assessment

**If migrating ngx-vest-forms to Angular 21 Signal Forms API:**

| Component                | Complexity | Reason                                                |
| ------------------------ | ---------- | ----------------------------------------------------- |
| **Model Signal**         | ✅ None    | Already use `signal(model)` - identical               |
| **Form Creation**        | ⚠️ Medium  | `createVestForm()` → `form()`, different parameters   |
| **Validation Logic**     | ❌ High    | Vest suite → Schema function (complete rewrite)       |
| **Template Bindings**    | ⚠️ Medium  | `[value]/(input)` → `[control]` directive             |
| **Error Handling**       | ⚠️ Medium  | `string[]` → `ErrorObject[]`, different access        |
| **Field Accessors**      | ❌ High    | Proxy-based → Path-based, lose enhanced signals       |
| **Async Validation**     | ❌ High    | Vest async → `validateHttp()`, different patterns     |
| **Cross-Field Logic**    | ❌ High    | Vest `include().when()` → `validate(root)`, rewrite   |
| **Conditional Rules**    | ❌ High    | Vest `skipWhen()` → Schema `when` predicates, rewrite |
| **Type Safety**          | ✅ None    | Both infer from model type                            |
| **Enhanced Field Proxy** | ❌ Blocker | `form.emailValid()` pattern impossible in Angular API |

**Overall Migration Assessment: HIGH COMPLEXITY, SIGNIFICANT BREAKING CHANGES**

**Why Migration is Difficult:**

1. **Vest.js Ecosystem Lock-In** - Users have Vest suites, schema adapters (Zod, Valibot), shared validation logic
2. **Enhanced Field Signals** - `form.emailValid()`, `form.emailErrors()` pattern is core to ngx-vest-forms DX
3. **Different Validation Philosophy** - Vest's `only(field)` selective validation vs Angular's schema-based
4. **Template Patterns** - `[value]`/`(input)` vs `[control]` affects all templates
5. **Error Display Strategy** - Current WCAG-compliant components assume `string[]` errors

### Strategic Positioning vs Angular 21 Signal Forms

#### Core Strategic Question

**Should ngx-vest-forms adopt/align with Angular 21 Signal Forms API?**

**Answer: NO - Maintain Independence as Complementary Solution**

#### Why NOT Align with Angular 21 Signal Forms

**1. Fundamentally Different Value Propositions**

| Aspect                     | ngx-vest-forms                                      | Angular 21 Signal Forms                   |
| -------------------------- | --------------------------------------------------- | ----------------------------------------- |
| **Core Value**             | Vest.js validation with Angular integration         | Angular-native signal-based forms         |
| **Validation Philosophy**  | External, framework-agnostic (Vest.js)              | Angular built-in validators               |
| **Developer Experience**   | Enhanced field signals (`form.emailValid()`)        | Standard field access (`field().valid()`) |
| **Reusability**            | Vest suites work in Node.js, React, Vue             | Angular-only schemas                      |
| **Ecosystem**              | Vest + schema adapters (Zod, Valibot, ArkType)      | Angular Forms validators                  |
| **Template Pattern**       | Direct value binding (`[value]`/`(input)`)          | Control directive (`[control]`)           |
| **Learning Investment**    | Learn Vest.js (transferable skill)                  | Learn Angular Signal Forms (Angular-only) |
| **Migration from v1**      | Vest suite migration (incremental)                  | Complete rewrite                          |
| **Selective Validation**   | `only(field)` - run tests for specific fields       | Schema always runs all validators         |
| **Async Memoization**      | Built-in `test.memo()` with dependency tracking     | Manual via `rxResource()` or custom logic |
| **WCAG Compliance**        | Built-in components (`NgxFormErrorComponent`)       | DIY implementation needed                 |
| **Production Readiness**   | Stable, battle-tested                               | Developer Preview, experimental           |
| **Framework Independence** | Vest core is framework-agnostic                     | Tightly coupled to Angular                |
| **Type Safety Source**     | Vest suite generics                                 | Model signal type inference               |
| **Error Structure**        | Simple `string[]` (WCAG-friendly)                   | Complex `{ kind, message }[]`             |
| **Cross-Field Validation** | Declarative `include().when()`                      | Imperative `validate(root)` function      |
| **Bundle Size**            | Vest.js (~5KB) + minimal directives                 | Angular Forms signals (larger)            |
| **Community**              | Vest.js community (framework-agnostic)              | Angular Forms community                   |
| **Use Case**               | Complex validation with reusable suites             | Angular-native form management            |
| **Competitive Advantage**  | Framework-agnostic validation, enhanced DX, Vest.js | Angular official solution                 |

**2. Breaking User Investment**

**Current ngx-vest-forms users have:**

- ✅ Vest validation suites (reusable across projects/frameworks)
- ✅ Schema adapter integrations (Zod, Valibot, ArkType)
- ✅ Shared validation logic (frontend + backend)
- ✅ Enhanced field signal patterns (`form.emailValid()`)
- ✅ WCAG-compliant error components
- ✅ Established template patterns

**Migrating to Angular Signal Forms would:**

- ❌ Require rewriting all Vest suites to Angular schemas
- ❌ Lose framework-agnostic validation (Node.js, React can't use Angular schemas)
- ❌ Break enhanced field signal API (major DX regression)
- ❌ Require template rewrites (`[value]`/`(input)` → `[control]`)
- ❌ Lose Vest ecosystem (Zod adapters, etc.)
- ❌ Abandon stable, production-tested patterns for experimental API

**3. Vest.js is the Unique Selling Point**

ngx-vest-forms' value comes from **Vest.js integration**, not from competing with Angular Forms:

- ✅ **Framework-agnostic validation** - Same suite works in Angular, React, Node.js
- ✅ **Powerful composition** - `skipWhen`, `omitWhen`, `include().when()`, `only(field)`
- ✅ **Battle-tested** - Vest.js used by thousands of projects
- ✅ **Rich ecosystem** - Schema adapters, async memoization, warnings vs errors
- ✅ **Selective validation** - Run tests for specific fields only (performance)
- ✅ **Transfer learning** - Developers learn Vest.js, use everywhere

**Angular Signal Forms can't replace this value** - it's Angular-specific by design.

#### Recommended Strategy: Co-Existence, Not Alignment

**Position ngx-vest-forms as:**

> "Vest.js validation with Angular integration - use when you need framework-agnostic validation, complex business rules, or shared validation logic across platforms."

**Position Angular 21 Signal Forms as:**

> "Angular-native signal forms - use when you need Angular-specific features and don't require cross-framework validation."

#### What ngx-vest-forms SHOULD Adopt (Minimal Angular 21 Features)

**Adopt ONLY Angular signal utilities (not Signal Forms API):**

1. ✅ **`output()` function** - Already planned, improves component outputs
2. ✅ **`rxResource()`** - For async data loading (addresses, suggestions)
3. ✅ **`toSignal()`/`toObservable()`** - Better RxJS interop
4. ✅ **`linkedSignal()`** - "Same as billing" patterns
5. ✅ **Modern Angular APIs** - `inject()`, `viewChild()`, etc.

**DO NOT Adopt:**

- ❌ **`form()` function** - Conflicts with `createVestForm()`, different philosophy
- ❌ **`[control]` directive** - Breaks current `[value]`/`(input)` pattern
- ❌ **Schema-based validation** - Duplicates Vest.js, loses framework independence
- ❌ **Field tree navigation** - Conflicts with enhanced field proxy API
- ❌ **Angular-specific validators** - Already have Vest.js

#### Concrete Action Plan (No Major Alignment)

**Phase 1: Document Differences (Immediate)**

Create comparison guide:

```markdown
# ngx-vest-forms vs Angular 21 Signal Forms

## When to use ngx-vest-forms:

- ✅ Need framework-agnostic validation (shared with Node.js, React, etc.)
- ✅ Want Vest.js power (skipWhen, omitWhen, selective validation)
- ✅ Prefer enhanced field signals (`form.emailValid()`)
- ✅ Require schema adapters (Zod, Valibot integration)
- ✅ Complex cross-field validation with `include().when()`
- ✅ Production stability (not experimental)

## When to use Angular 21 Signal Forms:

- ✅ Angular-only project (no cross-platform validation)
- ✅ Want official Angular solution
- ✅ Simple validation requirements
- ✅ Prefer Angular-native validators
- ✅ Don't need Vest.js ecosystem
```

**Phase 2: Adopt Signal Utilities (Q1 2026)**

- ✅ Use `rxResource()` for async data (addresses, suggestions)
- ✅ Use `toSignal()`/`toObservable()` for RxJS bridges
- ✅ Use `linkedSignal()` for conditional field sync
- ✅ Keep core Vest.js validation (NO migration to Angular schemas)

**Phase 3: Maintain Unique Value Prop (Ongoing)**

- ✅ Highlight Vest.js benefits (framework-agnostic, powerful composition)
- ✅ Showcase schema adapters (Zod, Valibot, ArkType)
- ✅ Emphasize enhanced DX (field signal proxy API)
- ✅ Document WCAG compliance built-in
- ✅ Position as "Vest.js for Angular" (complementary, not competing)

### Feasibility Assessment (Updated with Angular 21 Context)

#### ✅ Technical Feasibility: **VERY HIGH** (for co-existence strategy)

**Why Co-Existence Works:**

- ✅ No API conflicts - `createVestForm()` vs `form()` are distinct
- ✅ Different use cases - Vest.js validation vs Angular-native forms
- ✅ Signal utilities adoption is straightforward (rxResource, toSignal, etc.)
- ✅ Template patterns are compatible (can use both in same app)
- ✅ No architectural overhaul needed (stay Vest-first)

**Technical Validation:**

- ✅ Vest.js validation engine is independent of Angular Forms API
- ✅ Enhanced field proxy signals (`form.emailValid()`) don't conflict with Angular's `Field` API
- ✅ Template binding strategy (`[value]`/`(input)`) works alongside `[control]` directive
- ✅ Signal utilities (rxResource, toSignal) enhance current implementation without breaking changes
- ✅ WCAG components remain compatible (error structure unchanged)

#### 📊 Effort Estimate: **LOW-MEDIUM** (2-3 weeks for signal utilities)

**Immediate Actions (1-2 days):**

- Document comparison: ngx-vest-forms vs Angular 21 Signal Forms
- Clarify positioning: complementary solutions, not competitors
- Update README with "when to use which" guidance

**Signal Utilities Adoption (1-2 weeks):**

- Integrate `rxResource()` for async data (addresses, suggestions)
- Use `toSignal()`/`toObservable()` for RxJS interop
- Implement `linkedSignal()` for conditional field sync
- Add examples demonstrating signal utility integration

**Documentation Updates (3-5 days):**

- Add Angular 21 Signal Forms comparison guide
- Document signal utilities integration patterns
- Update migration guide with new context
- Clarify strategic positioning

**Optional Enhancements (future):**

- Provide helper utilities combining Vest + rxResource
- Create "best of both worlds" patterns (Vest validation + Signal utilities)
- Develop Vest ↔ Angular schema adapter (if user demand exists)

#### ✅ Value vs Cost: **EXCELLENT** (maintain independence)

**Arguments FOR Maintaining Independence:**

- ✅ **Preserve Vest.js ecosystem** - Users keep schema adapters, reusable suites
- ✅ **Framework-agnostic validation** - Vest suites work in Angular, React, Node.js
- ✅ **Enhanced DX preserved** - Keep `form.emailValid()` proxy API
- ✅ **Production stability** - No migration to experimental API
- ✅ **Minimal breaking changes** - Signal utilities are additive
- ✅ **Competitive advantage** - Unique value prop vs Angular's official solution
- ✅ **User investment protected** - Existing Vest suites remain valid
- ✅ **Clear positioning** - "Vest.js for Angular" vs "Angular Forms with Signals"

**Arguments AGAINST Aligning with Angular 21 Signal Forms:**

- ❌ **Loses unique value prop** - Becomes "yet another Angular Forms wrapper"
- ❌ **Breaking user investment** - Forces Vest suite → schema migration
- ❌ **No framework-agnostic validation** - Locked to Angular-only schemas
- ❌ **Enhanced API loss** - Can't replicate `form.emailValid()` with Angular's Field API
- ❌ **Experimental API dependency** - Angular Signal Forms not stable yet
- ❌ **Massive rewrite effort** - Core validation engine replacement
- ❌ **Ecosystem abandonment** - Lose Zod, Valibot, ArkType adapters
- ❌ **Community confusion** - "Why not just use Angular Signal Forms?"

**Strategic Reality:**

- ngx-vest-forms and Angular 21 Signal Forms serve **different needs**
- Vest.js provides **framework-agnostic validation** (Angular can't)
- Enhanced field signals provide **superior DX** (Angular's Field API can't match)
- Both can **co-exist** in same application (use right tool for job)
- Signal utilities adoption **enhances** ngx-vest-forms without breaking it

### Signal-First Utilities Integration

Angular 20.3 provides powerful signal interoperability utilities that ngx-vest-forms can leverage for enhanced reactivity and better RxJS integration.

#### Available Utilities

##### 1. `toSignal()` - Observable to Signal

Convert observables to signals for use in templates and computed values:

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { createVestForm } from 'ngx-vest-forms/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (countries(); as list) {
      <select [value]="form.country()" (change)="form.setCountry($event)">
        @for (country of list; track country.code) {
          <option [value]="country.code">{{ country.name }}</option>
        }
      </select>
    }
  `,
})
export class AddressForm {
  private readonly http = inject(HttpClient);

  // Convert HTTP observable to signal
  readonly countries = toSignal(this.http.get<Country[]>('/api/countries'), {
    initialValue: [],
  });

  readonly form = createVestForm(addressSuite, signal({ country: '' }));
}
```

**Use Cases for ngx-vest-forms:**

- ✅ Loading form options from API
- ✅ Dynamic validation rules based on async data
- ✅ Converting legacy Observable-based services

##### 2. `toObservable()` - Signal to Observable

Convert signals to observables for RxJS operators:

```typescript
import { Component, signal, effect } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { createVestForm } from 'ngx-vest-forms/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input [value]="form.username()" (input)="form.setUsername($event)" />
    @if (suggestions(); as list) {
      <ul>
        @for (suggestion of list; track suggestion) {
          <li>{{ suggestion }}</li>
        }
      </ul>
    }
  `,
})
export class UsernameForm {
  private readonly http = inject(HttpClient);

  readonly form = createVestForm(userSuite, signal({ username: '' }));

  // Convert signal to observable for debouncing
  private readonly username$ = toObservable(this.form.username);

  readonly suggestions = toSignal(
    this.username$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((username) =>
        username.length >= 3
          ? this.http.get<string[]>(`/api/suggest?q=${username}`)
          : of([]),
      ),
    ),
    { initialValue: [] },
  );
}
```

**Use Cases for ngx-vest-forms:**

- ✅ Debounced async validation
- ✅ Type-ahead/autocomplete
- ✅ Chaining validation with API calls
- ✅ Complex RxJS operators on form values

##### 3. `rxResource()` - Reactive Resource Loading

Angular 20.2+ introduces `rxResource()` for declarative async state management:

```typescript
import { Component, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { createVestForm } from 'ngx-vest-forms/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input [value]="form.zipCode()" (input)="form.setZipCode($event)" />

    @if (cityResource.isLoading()) {
      <span>Loading...</span>
    }

    @if (cityResource.value(); as city) {
      <p>City: {{ city.name }}, State: {{ city.state }}</p>
    }

    @if (cityResource.error()) {
      <p class="error">Invalid zip code</p>
    }
  `,
})
export class AddressForm {
  private readonly http = inject(HttpClient);

  readonly form = createVestForm(
    addressSuite,
    signal({
      zipCode: '',
      city: '',
      state: '',
    }),
  );

  // Reactive resource that auto-refetches when zipCode changes
  readonly cityResource = rxResource({
    request: () => ({ zip: this.form.zipCode() }),
    loader: ({ request }) => {
      if (request.zip.length !== 5) return of(null);
      return this.http.get<City>(`/api/city/${request.zip}`);
    },
  });

  constructor() {
    // Auto-populate city/state when resource loads
    effect(() => {
      const city = this.cityResource.value();
      if (city) {
        this.form.setCity(city.name);
        this.form.setState(city.state);
      }
    });
  }
}
```

**Use Cases for ngx-vest-forms:**

- ✅ Auto-populate form fields based on other fields (zip → city/state)
- ✅ Load validation constraints from API
- ✅ Dynamic form schema based on user selection
- ✅ Declarative loading/error states

##### 4. `linkedSignal()` - Derived Signals with Writes

Angular 20.1+ provides `linkedSignal()` for signals that derive from other signals but can also be written to:

```typescript
import { Component, signal, linkedSignal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label>
      <input
        type="checkbox"
        [checked]="useBillingAddress()"
        (change)="useBillingAddress.set($event.target.checked)"
      />
      Shipping address same as billing
    </label>

    @if (!useBillingAddress()) {
      <input
        [value]="shippingAddress().street"
        (input)="setShippingStreet($event.target.value)"
      />
    }
  `,
})
export class CheckoutForm {
  readonly billingAddress = signal({ street: '123 Main St', city: 'NYC' });
  readonly useBillingAddress = signal(true);

  // Linked signal: copies billing when checked, but can be edited independently
  readonly shippingAddress = linkedSignal({
    source: this.billingAddress,
    computation: (billing, previous) => {
      if (this.useBillingAddress()) return billing;
      return previous?.value ?? billing;
    },
  });

  readonly form = createVestForm(
    checkoutSuite,
    signal({
      billing: this.billingAddress(),
      shipping: this.shippingAddress(),
    }),
  );

  setShippingStreet(street: string) {
    this.shippingAddress.set({ ...this.shippingAddress(), street });
    this.form.setShipping(this.shippingAddress());
  }
}
```

**Use Cases for ngx-vest-forms:**

- ✅ "Same as billing address" patterns
- ✅ Conditional field synchronization
- ✅ Derived fields that can be overridden

#### Integration Patterns for ngx-vest-forms

##### Pattern 1: Async Validation with rxResource

```typescript
import { rxResource } from '@angular/core/rxjs-interop';
import { createSafeSuite, staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce, skipWhen } from 'vest';

// Suite with deferred async check
const emailSuite = staticSafeSuite<{ email: string }>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid format', () => enforce(data.email).isEmail());
  // Note: Expensive async check done via rxResource, not in suite
});

@Component({...})
export class SignupForm {
  private readonly http = inject(HttpClient);

  readonly form = createVestForm(emailSuite, signal({ email: '' }));

  // Separate resource for async availability check
  readonly emailAvailability = rxResource({
    request: () => ({ email: this.form.email() }),
    loader: ({ request, abortSignal }) => {
      const validation = this.form.emailValidation();

      // Only check if basic validation passes
      if (validation.errors.length > 0) return of({ available: true });

      return this.http.get<{ available: boolean }>(
        `/api/check-email/${request.email}`,
        { signal: abortSignal }
      );
    }
  });

  readonly emailAvailable = computed(() =>
    this.emailAvailability.value()?.available ?? true
  );
}
```

**Benefits:**

- ✅ Automatic cancellation via `abortSignal`
- ✅ Loading/error states built-in
- ✅ Separated concerns: validation vs availability
- ✅ Auto-refetch when email changes

##### Pattern 2: Form Value Streams with toObservable

```typescript
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Component({...})
export class DynamicForm {
  readonly form = createVestForm(suite, signal({ type: 'personal', taxId: '' }));

  // Stream of form type changes
  private readonly type$ = toObservable(this.form.type).pipe(
    distinctUntilChanged()
  );

  // Dynamic validation suite based on type
  readonly validationSuite = toSignal(
    this.type$.pipe(
      map(type => type === 'business' ? businessSuite : personalSuite)
    )
  );

  constructor() {
    // Re-validate when suite changes
    effect(() => {
      const suite = this.validationSuite();
      if (suite) {
        this.form.validate(); // Trigger full re-validation
      }
    });
  }
}
```

**Benefits:**

- ✅ Dynamic validation rules
- ✅ RxJS operators for complex logic
- ✅ Type-safe suite switching

##### Pattern 3: Optimistic UI with linkedSignal

```typescript
@Component({...})
export class ProfileForm {
  private readonly http = inject(HttpClient);

  // Server state
  private readonly serverProfile = signal({ name: 'John', bio: 'Developer' });

  // Local edits (linked to server, but can diverge)
  readonly localProfile = linkedSignal({
    source: this.serverProfile,
    computation: (server, previous) => previous?.value ?? server
  });

  readonly form = createVestForm(profileSuite, this.localProfile);

  async save() {
    const result = await this.form.submit();
    if (result.valid) {
      // Optimistic update
      this.serverProfile.set(result.data);

      try {
        await this.http.put('/api/profile', result.data).toPromise();
      } catch (error) {
        // Rollback on error
        this.localProfile.set(this.serverProfile());
      }
    }
  }
}
```

**Benefits:**

- ✅ Optimistic UI updates
- ✅ Automatic rollback on error
- ✅ Clean separation of server vs local state

#### Recommendation: Signal-First Architecture

For ngx-vest-forms v3+, embrace a **signal-first** architecture:

```typescript
// Recommended pattern combining all utilities
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
})
export class ModernForm {
  private readonly http = inject(HttpClient);

  // 1. Core form state (signal-based)
  readonly form = createVestForm(suite, signal({ email: '', username: '' }));

  // 2. Async data via rxResource
  readonly countries = rxResource({
    loader: () => this.http.get<Country[]>('/api/countries'),
  });

  // 3. Debounced validation via toObservable
  private readonly email$ = toObservable(this.form.email);
  readonly emailSuggestions = toSignal(
    this.email$.pipe(
      debounceTime(300),
      switchMap((email) => this.http.get(`/api/suggest?email=${email}`)),
    ),
    { initialValue: [] },
  );

  // 4. Derived state via computed
  readonly canSubmit = computed(
    () =>
      this.form.valid() && !this.form.pending() && this.countries.hasValue(),
  );
}
```

**Key Principles:**

1. **Signals for state** - Use `signal()` for all mutable state
2. **Computed for derivation** - Use `computed()` for derived values
3. **rxResource for async** - Use for API calls with auto-refetch
4. **toSignal/toObservable for bridges** - Only when RxJS operators needed
5. **linkedSignal for conditional sync** - Use for "same as X" patterns

#### 📊 Effort Estimate: **LOW-MEDIUM** (2-3 weeks total)

**Immediate (Now):**

- Adopt `output()` API: 1-2 days
- Update examples: 1 day

**When input()/model() Stable:**

- Provide wrapper/compatibility: 3-5 days
- Migration guide: 3-5 days
- Update documentation: 2-3 days

**Optional (Future):**

- Refactor internals to use `input()`: 1 week
- Performance optimization: 3-5 days

#### ✅ Value vs Cost: **EXCELLENT**

**Arguments FOR:**

- ✅ **Future-proof** - Aligns with Angular's official direction
- ✅ **Low effort** - Already 80% there
- ✅ **Incremental** - Adopt as APIs stabilize
- ✅ **Backward compatible** - Existing code keeps working
- ✅ **Community momentum** - Signal Forms are the future
- ✅ **Performance benefits** - Fine-grained reactivity
- ✅ **Easier migration** - Users can adopt gradually

**Arguments AGAINST:**

- ⚠️ Signal Forms still unstable (no release date)
- ⚠️ Breaking changes possible before stable
- ⚠️ Requires monitoring Angular releases

**Risk Mitigation:**

- Wait for stable release before major refactoring
- Provide compatibility layer during transition
- Maintain v2 approach as fallback

### Risks & Mitigation (Co-Existence Strategy)

| Risk                                        | Impact | Likelihood | Mitigation                                          |
| ------------------------------------------- | ------ | ---------- | --------------------------------------------------- |
| User confusion (which one to use?)          | Medium | Medium     | Clear comparison guide, "when to use" documentation |
| Angular deprecates old patterns             | Low    | Low        | Vest.js is independent, works with any UI approach  |
| Signal Forms becomes dominant               | Low    | Medium     | Position as complementary (framework-agnostic)      |
| Users expect Angular Forms compatibility    | Medium | Low        | Document differences, clarify unique value prop     |
| Missing features vs Angular Signal Forms    | Low    | Low        | Vest.js provides richer validation capabilities     |
| Community perception (not "official")       | Medium | Medium     | Emphasize Vest.js ecosystem, framework independence |
| Signal utilities API changes before stable  | Low    | Medium     | Adopt incrementally, abstract behind own API        |
| Maintenance burden (two approaches in docs) | Low    | Low        | Clear separation, minimal overlap in documentation  |

### Decision Matrix (Updated with Angular 21 Context)

| Criteria                  | Score (1-5) | Weight | Weighted   | Notes                                                  |
| ------------------------- | ----------- | ------ | ---------- | ------------------------------------------------------ |
| **Technical Feasibility** | 5           | 20%    | 1.0        | Signal utilities adoption is straightforward           |
| **Strategic Alignment**   | 5           | 30%    | 1.5        | Maintain Vest.js unique value, adopt signal utilities  |
| **User Value**            | 5           | 25%    | 1.25       | Preserve investment, enhance with signal utilities     |
| **Maintenance Cost**      | 4           | 15%    | 0.6        | Low - signal utilities are additive, not replacement   |
| **Future-Proofing**       | 5           | 10%    | 0.5        | Vest.js is framework-agnostic, survives Angular shifts |
| **Total**                 |             |        | **4.85/5** |                                                        |

**Verdict: HIGHLY RECOMMENDED** - Maintain independence, adopt signal utilities only

---

## Strategic Recommendation (Updated)

### 🎯 Recommended Path: Co-Existence with Signal Utility Adoption

**Core Strategy:**

1. ✅ **Maintain Vest.js as core validation engine** (unique selling point)
2. ✅ **Adopt Angular 21 signal utilities** (rxResource, toSignal, linkedSignal)
3. ✅ **Document differences clearly** (ngx-vest-forms vs Angular Signal Forms)
4. ✅ **Position as complementary solutions** (framework-agnostic vs Angular-native)
5. ✅ **Preserve enhanced field proxy API** (`form.emailValid()` - superior DX)

**What Changed (vs Original Analysis):**

- **Original Assumption:** Angular Signal Forms alignment would be easy (80% compatible)
- **Current Reality:** Angular Signal Forms and ngx-vest-forms share 100% philosophy but intentionally different implementation
- **Key Discovery:** ngx-vest-forms v2 **already uses** `input()`, `output()`, `inject()` - no migration needed
- **Strategic Insight:** Vest.js ecosystem + Enhanced Proxy API are unique differentiators - preserve them
- **Updated Approach:** Add Standard Schema support instead of copying Signal Forms patterns

**Why This is the Right Decision:**

**1. Vest.js is the Competitive Advantage**

- ✅ Framework-agnostic validation (Angular, React, Node.js)
- ✅ Rich ecosystem (Zod, Valibot, ArkType adapters)
- ✅ Powerful composition (`skipWhen`, `omitWhen`, `include().when()`)
- ✅ Selective validation (`only(field)` for performance)
- ✅ Battle-tested, production-ready

**2. Angular 21 Signal Forms is Different, Not Better (for our use case)**

- ⚠️ Angular-only schemas (can't share with backend/React)
- ⚠️ No selective validation (always runs all tests)
- ⚠️ Standard Field API (can't match enhanced proxy DX)
- ⚠️ Developer Preview status (experimental, unstable)
- ⚠️ Different error structure (breaks WCAG components)

**3. Users Have Investment in Vest.js**

- ✅ Existing Vest suites (reusable, tested)
- ✅ Schema adapters configured (Zod, Valibot)
- ✅ Shared validation logic (frontend + backend)
- ✅ Template patterns established
- ❌ Migration would be HIGH EFFORT, HIGH RISK, LOW REWARD

**4. Signal Utilities Enhance Without Breaking**

- ✅ `rxResource()` - Better async data loading
- ✅ `toSignal()`/`toObservable()` - RxJS interop
- ✅ `linkedSignal()` - Conditional field sync
- ✅ All additive - no breaking changes to core

### ❌ Not Recommended: NgForm Integration

**Rationale (unchanged):**

1. **Legacy Technology** - Angular moving away from template-driven forms
2. **Limited Demand** - Users wanting NgModel can use v1
3. **Maintenance Burden** - Supporting two paradigms indefinitely
4. **Poor ROI** - 3-4 weeks effort for declining user base
5. **Strategic Misalignment** - Conflicts with signal-first vision

### ❌ Not Recommended: Core Abstraction

**Rationale (unchanged):**

1. **No Clear Use Case** - Framework-agnostic validation = use Vest.js directly
2. **Over-Engineering** - Massive complexity without proven demand
3. **Performance Cost** - Abstraction layer overhead
4. **Type Safety Loss** - Difficult to maintain across adapters
5. **Conflicts with Vision** - Dilutes Vest-first signal-based approach

### ❌ Not Recommended: Align with Angular 21 Signal Forms API

**Rationale (NEW - based on Angular 21 analysis):**

1. **Fundamentally Different** - 60% different implementation, not just syntax
2. **Loses Unique Value** - Vest.js ecosystem is the selling point
3. **Breaking User Investment** - Forces rewrite of Vest suites, templates, components
4. **No Framework-Agnostic Validation** - Angular-only schemas vs Vest's universal suites
5. **Enhanced API Loss** - Can't replicate `form.emailValid()` proxy with Angular's Field
6. **Experimental Dependency** - Angular Signal Forms not stable yet
7. **Massive Rewrite** - 6-8 weeks effort, high risk, uncertain benefit
8. **User Confusion** - "Why not just use Angular Signal Forms directly?"

---

## Comparative Analysis

### Summary Table

| Aspect                    | NgForm Integration    | Core Abstraction    | Signal Forms           |
| ------------------------- | --------------------- | ------------------- | ---------------------- |
| **Technical Feasibility** | ✅ High               | ⚠️ Medium           | ✅ Very High           |
| **Effort**                | 3-4 weeks             | 6-8 weeks           | 2-3 weeks              |
| **Strategic Fit**         | ❌ Poor (legacy tech) | ❌ Poor (no demand) | ✅ Excellent (future)  |
| **User Value**            | ⚠️ Limited            | ❌ Uncertain        | ✅ High                |
| **Maintenance**           | ❌ High burden        | ❌ Very high burden | ✅ Low burden          |
| **Future-Proof**          | ❌ No (deprecated)    | ⚠️ Maybe            | ✅ Yes (official path) |
| **Risk**                  | Medium                | High                | Low                    |
| **Overall Score**         | 2.55/5 ⛔             | 1.75/5 ⛔           | 4.85/5 ✅              |

### Visual Comparison

```
                 Effort vs Value Analysis

Value ▲
   5  │                              ┌─── Signal Forms
      │                              │    (Low effort, High value)
   4  │                              │
      │                              │
   3  │         NgForm ───┐          │
      │                   │          │
   2  │                   │     Core Abstraction
      │                   │          │
   1  │                   │          │
      │                   │     ┌────┘
   0  └───────┼───────────┼─────┼──────────────────► Effort
      0       2           4     6           8 weeks
```

### Recommendation Matrix

```
Should Implement?

┌─────────────────┬──────────┬─────────────────────────┐
│ Path            │ Decision │ Rationale               │
├─────────────────┼──────────┼─────────────────────────┤
│ NgForm          │    ❌    │ Legacy tech, low value  │
│ Core Abstraction│    ❌    │ Over-engineering        │
│ Signal Forms    │    ✅    │ Strategic fit, low effort│
└─────────────────┴──────────┴─────────────────────────┘
```

---

## Strategic Recommendation

### 🎯 Recommended Path: Signal Forms Alignment

**Rationale:**

1. **Already 80% Aligned** - ngx-vest-forms v2 architecture naturally fits Signal Forms
2. **Low Effort** - Mostly additive changes, no rewrites needed
3. **Future-Proof** - Aligns with Angular's official direction
4. **Incremental Adoption** - Can adopt as APIs stabilize
5. **User Value** - Positions library for long-term success

### ❌ Not Recommended: NgForm Integration

**Rationale:**

1. **Legacy Technology** - Angular moving away from template-driven forms
2. **Limited Demand** - Users wanting NgModel can use v1
3. **Maintenance Burden** - Supporting two paradigms indefinitely
4. **Poor ROI** - 3-4 weeks effort for declining user base
5. **Strategic Misalignment** - Conflicts with v2's signal-first vision

### ❌ Not Recommended: Core Abstraction

**Rationale:**

1. **No Clear Use Case** - Who needs framework-agnostic validation? (use Vest.js)
2. **Over-Engineering** - Massive complexity without proven demand
3. **Performance Cost** - Abstraction layer overhead
4. **Type Safety Loss** - Difficult to maintain across adapters
5. **Conflicts with Vision** - Dilutes Vest-first signal-based approach

---

## Implementation Roadmap

### 🚀 Immediate Actions (Q4 2025)

#### 1. Adopt output() API (Now - 1-2 days)

```typescript
// Migrate from EventEmitter to output()
import { output } from '@angular/core';

export class FormComponent {
  formSubmit = output<SubmitResult>();
  formReset = output<void>();
}
```

**PR Checklist:**

- [ ] Replace EventEmitter with output()
- [ ] Update NgxFormErrorComponent
- [ ] Update example apps
- [ ] Update documentation
- [ ] Add migration note to CHANGELOG

#### 2. Monitor Signal Forms Progress (Ongoing)

**Track:**

- Angular release notes for `input()`/`model()` stability
- RFC #49682 updates and discussions
- Angular blog announcements
- Community adoption patterns

**Criteria for "Stable":**

- ✅ Official stable release announced
- ✅ Breaking changes finalized
- ✅ Migration guide published
- ✅ Used in Angular documentation examples

#### 3. Documentation Updates (1-2 days)

**Add to README.md:**

```markdown
## Signal Forms Compatibility

ngx-vest-forms v2 is designed with Angular Signal Forms in mind:

- ✅ Signal-based reactivity
- ✅ Function-based APIs
- ✅ Read-only inputs philosophy
- ✅ Template signal getters

When Signal Forms stabilize, migration will be straightforward.
```

**Add to ARCHITECTURE_COMPARISON.md:**

- Signal Forms alignment section
- Compatibility matrix
- Future migration path

### 📅 Short-Term (Q1 2026) - When input()/model() Stable

#### 1. Provide Compatibility Layer (3-5 days)

```typescript
// ngx-vest-forms/signal-forms/index.ts
export { input, model, output } from '@angular/core';

// Optional: Vest-specific wrappers
export function vestInput<T>(initialValue: T, suite?: VestSuite) {
  const value = input(initialValue);

  // Could add validation hooks here
  return value;
}
```

#### 2. Create Migration Guide (3-5 days)

```markdown
# Migrating to Signal Forms

## Prerequisites

- Angular 1X+ (when input/model stable)
- ngx-vest-forms v2.x+

## Step-by-Step Guide

1. Update Angular to stable Signal Forms version
2. Add `signals: true` to components
3. Replace custom signals with `input()`/`model()`
4. Update templates (minimal changes needed)
5. Test and verify

## Examples

[Before/After comparisons]
```

#### 3. Update Examples (2-3 days)

- Create Signal Forms example app
- Show side-by-side comparison
- Document best practices
- Performance benchmarks

### 🔮 Long-Term (Q2-Q3 2026) - Optional

#### 1. Internal Refactoring (1 week)

**Consider using Signal Forms APIs internally:**

```typescript
// Potential: Use input() for VestForm options
export function createVestForm<TModel>(
  suite: VestSuite,
  model: WritableSignal<TModel>,
  options?: {
    errorStrategy?: InputSignal<ErrorDisplayStrategy>;
    // ... other options as signals
  }
): VestForm<TModel> { ... }
```

**Benefits:**

- Reactive configuration
- Better Angular integration
- Future-proof architecture

**Risks:**

- Breaking changes
- Migration burden
- Complexity increase

**Decision:** Evaluate based on user feedback and Signal Forms maturity

#### 2. Performance Optimization (3-5 days)

- Leverage Signal Forms fine-grained reactivity
- Benchmark against current implementation
- Optimize change detection
- Document performance gains

### 🚫 Explicitly NOT Doing

#### NgForm Integration Package

- **Decision:** Skip entirely
- **Rationale:** Legacy tech, poor strategic fit
- **Alternative:** Direct users to v1 for NgModel needs

#### Core Abstraction Layer

- **Decision:** Skip entirely
- **Rationale:** Over-engineering without demand
- **Alternative:** Keep Vest.js as the abstraction (use it directly)

### Success Metrics

**Q4 2025:**

- [ ] output() API adopted across library
- [ ] Documentation updated with Signal Forms roadmap
- [ ] Community informed of strategic direction

**Q1 2026 (when stable):**

- [ ] Compatibility layer published
- [ ] Migration guide available
- [ ] Example apps updated
- [ ] 80%+ of API aligned with Signal Forms

**Q2-Q3 2026:**

- [ ] Internal refactoring evaluated
- [ ] Performance benchmarks published
- [ ] User migration success stories documented

---

## Conclusion

### Final Recommendation: Focus on Signal Forms

**Do This:**

1. ✅ Adopt `output()` API immediately
2. ✅ Monitor Signal Forms stabilization
3. ✅ Provide compatibility layer when stable
4. ✅ Create migration guides
5. ✅ Position library for Angular's future

**Don't Do This:**

1. ❌ Build NgForm integration package
2. ❌ Create core abstraction layer
3. ❌ Invest in legacy technologies
4. ❌ Over-engineer without user demand

**Why This Works:**

- **Low Risk** - Already 80% aligned, minimal changes needed
- **High Value** - Future-proof, aligns with Angular direction
- **Practical** - Incremental adoption, backward compatible
- **Strategic** - Positions library as Signal Forms leader
- **Efficient** - 2-3 weeks effort vs 3-4 weeks (NgForm) or 6-8 weeks (abstraction)

### Next Steps

1. **Immediate:** Create PR adopting `output()` API
2. **This Week:** Update documentation with Signal Forms roadmap
3. **Ongoing:** Monitor Angular releases for `input()`/`model()` stability
4. **When Stable:** Execute Q1 2026 roadmap items

### Questions for Discussion

1. Agreement on skipping NgForm integration? (Recommend: Yes)
2. Agreement on skipping core abstraction? (Recommend: Yes)
3. Timing for adopting `output()` API? (Recommend: This week)
4. Additional Signal Forms features to track?
5. Community communication strategy?

---

**Document Status:** Complete
**Last Updated:** October 7, 2025
**Authors:** AI Analysis based on Angular documentation, RFC #49682, and ngx-vest-forms v2 architecture
**Review Needed:** Core team decision on strategic direction
