# ngx-vest-forms Architecture Comparison

## Executive Summary

This document compares **ngx-vest-forms** (Vest.js + Angular) with Angular's native **NgForm/NgModel** template-driven forms and experimental **Signal Forms** approaches.

**Key Takeaway**: ngx-vest-forms provides a **validation-first architecture** that decouples validation logic from Angular's form primitives, offering superior flexibility, testability, and developer experience while maintaining Angular idiomatic patterns.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Detailed Comparison](#detailed-comparison)
3. [Advantages of ngx-vest-forms](#advantages-of-ngx-vest-forms)
4. [Disadvantages of ngx-vest-forms](#disadvantages-of-ngx-vest-forms)
5. [Missing Features Analysis](#missing-features-analysis)
6. [Signal Forms Compatibility](#signal-forms-compatibility)
7. [Migration Considerations](#migration-considerations)
8. [Recommendations](#recommendations)

---

## Architecture Overview

### NgForm/NgModel (Angular Template-Driven Forms)

```typescript
// Angular's approach: Framework-coupled validation
@Component({
  template: `
    <form #myForm="ngForm" (ngSubmit)="save(myForm)">
      <input name="email" [(ngModel)]="model.email" required email />
      <div
        *ngIf="
          myForm.controls['email']?.invalid && myForm.controls['email']?.touched
        "
      >
        {{ myForm.controls['email']?.errors | json }}
      </div>
    </form>
  `,
})
export class MyComponent {
  model = { email: '' };

  save(form: NgForm) {
    if (form.valid) {
      // Submit logic
    }
  }
}
```

**Key Characteristics**:

- ✅ **Automatic FormControl creation** via `NgModel`
- ✅ **Two-way binding** with `[(ngModel)]`
- ✅ **Built-in validators** (`required`, `email`, `minLength`, etc.)
- ❌ **Tightly coupled** to Angular's FormsModule
- ❌ **Limited async validation** (requires custom validators)
- ❌ **No cross-field validation** without custom directives
- ❌ **Validation logic lives in template** (hard to test/reuse)

---

### ngx-vest-forms (Vest.js + Angular Signals)

```typescript
// ngx-vest-forms approach: Validation-first, framework-agnostic
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

// 1. Define validation suite (portable, testable)
export const userSuite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Email format is invalid', () => {
    enforce(data.email).isEmail();
  });
});

// 2. Component using ngx-vest-forms
@Component({
  imports: [NgxVestForms],
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <input
        id="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
      />
      <ngx-form-error [field]="form.emailField()" />
      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `,
})
export class MyComponent {
  form = createVestForm(userSuite, signal({ email: '' }));

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) {
      await this.api.save(result.data);
    }
  }

  ngOnDestroy() {
    this.form.dispose();
  }
}
```

**Key Characteristics**:

- ✅ **Validation-first design** (Vest suite is framework-agnostic)
- ✅ **Signal-based reactivity** (Angular 20+ native)
- ✅ **Automatic ARIA attributes** (WCAG 2.2 compliant)
- ✅ **Advanced async validation** (with `skipWhen`, debouncing, AbortSignal)
- ✅ **Cross-field validation** (built-in with Vest's `include`)
- ✅ **Portable validation logic** (reuse in Node.js, browser, tests)
- ❌ **Requires learning Vest.js API**
- ❌ **More boilerplate for simple forms**

---

### Signal Forms (Experimental Angular)

```typescript
// Angular's experimental Signal Forms approach
import { form, Field, validate, required, email } from '@angular/forms';

@Component({
  template: `
    <input [value]="emailField().value()" (input)="emailField().set($event)" />
    @if (emailField().errors()) {
      <div>{{ emailField().errors() }}</div>
    }
  `,
})
export class MyComponent {
  formModel = form({
    email: field('', [validate(required), validate(email)]),
  });

  emailField = this.formModel.controls.email;
}
```

**Key Characteristics**:

- ✅ **Signal-native** (no RxJS)
- ✅ **Schema-based validation** (via `schema()`)
- ✅ **Tree structure** (Field hierarchy)
- ❌ **Experimental API** (breaking changes expected)
- ❌ **Limited ecosystem** (no major libraries yet)
- ❌ **Validation still coupled** to Angular

---

## Detailed Comparison

### 1. Validation Logic Location

| Aspect                     | NgForm/NgModel                           | ngx-vest-forms                     | Signal Forms                      |
| -------------------------- | ---------------------------------------- | ---------------------------------- | --------------------------------- |
| **Where validation lives** | Template attributes OR custom validators | Vest suite (separate file)         | Schema OR validator functions     |
| **Testability**            | ⚠️ Hard (requires TestBed)               | ✅ Excellent (pure functions)      | ⚠️ Medium (needs Angular context) |
| **Reusability**            | ❌ Template-only                         | ✅ Anywhere (Node, browser, tests) | ⚠️ Angular-only                   |
| **Type safety**            | ❌ Runtime errors                        | ✅ Full TypeScript support         | ✅ Schema-driven types            |

**Example - Testing Validation**:

```typescript
// ❌ NgForm: Requires Angular TestBed
it('should validate email', () => {
  const fixture = TestBed.createComponent(MyComponent);
  const emailControl = fixture.componentInstance.form.controls['email'];
  emailControl.setValue('invalid');
  expect(emailControl.invalid).toBe(true);
});

// ✅ ngx-vest-forms: Pure function testing
it('should validate email', () => {
  const result = userSuite({ email: 'invalid' });
  expect(result.hasErrors('email')).toBe(true);
  expect(result.getErrors('email')).toContain('Email format is invalid');
});

// ⚠️ Signal Forms: Requires Angular signals context
it('should validate email', () => {
  TestBed.runInInjectionContext(() => {
    const emailField = field('invalid', [validate(required), validate(email)]);
    expect(emailField.errors()).toBeTruthy();
  });
});
```

---

### 2. Async Validation

| Aspect                    | NgForm/NgModel                       | ngx-vest-forms                   | Signal Forms                        |
| ------------------------- | ------------------------------------ | -------------------------------- | ----------------------------------- |
| **API complexity**        | ⚠️ Medium (AsyncValidator interface) | ✅ Simple (`test` + async/await) | ⚠️ Medium (custom async validators) |
| **Cancellation**          | ❌ Manual setup                      | ✅ Built-in (AbortSignal)        | ❌ Not specified                    |
| **Debouncing**            | ❌ Manual setup                      | ✅ Built-in (`test.debounce()`)  | ❌ Not specified                    |
| **Conditional execution** | ❌ Complex logic                     | ✅ `skipWhen` / `omitWhen`       | ❌ Not specified                    |

**Example - Async Email Check**:

```typescript
// ❌ NgForm: Verbose AsyncValidator
export class EmailAsyncValidator implements AsyncValidator {
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return this.http.get(`/check-email/${control.value}`).pipe(
      map((exists) => (exists ? { emailTaken: true } : null)),
      catchError(() => of(null)),
    );
  }
}

// ✅ ngx-vest-forms: Simple + powerful
export const userSuite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());

  // Skip expensive check until basic validation passes
  skipWhen(
    (res) => res.hasErrors('email'),
    () => {
      test('email', 'Already taken', async ({ signal }) => {
        const response = await fetch(`/check-email/${data.email}`, { signal });
        if (response.ok) throw new Error('Taken');
      });
    },
  );
});

// ⚠️ Signal Forms: Not yet documented for async validation
```

---

### 3. Cross-Field Validation

| Aspect               | NgForm/NgModel               | ngx-vest-forms          | Signal Forms             |
| -------------------- | ---------------------------- | ----------------------- | ------------------------ |
| **Built-in support** | ❌ No                        | ✅ Yes (`include.when`) | ⚠️ Via custom validators |
| **Syntax**           | ⚠️ Custom validator function | ✅ Declarative          | ⚠️ Imperative            |
| **Reactivity**       | ❌ Manual triggers           | ✅ Automatic            | ✅ Signal-driven         |

**Example - Password Confirmation**:

```typescript
// ❌ NgForm: Custom validator on form group
export function passwordMatchValidator(group: FormGroup) {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
}

// ✅ ngx-vest-forms: Declarative cross-field
export const userSuite = staticSafeSuite<UserModel>((data) => {
  test('password', 'Required', () => enforce(data.password).isNotEmpty());

  // Automatically revalidate confirmPassword when password changes
  include('confirmPassword').when('password');
  test('confirmPassword', 'Must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});

// ⚠️ Signal Forms: Custom validator (similar to NgForm)
```

---

### 4. Error Display & UX

| Aspect                  | NgForm/NgModel                    | ngx-vest-forms                             | Signal Forms                      |
| ----------------------- | --------------------------------- | ------------------------------------------ | --------------------------------- |
| **Error strategies**    | ❌ Manual logic                   | ✅ Built-in (4 strategies)                 | ❌ Manual logic                   |
| **ARIA attributes**     | ❌ Manual                         | ✅ Automatic (`NgxVestAutoAriaDirective`)  | ❌ Manual                         |
| **Touch detection**     | ✅ Built-in (`.touched`)          | ✅ Automatic (`NgxVestAutoTouchDirective`) | ⚠️ Manual                         |
| **WCAG 2.2 compliance** | ⚠️ Requires manual implementation | ✅ Out-of-the-box                          | ⚠️ Requires manual implementation |

**Error Display Strategies** (ngx-vest-forms):

```typescript
// 1. Immediate: Show errors while typing
createVestForm(suite, model, { errorStrategy: 'immediate' });

// 2. On-touch: Show after blur (WCAG recommended)
createVestForm(suite, model, { errorStrategy: 'on-touch' });

// 3. On-submit: Show only after submission
createVestForm(suite, model, { errorStrategy: 'on-submit' });

// 4. Manual: Full control
createVestForm(suite, model, { errorStrategy: 'manual' });

// 5. Reactive: Switch strategies at runtime
const mode = signal<ErrorDisplayStrategy>('on-touch');
createVestForm(suite, model, { errorStrategy: mode });
```

---

### 5. Developer Experience

| Aspect             | NgForm/NgModel                | ngx-vest-forms                 | Signal Forms              |
| ------------------ | ----------------------------- | ------------------------------ | ------------------------- |
| **Learning curve** | ✅ Low (Angular docs)         | ⚠️ Medium (Vest + library)     | ⚠️ Medium (new API)       |
| **Boilerplate**    | ✅ Minimal (for simple forms) | ⚠️ More (validation suite)     | ⚠️ Medium                 |
| **IDE support**    | ✅ Excellent                  | ✅ Excellent (TypeScript)      | ⚠️ Limited (experimental) |
| **Debugging**      | ⚠️ Complex (FormControl tree) | ✅ Simple (Vest result object) | ⚠️ New patterns           |
| **Auto-complete**  | ❌ String-based field names   | ✅ Type-safe field accessors   | ✅ Schema-driven          |

**Example - Type Safety**:

```typescript
// ❌ NgForm: Runtime errors
myForm.controls['emial'].setValue('test'); // Typo! Runtime error

// ✅ ngx-vest-forms: Compile-time errors
form.emial(); // ❌ TypeScript error: Property 'emial' does not exist
form.email(); // ✅ Correct

// ✅ Signal Forms: Schema-driven types
formModel.controls.emial; // ❌ TypeScript error
```

---

## Advantages of ngx-vest-forms

### 1. **Validation Portability** ⭐⭐⭐⭐⭐

Validation suites are **framework-agnostic** and can be reused:

- ✅ **Server-side validation** (Node.js, Deno, Bun)
- ✅ **Client-side** (React, Vue, Svelte, vanilla JS)
- ✅ **Unit tests** (Jest, Vitest) without Angular TestBed
- ✅ **API documentation** (validation rules = API contract)

```typescript
// Same suite works everywhere!
export const userSuite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// Angular component
const form = createVestForm(userSuite, signal({ email: '' }));

// Node.js API
app.post('/users', (req, res) => {
  const result = userSuite(req.body);
  if (!result.isValid()) {
    return res.status(400).json(result.getErrors());
  }
  // Save user...
});

// Pure unit test
it('validates email', () => {
  expect(userSuite({ email: '' }).hasErrors('email')).toBe(true);
});
```

---

### 2. **Advanced Async Validation** ⭐⭐⭐⭐⭐

Vest provides **production-grade async validation** out-of-the-box:

```typescript
export const userSuite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());

  // ✅ Conditional execution: Skip expensive check until basic validation passes
  skipWhen(
    (res) => res.hasErrors('email'),
    () => {
      // ✅ Debouncing: Wait 300ms after typing stops
      test.debounce(
        'email',
        'Already taken',
        async ({ signal }) => {
          // ✅ Cancellation: Abort previous request if user keeps typing
          const response = await fetch(`/api/check-email/${data.email}`, {
            signal,
          });
          if (response.ok) throw new Error('Taken');
        },
        300,
      ); // debounce time
    },
  );

  // ✅ Memoization: Cache result for same input
  test.memo(
    'username',
    'Taken',
    async ({ signal }) => {
      return checkUsername(data.username, { signal });
    },
    [data.username],
  ); // dependency array
});
```

**NgForm equivalent**: Requires custom `AsyncValidator` + RxJS operators + manual debouncing + cancellation logic = **100+ lines of code**.

---

### 3. **Superior Error Display Control** ⭐⭐⭐⭐

Built-in error strategies with **WCAG 2.2 compliance**:

```typescript
// ✅ Automatic ARIA attributes
@Component({
  imports: [NgxVestForms],
  template: `
    <form [ngxVestForm]="form">
      <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
      <!-- Automatic: aria-invalid, aria-describedby, error display -->
    </form>
  `
})
```

**What you get for free**:

- ✅ `aria-invalid="true"` when field has errors
- ✅ `aria-describedby` linking to error messages
- ✅ `role="alert"` for blocking errors (WCAG ARIA19)
- ✅ `role="status"` for warnings (WCAG ARIA22)
- ✅ Touch detection (errors after blur, not while typing)

---

### 4. **Type Safety & DX** ⭐⭐⭐⭐⭐

**Enhanced Field Signals API** via TypeScript Proxy:

```typescript
interface UserModel {
  email: string;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
}

const form = createVestForm(userSuite, signal<UserModel>({ ... }));

// ✅ Auto-generated accessors (type-safe)
form.email();                    // Signal<string>
form.emailValid();               // Signal<boolean>
form.emailValidation();          // Signal<{ errors: string[], warnings: string[] }>
form.emailTouched();             // Signal<boolean>
form.emailPending();             // Signal<boolean>
form.emailShowErrors();          // Signal<boolean>

// ✅ Setters with proper typing
form.setEmail($event);           // Accepts Event or string
form.touchEmail();               // Mark touched
form.resetEmail();               // Reset to initial

// ✅ Nested fields (camelCase)
form.personalInfoFirstName();    // Signal<string> for personalInfo.firstName
form.setPersonalInfoFirstName($event);

// ❌ TypeScript errors for typos
form.emial();                    // Error: Property 'emial' does not exist
```

**NgForm equivalent**: String-based field access with **zero type safety**.

---

### 5. **Cross-Field Validation (Declarative)** ⭐⭐⭐⭐⭐

Vest's `include` makes dependent validation **effortless**:

```typescript
export const passwordSuite = staticSafeSuite<PasswordModel>((data) => {
  test('password', 'Required', () => enforce(data.password).isNotEmpty());
  test('password', 'Min 8 chars', () => enforce(data.password).longerThan(7));

  // ✅ Automatically revalidate confirmPassword when password changes
  include('confirmPassword').when('password');

  test('confirmPassword', 'Required', () => {
    enforce(data.confirmPassword).isNotEmpty();
  });

  test('confirmPassword', 'Must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});
```

**NgForm equivalent**: Custom validator on `FormGroup` + manual trigger logic.

---

### 6. **Zero RxJS Dependency** ⭐⭐⭐⭐

ngx-vest-forms uses **Angular Signals** exclusively:

- ✅ Smaller bundle size (no RxJS)
- ✅ Simpler mental model (no observables)
- ✅ Better Angular 20+ alignment
- ✅ Zoneless-compatible

---

### 7. **Validation Flexibility** ⭐⭐⭐⭐⭐

Vest provides advanced control flow:

```typescript
export const orderSuite = staticSafeSuite<OrderModel>((data) => {
  // ✅ Conditional validation
  omitWhen(!data.requiresShipping, () => {
    test('shippingAddress', 'Required', () => {
      enforce(data.shippingAddress).isNotEmpty();
    });
  });

  // ✅ Warning-only tests (non-blocking)
  test('password', 'Add special chars for security', () => {
    warn(); // Won't block submission
    enforce(data.password).matches(/[!@#$%^&*]/);
  });

  // ✅ Grouping for multi-step forms
  group('step1', () => {
    test('email', 'Required', () => enforce(data.email).isNotEmpty());
  });

  group('step2', () => {
    test('phone', 'Required', () => enforce(data.phone).isNotEmpty());
  });
});

// Validate specific group
orderSuite(data, 'step1'); // Only validate step 1
```

---

## Disadvantages of ngx-vest-forms

### 1. **Learning Curve** ❌

- **Requires learning Vest.js** in addition to Angular
- Different mental model than Angular forms
- More concepts to understand (`only`, `skipWhen`, `omitWhen`, `include`, etc.)

**Mitigation**: Comprehensive documentation, examples, and the safe suite wrappers reduce complexity.

---

### 2. **More Boilerplate for Simple Forms** ❌

Simple forms require more setup:

```typescript
// NgForm: 5 lines
<input name="email" [(ngModel)]="model.email" required email />

// ngx-vest-forms: ~15 lines (suite + component)
export const suite = staticSafeSuite<Model>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid format', () => enforce(data.email).isEmail());
});

const form = createVestForm(suite, signal({ email: '' }));
<input [value]="form.email()" (input)="form.setEmail($event)" />
```

**When it matters**: One-off forms, prototypes, simple CRUD.
**When it doesn't**: Complex validation, reusable validation, production apps.

---

### 3. **No Built-in FormControl Abstraction** ❌

Unlike `NgModel` or `FormControl`, ngx-vest-forms doesn't abstract input elements:

```typescript
// NgForm: Automatic control wrapping
<input [(ngModel)]="model.email" /> <!-- NgModel creates FormControl -->

// ngx-vest-forms: Manual bindings
<input [value]="form.email()" (input)="form.setEmail($event)" />
```

**Why this exists**: Vest is framework-agnostic. Angular-specific abstractions would break portability.

**Mitigation**: The `NgxVestFormField` component provides layout + error display:

```typescript
<ngx-vest-form-field [field]="form.emailField()">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
  <!-- Error display automatic! -->
</ngx-vest-form-field>
```

---

### 4. **Limited Ecosystem Integration** ❌

Angular's `FormsModule` and `ReactiveFormsModule` integrate with:

- Third-party component libraries (Angular Material, PrimeNG, etc.)
- Built-in Angular directives (`NgModel`, `NgForm`, `FormGroupDirective`)
- Angular CDK behaviors

ngx-vest-forms requires manual integration:

```typescript
// Angular Material example
<mat-form-field>
  <input matInput [value]="form.email()" (input)="form.setEmail($event)" />
  <!-- Custom error display needed -->
  @if (form.emailShowErrors()) {
    <mat-error>{{ form.emailValidation().errors[0] }}</mat-error>
  }
</mat-form-field>
```

**Mitigation**: Adapter directives can be created for popular libraries.

---

### 5. **No `FormGroup` Abstraction** ❌

NgForm/Reactive Forms provide `FormGroup` for nested forms:

```typescript
// ReactiveFormsModule
const formGroup = new FormGroup({
  personalInfo: new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
  }),
});

// ngx-vest-forms: Flat structure with nested paths
const form = createVestForm(
  suite,
  signal({
    personalInfo: { firstName: '', lastName: '' },
  }),
);

form.field('personalInfo.firstName').value(); // Access via path
```

**Impact**: No hierarchical control structure. Field access is path-based.

**Mitigation**: Enhanced Field Signals API provides auto-generated accessors:

```typescript
form.personalInfoFirstName(); // Auto-generated from path
```

---

### 6. **Requires Manual Cleanup** ❌

Must call `dispose()` in `ngOnDestroy`:

```typescript
export class MyComponent implements OnDestroy {
  form = createVestForm(suite, signal({ email: '' }));

  ngOnDestroy() {
    this.form.dispose(); // Required to prevent memory leaks
  }
}
```

NgForm/NgModel handle cleanup automatically.

---

## Missing Features Analysis

### Features ngx-vest-forms Should Support

#### 1. **FormArray Support** ⚠️ Partially Implemented

**Current State**: Basic `array()` API exists:

```typescript
const items = form.array('items');
items.push({ name: '' });
items.remove(index);
items.at(index).value();
```

**Missing**:

- ❌ No built-in validation for array-level rules (e.g., "at least 2 items")
- ❌ No template directive for automatic array rendering
- ❌ Limited documentation/examples

**Recommendation**: Enhance with:

```typescript
// Array-level validation
test('items', 'At least 2 required', () => {
  enforce(data.items).lengthNotEquals(0).longerThan(1);
});

// Template directive
<ngx-vest-form-array [field]="form.array('items')">
  <ng-template let-item let-index="index">
    <input [value]="item.name()" (input)="item.setName($event)" />
  </ng-template>
</ngx-vest-form-array>
```

---

#### 2. **Disabled State Management** ❌ Missing

Angular forms provide:

```typescript
formControl.disable();
formControl.enable();
formControl.disabled; // true/false
```

**ngx-vest-forms**: No built-in disabled state.

**Workaround**: Manual implementation:

```typescript
const disabled = signal(false);

<input
  [value]="form.email()"
  [disabled]="disabled()"
  (input)="form.setEmail($event)"
/>
```

**Recommendation**: Add to `VestField`:

```typescript
interface VestField<T> {
  // ... existing properties
  disabled: Signal<boolean>;
  enable(): void;
  disable(): void;
}

// Usage
form.emailField().disable();
```

---

#### 3. **Dirty State Tracking** ❌ Missing

Angular forms track "pristine" vs "dirty" state:

```typescript
formControl.pristine; // true if value unchanged
formControl.dirty; // true if value changed
```

**ngx-vest-forms**: No built-in dirty detection.

**Workaround**: Manual comparison:

```typescript
const isDirty = computed(() => form.email() !== initialValue.email);
```

**Recommendation**: Add to `VestField`:

```typescript
interface VestField<T> {
  // ... existing properties
  pristine: Signal<boolean>;
  dirty: Signal<boolean>;
  markAsPristine(): void;
  markAsDirty(): void;
}
```

---

#### 4. **updateOn Strategy** ⚠️ Partially via Error Strategies

Angular forms have `updateOn`:

```typescript
new FormControl('', { updateOn: 'blur' }); // Validate on blur only
```

**ngx-vest-forms**: Error display strategies control **when errors show**, not when validation runs.

```typescript
// Current: Controls error display, not validation timing
createVestForm(suite, model, { errorStrategy: 'on-touch' });
```

**Gap**: No way to defer validation itself until blur (always validates on input).

**Recommendation**: Add `validateOn` option:

```typescript
createVestForm(suite, model, {
  validateOn: 'blur', // or 'input' (default), 'submit'
  errorStrategy: 'on-touch',
});
```

---

#### 5. **ValueChanges Observable** ❌ Missing

Angular forms provide:

```typescript
formControl.valueChanges.subscribe((value) => {
  console.log('Value changed:', value);
});
```

**ngx-vest-forms**: Uses signals, not observables.

**Workaround**: Use `effect()`:

```typescript
effect(() => {
  console.log('Email changed:', form.email());
});
```

**Not really missing**: Signals are the modern replacement for observables. Can use `toObservable()` if needed:

```typescript
import { toObservable } from '@angular/core/rxjs-interop';

const email$ = toObservable(form.email);
email$.subscribe((value) => console.log(value));
```

---

#### 6. **StatusChanges Observable** ❌ Missing

Angular forms emit status changes:

```typescript
formControl.statusChanges.subscribe((status) => {
  console.log('Status:', status); // 'VALID', 'INVALID', 'PENDING'
});
```

**ngx-vest-forms**: Use signals:

```typescript
effect(() => {
  const status = form.valid() ? 'VALID' : 'INVALID';
  const isPending = form.pending();
  console.log('Status:', isPending ? 'PENDING' : status);
});
```

**Not really missing**: Signal-based approach is more modern.

---

#### 7. **Integration with `ControlValueAccessor`** ❌ Missing

Angular's `ControlValueAccessor` allows custom components to work with `FormControl`:

```typescript
// Custom component works with NgModel
<custom-date-picker [(ngModel)]="date"></custom-date-picker>
```

**ngx-vest-forms**: No equivalent.

**Recommendation**: Create `VestValueAccessor` interface:

```typescript
interface VestValueAccessor<T> {
  writeValue(value: T): void;
  registerOnChange(fn: (value: T) => void): void;
  registerOnTouched(fn: () => void): void;
  setDisabledState?(isDisabled: boolean): void;
}

// Usage
<custom-date-picker
  [vestValue]="form.date()"
  (vestValueChange)="form.setDate($event)"
  (vestTouched)="form.touchDate()"
></custom-date-picker>
```

---

### Features That Are Better in ngx-vest-forms

#### 1. **Async Validation** ✅ Superior

Vest provides production-ready async validation:

- ✅ Built-in debouncing (`test.debounce()`)
- ✅ Built-in memoization (`test.memo()`)
- ✅ Automatic cancellation (AbortSignal)
- ✅ Conditional execution (`skipWhen`, `omitWhen`)

Angular: Requires manual implementation of all these patterns.

---

#### 2. **Cross-Field Validation** ✅ Superior

Vest's `include.when` is declarative and powerful:

```typescript
include('confirmPassword').when('password');
test('confirmPassword', 'Must match', () => {
  enforce(data.confirmPassword).equals(data.password);
});
```

Angular: Requires custom validators on `FormGroup` with manual triggers.

---

#### 3. **Error Display UX** ✅ Superior

ngx-vest-forms provides 4 built-in strategies + automatic ARIA:

- `immediate`, `on-touch`, `on-submit`, `manual`
- Automatic `aria-invalid`, `aria-describedby`
- WCAG 2.2 compliant out-of-the-box

Angular: Manual implementation required.

---

#### 4. **Validation Portability** ✅ Superior

Vest suites are **framework-agnostic**:

- ✅ Use in Node.js, Deno, browser, tests
- ✅ Share between frontend/backend
- ✅ No Angular dependency

Angular validators: Tightly coupled to Angular.

---

## Signal Forms Compatibility

### Overview

Angular's **experimental Signal Forms** (`form()`, `Field`, `FieldState`) share design goals with ngx-vest-forms:

- ✅ Signal-based reactivity
- ✅ No RxJS dependency
- ✅ Modern Angular 20+ alignment

---

### Architectural Alignment

| Aspect              | Signal Forms              | ngx-vest-forms      | Compatibility          |
| ------------------- | ------------------------- | ------------------- | ---------------------- |
| **State container** | `form()`                  | `createVestForm()`  | ✅ Similar APIs        |
| **Field access**    | `Field` tree              | `VestField` + paths | ⚠️ Different structure |
| **Validation**      | Schema-based (`schema()`) | Suite-based (Vest)  | ❌ Different paradigms |
| **Error display**   | Manual                    | Built-in strategies | ⚠️ Could complement    |
| **Type safety**     | Schema-driven             | TypeScript generics | ✅ Both type-safe      |

---

### Integration Strategy

#### Option 1: **Vest as Validation Layer for Signal Forms**

Use ngx-vest-forms **only for validation**, with Signal Forms for state:

```typescript
import { form, field } from '@angular/forms';
import { createVestForm } from 'ngx-vest-forms/core';

@Component({
  template: `
    <input [value]="emailField().value()" (input)="handleEmailChange($event)" />
    @if (vestForm.emailShowErrors()) {
      <div role="alert">{{ vestForm.emailValidation().errors[0] }}</div>
    }
  `,
})
export class MyComponent {
  // Signal Forms for state
  signalForm = form({
    email: field(''),
  });

  emailField = this.signalForm.controls.email;

  // Vest for validation
  vestForm = createVestForm(emailSuite, toSignal(this.emailField.value));

  handleEmailChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.emailField.set(value); // Update Signal Form
    this.vestForm.setEmail(event); // Trigger Vest validation
  }
}
```

**Pros**:

- ✅ Use Signal Forms for state management
- ✅ Use Vest for advanced validation
- ✅ Gradual migration path

**Cons**:

- ❌ Dual state management (complex)
- ❌ Synchronization overhead

---

#### Option 2: **Vest Suite Adapter for Signal Forms**

Create an adapter that converts Vest suites to Signal Forms validators:

```typescript
import { validate } from '@angular/forms';
import type { VestSuite } from 'ngx-vest-forms/core';

// Adapter function
function vestValidator<T>(suite: VestSuite<T>, fieldName: string) {
  return validate<T>((value) => {
    const result = suite({ [fieldName]: value } as T);
    const errors = result.getErrors(fieldName);
    return errors.length > 0 ? { vest: errors } : null;
  });
}

// Usage
const emailField = field('', [vestValidator(emailSuite, 'email')]);
```

**Pros**:

- ✅ Reuse Vest suites in Signal Forms
- ✅ Leverage Vest's power (async, cross-field, etc.)
- ✅ Single state management (Signal Forms)

**Cons**:

- ❌ Loses some Vest features (field-specific execution, `only()`)
- ❌ Error display still manual

---

#### Option 3: **Standalone Coexistence** (Recommended)

Use **Signal Forms** for simple forms, **ngx-vest-forms** for complex validation:

```typescript
// Simple form → Signal Forms
@Component({
  template: `<input [value]="emailField().value()" />`,
})
export class SimpleFormComponent {
  formModel = form({
    email: field('', [validate(required), validate(email)]),
  });

  emailField = this.formModel.controls.email;
}

// Complex validation → ngx-vest-forms
@Component({
  template: `
    <form [ngxVestForm]="form">
      <input [value]="form.email()" (input)="form.setEmail($event)" />
    </form>
  `,
})
export class ComplexFormComponent {
  form = createVestForm(complexSuite, signal({ email: '' }));
}
```

**Pros**:

- ✅ Use the right tool for the job
- ✅ No forced integration
- ✅ Clear separation of concerns

**Cons**:

- ❌ Two form paradigms in the same app

---

### Recommendation

**Wait for Signal Forms to stabilize** before investing in deep integration:

1. ✅ **Current state**: Use ngx-vest-forms for production apps
2. ⚠️ **Experimental phase**: Monitor Signal Forms evolution
3. ✅ **Future integration**: Build adapter when Signal Forms reach stable API (Angular 21+)

---

## Migration Considerations

### From NgForm/NgModel to ngx-vest-forms

#### Step 1: Extract validation logic

```typescript
// Before: NgForm (template-driven)
<input name="email" [(ngModel)]="model.email" required email />

// After: ngx-vest-forms (validation-first)
export const userSuite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid format', () => enforce(data.email).isEmail());
});
```

#### Step 2: Replace NgModel with signals

```typescript
// Before
model = { email: '' };

// After
model = signal({ email: '' });
form = createVestForm(userSuite, this.model);
```

#### Step 3: Update template

```typescript
// Before
<input name="email" [(ngModel)]="model.email" />

// After
<input
  id="email"
  [value]="form.email()"
  (input)="form.setEmail($event)"
/>
```

---

### From ReactiveFormsModule to ngx-vest-forms

Similar process, but start by converting `FormGroup`/`FormControl` to Vest suite:

```typescript
// Before: Reactive Forms
this.formGroup = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
});

// After: ngx-vest-forms
export const suite = staticSafeSuite<Model>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid', () => enforce(data.email).isEmail());
});

this.form = createVestForm(suite, signal({ email: '' }));
```

---

## Recommendations

### When to Use ngx-vest-forms

✅ **Use ngx-vest-forms when**:

1. **Complex validation logic** (async, cross-field, conditional)
2. **Validation portability** needed (share with backend/tests)
3. **Production applications** requiring robust UX
4. **WCAG 2.2 compliance** is mandatory
5. **Type safety** is critical
6. **Advanced async patterns** (debouncing, memoization, cancellation)

---

### When to Use NgForm/NgModel

✅ **Use NgForm/NgModel when**:

1. **Simple forms** (1-3 fields, basic validation)
2. **Rapid prototyping** (speed over structure)
3. **Legacy codebase** (already using FormsModule)
4. **Team unfamiliar with Vest** (learning curve matters)
5. **Third-party component integration** (Angular Material, PrimeNG)

---

### When to Wait for Signal Forms

⏳ **Wait for Signal Forms when**:

1. **Experimental API** is acceptable (non-production)
2. **Simple validation** is sufficient
3. **No complex async patterns** needed
4. **Angular 21+** timeline aligns with your roadmap

---

## Conclusion

### Key Takeaways

1. **ngx-vest-forms excels at**:
   - ✅ Advanced validation (async, cross-field, conditional)
   - ✅ Validation portability (framework-agnostic Vest suites)
   - ✅ Type safety & DX (Enhanced Field Signals API)
   - ✅ WCAG 2.2 compliance (automatic ARIA, error strategies)

2. **ngx-vest-forms trade-offs**:
   - ❌ Learning curve (Vest.js + library concepts)
   - ❌ More boilerplate for simple forms
   - ❌ Limited ecosystem integration (no ControlValueAccessor)

3. **Missing features** (vs NgForm):
   - ❌ Disabled state management
   - ❌ Dirty/pristine tracking
   - ⚠️ FormArray (basic support exists)
   - ❌ ControlValueAccessor integration

4. **Signal Forms compatibility**:
   - ⏳ Wait for stable API (Angular 21+)
   - ✅ Standalone coexistence is viable
   - ✅ Adapter possible but complex

---

### Final Recommendation

**For production applications with complex validation needs**, ngx-vest-forms provides a **superior developer experience** and **robust validation architecture** compared to Angular's built-in forms.

**For simple forms or rapid prototyping**, stick with NgForm/NgModel until the validation requirements justify the migration.

**For Signal Forms integration**, wait for the API to stabilize before investing in deep integration efforts.

---

## Appendix: Feature Comparison Matrix

| Feature              | NgForm/NgModel          | ngx-vest-forms                         | Signal Forms (Experimental)  |
| -------------------- | ----------------------- | -------------------------------------- | ---------------------------- |
| **Validation Logic** | Template OR validators  | Vest suite (separate file)             | Schema OR validators         |
| **Async Validation** | ⚠️ AsyncValidator       | ✅ Built-in (skipWhen, debounce, memo) | ⚠️ Custom validators         |
| **Cross-Field**      | ❌ Manual               | ✅ Built-in (`include.when`)           | ⚠️ Custom validators         |
| **Error Strategies** | ❌ Manual               | ✅ 4 built-in + custom                 | ❌ Manual                    |
| **ARIA Attributes**  | ❌ Manual               | ✅ Automatic                           | ❌ Manual                    |
| **Touch Detection**  | ✅ Built-in             | ✅ Automatic directive                 | ⚠️ Manual                    |
| **Type Safety**      | ❌ String-based         | ✅ Full TypeScript                     | ✅ Schema-driven             |
| **Portability**      | ❌ Angular-only         | ✅ Framework-agnostic                  | ❌ Angular-only              |
| **FormArray**        | ✅ Full support         | ⚠️ Basic support                       | ✅ Full support (via schema) |
| **Disabled State**   | ✅ Built-in             | ❌ Missing                             | ✅ Built-in                  |
| **Dirty/Pristine**   | ✅ Built-in             | ❌ Missing                             | ✅ Built-in (via FieldState) |
| **RxJS Dependency**  | ✅ Yes (optional)       | ❌ No                                  | ❌ No                        |
| **Learning Curve**   | ✅ Low                  | ⚠️ Medium                              | ⚠️ Medium                    |
| **Ecosystem**        | ✅ Mature               | ⚠️ Growing                             | ❌ Experimental              |
| **WCAG 2.2**         | ⚠️ Manual               | ✅ Out-of-box                          | ⚠️ Manual                    |
| **Bundle Size**      | ⚠️ Medium (FormsModule) | ✅ Small (no RxJS)                     | ✅ Small (signals only)      |

---

**Legend**:

- ✅ Excellent support
- ⚠️ Partial support / requires workaround
- ❌ Not supported / missing
- ⏳ Experimental / wait for stable API
