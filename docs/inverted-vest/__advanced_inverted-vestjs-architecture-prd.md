# Product Requirements Document: ngx-vest-forms v3 - Inverted Architecture

## Executive Summary

Transform ngx-vest-forms from an Angular-centric adapter into a **Vest-first, signal-powered** validation solution. This revision embraces Angular 20.3's signal capabilities while maintaining simplicity and removing all unnecessary boilerplate.
This inversion puts Vest.js in control of form state while maintaining seamless integration with Angular's Template-Driven Forms.

## Vision

**From:** Angular Forms → Vest Validation (current v2)
**To:** Vest State → Angular Forms (proposed v3)

The new architecture makes Vest.js the single source of truth for validation state, with Angular forms serving purely as the view layer. This eliminates synchronization complexity, reduces boilerplate, and provides a more intuitive developer experience.

## Core Principles

1. **Vest Owns State**: All validation state lives in Vest, Angular just displays it
2. **Signals First**: Leverage Angular 20.3's signal APIs for all reactivity
3. **Zero Boilerplate**: One function call to set up a form with validation
4. **Progressive Enhancement**: Start simple, add complexity as needed
5. **Type Safety**: Full TypeScript support with inference

## Architecture Overview

### Current v2 Flow (Complex)

```bash
NgForm State → Sync Logic → Vest Suite → Sync Back → NgForm State
     ↓                                                      ↓
Template ← Control Wrapper ← Directives ← Validation ← Errors
```

### Proposed v3 Flow (Simple)

```bash
Vest State (signals) → Template
      ↓
Direct Binding
      ↓
NgForm (optional)
```

## Core Design Decision: Modular, Optional Integration

1. **Separation of Concerns**: Core validation logic remains pure
2. **Progressive Enhancement**: NgForm integration is opt-in
3. **Explicit Over Implicit**: Integration is visible in code
4. **Composable**: Multiple integration strategies available
5. **Vest-First**: Prefer Vest validations and state for form logic if possible.
   a. **Use Vest for Validation**: Always prefer using Vest for validation logic over Angular's built-in validators.
   b. **Dependencies**: Handle form field dependencies directly within Vest suites using `only()`, `omitWhen()` and custom logic.
6. **Two-way binding is acceptable**: Signals handle reactivity properly, so `[(ngModel)]` is fine.

### Recommended Library Structure

```bash
ngx-vest-forms/
├── core/                           # Core functionality (required)
│   ├── create-vest-form.ts         # Main factory function
│   ├── compose-vest-forms.ts       # Form composition utilities
│   ├── types.ts                    # Core interfaces and types
│   ├── path-utils.ts               # Type-safe path operations
│   └── integrations/
│       ├── ngform-sync.ts          # Optional NgForm utilities
│       └── reactive-forms-sync.ts  # Future: ReactiveFormsModule support
├── directives/                     # Optional integration directives
│   ├── vest-sync.directive.ts      # NgForm sync directive
│   └── form-provider.directive.ts  # Form context injection
├── components/                     # UI helper components
│   ├── vest-field.component.ts     # Smart field wrapper
│   ├── field-error.component.ts    # Error display component
│   └── form-debug.component.ts     # Development debugging
├── schemas/                        # Schema integration (optional)
│   ├── zod-adapter.ts              # Zod schema support
│   ├── valibot-adapter.ts          # Valibot schema support
│   └── standard-schema.ts          # StandardSchema interface
├── utils/                          # Advanced utilities (optional)
│   ├── form-arrays.ts              # Dynamic array helpers
│   ├── debounce.ts                 # Validation debouncing
│   ├── history.ts                  # Undo/redo functionality
│   └── async-loaders.ts            # Async initial value loaders
└── testing/                        # Testing utilities
    ├── form-harness.ts             # Component testing helpers
    └── mock-vest-suite.ts          # Mock validation suites
```

### Entry Points & Module Structure

```bash
# Primary entry points for different use cases
ngx-vest-forms/core              # Core: createVestForm, composeVestForms
ngx-vest-forms/control-wrapper        # UI: VestField, FieldError components
ngx-vest-forms/ngform              # Integration: VestSync, FormProvider
ngx-vest-forms/schemas           # Schema: Zod, Valibot adapters
ngx-vest-forms/utils             # Advanced: arrays, history, async
ngx-vest-forms/testing           # Testing: harnesses, mocks
```

### Usage Priority & Progressive Enhancement

#### Level 0: Core Only (90% of cases)

```typescript
import { createVestForm } from 'ngx-vest-forms/core';

const form = createVestForm(suite, { email: '' });
// Pure signals, minimal bundle impact
```

#### Level 1: With UI Components (8% of cases)

```typescript
import { createVestForm } from 'ngx-vest-forms/core';
import { VestField } from 'ngx-vest-forms/components';

const form = createVestForm(suite, initial);
// + Smart field components for better UX
```

#### Level 2: With NgForm Integration (2% of cases)

```typescript
import { createVestForm } from 'ngx-vest-forms/core';
import { VestSyncDirective } from 'ngx-vest-forms/directives';

const form = createVestForm(suite, initial);
// + NgForm compatibility for legacy/enterprise needs
```

#### Level 3: Full Featured (Advanced scenarios)

```typescript
import { createVestForm, composeVestForms } from 'ngx-vest-forms/core';
import { VestField, FormDebug } from 'ngx-vest-forms/components';
import { zodAdapter } from 'ngx-vest-forms/schemas';
import { createFormArray, withHistory } from 'ngx-vest-forms/utils';

// Full-featured forms with composition, schemas, arrays, etc.
```

### 1. Pure Signals: Default, No NgForm

TODO add example and explanation

In this approach, we leverage Angular's signal system to create a form without any dependency on NgForm. This is the simplest and most flexible option.

```ts
import { createVestForm } from 'ngx-vest-forms';
import { signal } from '@angular/core';
import type { StaticSuite } from 'vest';

TODO;
```

### 2. NgForm Integration: Opt-In, Explicit

```ts
@Directive({
  selector: 'form[syncVestToNgForm]',
})
export class VestSyncDirective<T> {
  vestSync = input.required<VestForm<T>>();
  private ngForm = inject(NgForm, { self: true, host: true }); // is host: true needed here?

  constructor() {
    // Sync only when directive is explicitly used
    effect(() => {
      syncVestWithNgForm(this.vestSync(), this.ngForm);
      /// Should we add untracked?
    });
  }
}
```

#### Usage

explicit and visible

```html
<!-- User chooses to add sync -->
<form syncVestToNgForm>
  <!-- form controls -->
</form>

<!-- Or no sync - pure signals -->
<form>
  <!-- form controls -->
</form>
```

#### Sync adapter implementation

The directive delegates to a small helper that mirrors vest state into Angular's control tree. We reuse the v2 pattern (which already handles preserving existing validator errors) but simplify it for the signal-first world:

```ts
export function syncVestWithNgForm<T>(form: VestForm<T>, ngForm: NgForm): void {
  const controlMap = ngForm.controls;

  Object.entries(controlMap).forEach(([path, control]) => {
    effect(() => {
      const errors = form.getErrors(path as Path<T>)();
      const hasErrors = errors.length > 0;

      // Preserve non-vest errors while toggling the vest error bag
      const currentErrors = control.errors ?? {};
      if (hasErrors) {
        control.setErrors({ ...currentErrors, vest: errors });
      } else if (currentErrors.vest) {
        const { vest, ...rest } = currentErrors;
        control.setErrors(Object.keys(rest).length ? rest : null);
      }
    });
  });
}
```

Because the bridge runs inside `effect()`, it stays in sync with every state change. Consumers who never opt into the directive never pay this cost.

#### Why This Approach is Better

1. Cleaner Separation: NgForm integration is isolated in its own module
2. Tree-shakeable: Unused integration code can be eliminated
3. Testable: Each piece can be tested independently
4. Flexible: Users choose their integration level
5. Future-proof: Can add ReactiveFormsModule support the same way

## 3. Two-Way Binding: Embrace It

```html
<!-- YES - This is the recommended approach -->
<input [(ngModel)]="form.value().email" />
```

**Why this works now:**

- Signals handle reactivity properly
- No synchronization issues like v2
- Simpler mental model
- Natural Angular pattern

## Vest Form State Model

The v2 `NgxFormState<TModel>` type already captures the right surface area (value, errors, warnings, status flags, counts, etc.). In v3 we keep the same shape, but expose it as a signal that is recomputed from Vest results. No manual `markTouched()` or `markAllTouched()` APIs are required—the form tracks interaction state automatically via signal updates (value diffs, submission attempts, blur/change events based on the chosen visibility strategy).

```ts
export interface VestFormState<TModel> {
  value: TModel;
  errors: Readonly<Record<string, readonly string[]>>;
  warnings: Readonly<Record<string, readonly string[]>>;
  root?: {
    errors?: readonly string[];
    warnings?: readonly string[];
    internalError?: string;
  } | null;
  status: 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED';
  dirty: boolean;
  valid: boolean;
  invalid: boolean;
  pending: boolean;
  disabled: boolean;
  idle: boolean;
  submitted: boolean;
  errorCount: number;
  warningCount: number;
  firstInvalidField?: string | null;
  touchedPaths: readonly string[]; // derived from signal activity, read-only API
}
```

```ts
const formState = computed<VestFormState<TModel>>(() => {
  const result = suiteResult();
  const value = model();

  return {
    value,
    errors: result.getErrors(),
    warnings: result.getWarnings?.() ?? {},
    status: deriveStatus(result, disabled()),
    dirty:
      dirty() ||
      value !== initialValue || // structuredClone compare, same approach as v2
      hasPatched(),
    valid: result.isValid() && !result.isPending(),
    invalid: !result.isValid(),
    pending: result.isPending(),
    disabled: disabled(),
    idle: !result.isPending() && !disabled(),
    submitted: submitted(),
    errorCount: countMessages(result.getErrors()),
    warningCount: countMessages(result.getWarnings?.() ?? {}),
    firstInvalidField: findFirstError(result),
    touchedPaths: touchedPaths(), // automatically maintained, no imperative API needed
  } satisfies VestFormState<TModel>;
});
```

Key goals:

- **Backward compatibility**: Consumers migrating from v2 can reuse existing `formState()` access patterns.
- **Signals-first**: `formState` is memoized; derived booleans like `valid()` are just `computed` wrappers around it.
- **No imperative touch API**: Touch information is inferred—e.g. a field is considered touched once a blur/change event fires or when submit is attempted. The display strategy is configurable (immediate / dirty / submitted) and managed internally.

## 4. Schema Validation: Optional But Integrated

```typescript
// Option A: Pure TypeScript types (default)
const form = createVestForm<UserModel>(suite, initial);

// Option B: With runtime schema validation
const form = createVestForm(suite, initial, {
  schema: userSchema, // Zod, Valibot, ArkType via StandardSchema
});
```

## 5. UI Helper Components: Optional but Powerful

### VestField Component (Smart Field Wrapper)

The `VestField` component reduces boilerplate and provides consistent styling, error handling, and accessibility features.

```typescript
// Located in ngx-vest-forms/components
@Component({
  selector: 'vest-field',
  template: `
    <div
      class="vest-field"
      [class.has-error]="field().showErrors"
      [class.is-pending]="field().pending"
      [class.is-touched]="field().touched"
      [class.is-dirty]="field().dirty"
    >
      <!-- Label content -->
      <ng-content select="[slot=label]" />

      <!-- Input content -->
      <div class="field-input">
        <ng-content />
      </div>

      <!-- Error display with accessibility -->
      @if (field().showErrors && field().errors.length) {
        <div class="field-errors" role="alert" [attr.aria-live]="'polite'">
          @for (error of field().errors; track error) {
            <span class="error-message">{{ error }}</span>
          }
        </div>
      }

      <!-- Optional validation state indicator -->
      @if (field().pending) {
        <div class="validation-spinner" aria-label="Validating...">
          <span class="sr-only">Validating field</span>
        </div>
      }
    </div>
  `,
  styleUrls: ['./vest-field.component.css'],
})
export class VestFieldComponent {
  // Can work with or without form context
  form = input<VestForm<any>>();
  name = input.required<string>();

  // Computed field state
  field = computed(() => {
    const formInstance =
      this.form() || inject(VEST_FORM_TOKEN, { optional: true });
    if (!formInstance) {
      throw new Error(
        'VestField requires either [form] input or VEST_FORM_TOKEN provider',
      );
    }
    return formInstance.fieldState(this.name());
  });
}
```

#### Usage Patterns

**Option A: Direct form binding**

```html
<vest-field [form]="form" name="email">
  <label slot="label" for="email">Email Address *</label>
  <input id="email" [(ngModel)]="form.value().email" type="email" />
</vest-field>
```

**Option B: With form context (cleaner for multiple fields)**

```html
<form [vestFormProvider]="form">
  <vest-field name="email">
    <label slot="label" for="email">Email Address *</label>
    <input id="email" [(ngModel)]="form.value().email" type="email" />
  </vest-field>

  <vest-field name="password">
    <label slot="label" for="password">Password *</label>
    <input id="password" [(ngModel)]="form.value().password" type="password" />
  </vest-field>
</form>
```

### FormProvider Directive (Context Injection)

```typescript
// Located in ngx-vest-forms/directives
@Directive({
  selector: '[vestFormProvider]',

  providers: [
    {
      provide: VEST_FORM_TOKEN,
      useFactory: () => inject(FormProviderDirective).vestFormProvider(),
    },
  ],
})
export class FormProviderDirective {
  vestFormProvider = input.required<VestForm<any>>();
}
```

### FieldError Component (Standalone Error Display)

For cases where you want more control over error placement:

```typescript
@Component({
  selector: 'vest-field-error',
  template: `
    @if (shouldShow()) {
      <div class="field-error" role="alert" [attr.aria-live]="'polite'">
        @for (error of errors(); track error) {
          <span class="error-message">{{ error }}</span>
        }
      </div>
    }
  `,
})
export class FieldErrorComponent {
  form = input.required<VestForm<any>>();
  name = input.required<string>();

  errors = computed(() => this.form().getErrors(this.name())());
  shouldShow = computed(() => this.form().shouldShowError(this.name())());
}
```

### FormDebug Component (Development Tool)

```typescript
@Component({
  selector: 'vest-form-debug',
  template: `
    @if (isDevMode()) {
      <details class="form-debug">
        <summary>🐛 Form Debug Info</summary>
        <pre>{{ debugInfo() | json }}</pre>
      </details>
    }
  `,
})
export class FormDebugComponent {
  form = input.required<VestForm<any>>();

  debugInfo = computed(() => ({
    value: this.form().value(),
    errors: this.form().errors(),
    valid: this.form().valid(),
    pending: this.form().pending(),
    touched: Array.from(this.form().touched()),
    readonly: this.form().readonly(),
  }));
}
```

### Benefits of UI Components

1. **Consistent UX**: Standardized field styling and behavior
2. **Accessibility**: Built-in ARIA attributes and screen reader support
3. **Less Boilerplate**: Automatic error display and validation states
4. **Customizable**: Styled with CSS, extensible via content projection
5. **Optional**: Use only what you need, tree-shakeable
6. **Context-Aware**: Works with form injection for cleaner templates

## Core API: The 90% Solution - Just `createVestForm`

### Emphasize Simplicity First

For **90% of all forms**, you only need this:

```typescript
// This is ALL you need for most forms:
const form = createVestForm(suite, initialValue);
```

**That's it.** No directives, no NgForm, no complexity. Just:

- Pass your Vest suite
- Pass your initial value
- Get back a fully reactive form

### Complete Minimal Example

```typescript
@Component({
  template: `
    <form (ngSubmit)="handleSubmit()">
      <input [(ngModel)]="form.value().email" />
      @if (form.showErrors('email')()) {
        <span>{{ form.getError('email')() }}</span>
      }
      <button [disabled]="!form.valid()">Submit</button>
    </form>
  `,
})
export class SimpleFormComponent {
  form = createVestForm(emailSuite, { email: '' });

  async handleSubmit() {
    const result = await this.form.submit();
    if (result.valid) {
      // Done! No template refs, no directives.
    }
  }
}
```

**No template references. No directives. Just signals.**

## API Design: Start Simple, Add When Needed

### The 90% Solution - Just `createVestForm`

```typescript
// This handles most forms
const form = createVestForm(suite, initialValue);
```

**No directives. No template refs. No NgForm.** Just a function that returns a reactive form.

### Progressive Complexity Levels

#### Level 0: Pure Signals (90% of cases)

```typescript
const form = createVestForm(suite, { email: '' });
// That's it. Use it directly in templates.
```

#### Level 1: With Options (8% of cases)

```typescript
const form = createVestForm(suite, initial, {
  errorDisplay: 'touched', // or 'immediate', 'dirty', 'submitted'
  validateOn: 'blur', // or 'change', 'submit'
  debounceMs: 300,
});
```

#### Level 2: NgForm Integration (2% of cases)

```typescript
// Only when you need NgForm features
@Component({
  template: `
    <form [vestSync]="form">
      <!-- Now NgForm features work -->
    </form>
  `,
})
export class FormWithNgForm {
  form = createVestForm(suite, initial);
}
```

### Why No Template Reference?

The `createVestForm` function returns the form directly. You don't need `#form="ngForm"` because:

- The form object is created in your component
- All state is accessible via signals
- No template gymnastics needed
- Cleaner, more testable code

## Advanced API Design

### Core Function with Smart Defaults

```typescript
import { createVestForm } from 'ngx-vest-forms';
import { signal, computed, effect, linkedSignal } from '@angular/core';
import type { StaticSuite } from 'vest';

// Type-safe path utilities (from ngx-minivest)
export type Path<T> = T extends object
  ? {
      [K in keyof T & string]:
        | K
        | (T[K] extends object ? `${K}.${Path<T[K]>}` : K);
    }[keyof T & string]
  : never;

export type PathValue<T, P extends Path<T>> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? Rest extends Path<T[K]>
        ? PathValue<T[K], Rest>
        : never
      : never
    : never;

interface VestFormOptions<T> {
  // Optional schema for runtime validation
  schema?: StandardSchema<T>;

  // Validation timing (default: 'blur')
  validateOn?: 'blur' | 'change' | 'submit' | 'manual';

  // Debounce for 'change' mode (default: 300ms)
  debounceMs?: number;

  // Show errors immediately or after interaction (default: 'afterBlur')
  showErrorsOn?: 'immediately' | 'afterBlur' | 'afterSubmit';
  // OR
  // Simpler, clearer naming
  // errorDisplay: 'immediate' | 'after-blur' | 'after-submit' | 'after-blur-or-submit';

  // Optional features
  metadata?: Record<Path<T>, FieldMetadata>;
}

interface VestForm<T> {
  // Core state
  value: Signal<T>; // Smart: WritableSignal if input was writable

  // Validation result from Vest
  result: Signal<SuiteResult>;

  // Computed states
  errors: Signal<Record<string, string[]>>;
  warnings: Signal<Record<string, string[]>>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  pending: Signal<boolean>;
  dirty: Signal<boolean>;
  pristine: Signal<boolean>;

  // Interaction tracking
  touchedPaths: Signal<readonly string[]>; // maintained internally, read-only surface
  submitted: Signal<boolean>;

  // Smart mutation actions (auto-disabled for read-only signals)
  setValue: (path: Path<T>, value: PathValue<T, Path<T>>) => void;
  patchValue: (partial: Partial<T>) => void;
  reset: (value?: T) => void;

  // Always available actions
  validate: (field?: Path<T>) => Promise<SuiteResult>;
  submit: () => Promise<{
    valid: boolean;
    value: T;
    errors: Record<string, string[]>;
  }>;

  // Simplified error access (inspired by ngx-minivest)
  getError: (path: Path<T>) => Signal<string | null>; // First error only
  getErrors: (path: Path<T>) => Signal<string[]>; // All errors
  hasError: (path: Path<T>) => Signal<boolean>; // Has any error

  // Simplified warning access
  getWarning: (path: Path<T>) => Signal<string | null>; // First warning
  getWarnings: (path: Path<T>) => Signal<string[]>; // All warnings
  hasWarning: (path: Path<T>) => Signal<boolean>; // Has any warning

  // Touch-aware error display (inspired by ngx-minivest)
  showErrors: (path?: Path<T>) => Signal<boolean>;
  shouldShowError: (path: Path<T>) => Signal<boolean>;

  // State introspection
  readonly: Signal<boolean>; // True if value signal is read-only
  fieldState: (path: Path<T>) => Signal<FieldState>;
}

interface FieldState {
  value: any;
  errors: string[];
  warnings: string[];
  valid: boolean;
  pending: boolean;
  touched: boolean; // exposed for convenience, derived from touchedPaths
  dirty: boolean;
  showErrors: boolean;
}
```

### Implementation Example

```typescript
// Helper functions for path operations (from ngx-minivest)
function getValueByPath<T, P extends Path<T>>(
  obj: T,
  path: P,
): PathValue<T, P> {
  const keys = (path as string).split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current == null) return undefined as any;
    current = current[key];
  }

  return current;
}

function setValueByPath<T, P extends Path<T>>(
  obj: T,
  path: P,
  value: PathValue<T, P>,
): T {
  const keys = (path as string).split('.');
  const result = { ...obj };
  let current: any = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    } else {
      current[key] = { ...current[key] };
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

function isWritableSignal<T>(signal: Signal<T>): signal is WritableSignal<T> {
  return (
    'set' in signal && typeof (signal as WritableSignal<T>).set === 'function'
  );
}

export function createVestForm<T>(
  suite: StaticSuite<T>,
  initialValue: T | Signal<T>,
  options: VestFormOptions<T> = {},
): VestForm<T> {
  const {
    schema,
    validateOn = 'blur',
    debounceMs = 300,
    errorDisplay = 'touched',
  } = options;

  // Smart signal detection (inspired by ngx-minivest)
  const valueSignal = isSignal(initialValue)
    ? initialValue
    : signal(initialValue);

  const isWritable = isWritableSignal(valueSignal);

  // Core state
  const touched = signal(new Set<string>());
  const submitted = signal(false);
  const ngForm = signal<NgForm | undefined>(undefined);

  // Validation with linkedSignal
  const result = linkedSignal(() => {
    const currentValue = valueSignal();

    // Optional schema validation first
    if (schema) {
      const schemaResult = schema.parse(currentValue);
      if (!schemaResult.success) {
        // Convert schema errors to Vest format
        return convertSchemaErrorsToVest(schemaResult.errors);
      }
    }

    return suite(currentValue);
  });

  // Computed states
  const errors = computed(() => result().getErrors());
  const valid = computed(() => result().isValid() && !result().isPending());
  const pending = computed(() => result().isPending());

  // Auto-disable mutations for read-only signals (inspired by ngx-minivest)
  const setValue = isWritable
    ? (path: Path<T>, value: PathValue<T, Path<T>>) => {
        valueSignal.update((v) => setValueByPath(v, path, value));
      }
    : (path: Path<T>, value: PathValue<T, Path<T>>) => {
        if (isDevMode()) {
          console.warn(
            `Cannot setValue on read-only signal at path: ${path}. ` +
              `Pass a WritableSignal or plain value to enable mutations.`,
          );
        }
      };

  // Touch-aware error display (inspired by ngx-minivest)
  const shouldShowError = (path: Path<T>) =>
    computed(() => {
      const pathStr = path as string;
      const hasErr = result().hasErrors(pathStr);

      if (!hasErr) return false;

      // If NgForm is connected, use its touched state
      if (ngForm()) {
        const control = ngForm()?.form.get(pathStr);
        return control?.touched ?? false;
      }

      // Otherwise use our tracking
      switch (errorDisplay) {
        case 'immediate':
          return true;
        case 'touched':
          return touched().has(pathStr);
        case 'dirty':
          return dirty().has(pathStr);
        case 'submitted':
          return submitted();
        default:
          return touched().has(pathStr) || submitted();
      }
    });

  // Simplified error access (inspired by ngx-minivest)
  const getError = (path: Path<T>) =>
    computed(() => {
      const errors = result().getErrors()[path as string];
      return errors?.[0] || null;
    });

  return {
    value: valueSignal,
    result,
    errors,
    valid,
    pending,
    readonly: computed(() => !isWritable),
    setValue,
    getError,
    shouldShowError,
    showErrors: (path?: Path<T>) =>
      path ? shouldShowError(path) : computed(() => submitted()),

    // Allow external NgForm connection
    connectNgForm: (form: NgForm) => {
      ngForm.set(form);
    },
    // ... other properties and methods

    setValue: (path, val) => {
      value.update((v) => setValueByPath(v, path, val));
      if (validateOn === 'change') {
        debounce(() => suite(value(), path), debounceMs);
      }
    },

    submit: async () => {
      submitted.set(true);
      const res = await suite(value());
      return {
        valid: res.isValid(),
        value: value(),
        errors: res.getErrors(),
      };
    },

    showErrors,
    fieldState,
    getError: (path) =>
      computed(() => {
        const errs = errors()[path];
        return errs?.length ? errs[0] : null;
      }),
  };
}
```

#### Usage Examples

##### 1. Minimal Setup (Most Common)

```typescript
@Component({
  template: `
    <form (ngSubmit)="handleSubmit()">
      <div>
        <input [(ngModel)]="form.value().email" />

        @if (form.showErrors('email')()) {
          <span class="error">{{ form.getError('email')() }}</span>
        }
      </div>

      <button [disabled]="form.invalid()">Submit</button>
    </form>
  `,
})
export class SimpleFormComponent {
  form = createVestForm(emailSuite, { email: '' }, { errorDisplay: 'dirty' });

  async handleSubmit() {
    const result = await this.form.submit();
    if (result.valid) {
      // Process result.value
    }
  }
}
```

### 2. With Field Helper Component

Instead of passing the form to each control, we could use Angular's injection context to provide the form to child components.

```typescript
@Component({
  selector: 'vest-field',
  template: `
    <div [class.error]="state().showErrors">
      <ng-content select="[label]"></ng-content>
      <ng-content></ng-content>

      @if (state().showErrors && state().errors.length) {
        <span class="error" role="alert">
          {{ state().errors[0] }}
        </span>
      }
    </div>
  `,
})
export class VestFieldComponent {
  name = input.required<string>();
  private form = inject(VEST_FORM_TOKEN); // Injected from parent

  field = computed(() => this.form.fieldState(this.name()));
}
```

Usage:

```ts
// Provide form at parent level
@Component({
  template: `
    <form [vestForm]="form">
      <!-- No need to pass form to each field -->
      <vest-field name="email">
        <label for="email">Email</label>
        <input id="email" [(ngModel)]="form.value().email" />
      </vest-field>
    </form>
  `,
})
export class FormComponent {
  form = createVestForm(suite, initial);
}
```

### 3. Advanced: With Schema Validation

```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

@Component({
  template: `...`,
})
export class SchemaFormComponent {
  form = createVestForm(
    userSuite,
    { email: '', age: 0 },
    {
      schema: userSchema,
      validateOn: 'change',
      debounceMs: 500,
    },
  );
}
```

## NgForm Integration: Only When You Need It

### When Would You Need NgForm?

NgForm integration is **completely optional** and only needed for:

1. **Legacy Migration**: Gradually migrating existing NgForm-based code
2. **Third-party Components**: Some Angular libraries expect NgForm
3. **Enterprise Requirements**: Specific tooling that depends on NgForm
4. **Advanced Angular Features**: Like `ngSubmit` with form validity

### Clean Separation with Optional Directive

```typescript
// Pure approach (recommended - 90% of cases)
@Component({
  template: `
    <form (ngSubmit)="handleSubmit()">
      <!-- Pure signals, no NgForm -->
    </form>
  `,
})
export class PureFormComponent {
  form = createVestForm(suite, initial);
}

// With NgForm integration (only when needed)
@Component({
  template: `
    <form [vestSync]="form" (ngSubmit)="handleSubmit()">
      <!-- NgForm features available -->
    </form>
  `,
})
export class NgFormIntegratedComponent {
  form = createVestForm(suite, initial);
}
```

The directive approach is cleaner because:

- **Explicit**: You can see when NgForm sync is active
- **Tree-shakeable**: No NgForm code if not used
- **Testable**: Easy to test with/without NgForm
- **Maintainable**: NgForm logic isolated in one place

### VestSync Directive Implementation

```typescript
@Directive({
  selector: 'form[vestSync]',
})
export class VestSyncDirective<T> {
  vestSync = input.required<VestForm<T>>();
  private ngForm = inject(NgForm, { self: true, host: true });

  constructor() {
    // Only sync when directive is explicitly used
    effect(() => {
      this.syncValidationErrorsToNgForm(this.ngForm, this.vestSync().result());
    });

    // Connect the form for touch state awareness
    this.vestSync().connectNgForm(this.ngForm);
  }

  private syncValidationErrorsToNgForm(ngForm: NgForm, vestResult: any): void {
    const form = ngForm.form;

    // Set validation errors directly from Vest.js results (inspired by ngx-minivest)
    Object.keys(form.controls).forEach((fieldName) => {
      const control = form.get(fieldName);
      if (control) {
        if (vestResult.hasErrors(fieldName)) {
          const errors = vestResult.getErrors(fieldName);
          // Use 'vest' as the error key with the actual error message as the value
          control.setErrors({ vest: errors[0] || 'Validation failed' });
        } else {
          control.setErrors(null);
        }
      }
    });
  }
}
```

## Key Features: Smart Defaults & Auto-Detection

### Automatic Read-Only Detection

The library automatically detects and adapts:

- **Read-only signals**: `setValue` disabled with dev warning
- **Missing NgForm**: Falls back to immediate error display
- **Computed signals**: Validation-only mode (no mutations)
- **Development mode**: Enhanced warnings and debugging

```typescript
// With computed signal (read-only)
const derivedData = computed(() => /* some computation */);
const form = createVestForm(suite, derivedData);
// form.setValue() will warn but not crash
// form.readonly() === true

// With writable signal
const editableData = signal({ email: '' });
const form = createVestForm(suite, editableData);
// form.setValue() works normally
// form.readonly() === false
```

### Simplified Error Structure

Clean error access inspired by ngx-minivest:

```typescript
// In templates - super clean
{
  {
    form.getError('email')();
  }
} // First error only
{
  {
    form.hasError('email')();
  }
} // Boolean check

// All errors if needed
{
  {
    form.getErrors('email')();
  }
} // Array of strings
```

### Touch-Aware Error Display

Smart error timing with multiple strategies:

```typescript
// Automatic touch state detection
form.shouldShowError('email')()  // Considers touched state

// With NgForm integration
<form [vestSync]="form">
  <!-- Uses NgForm's touched state automatically -->
</form>

// Without NgForm
// Falls back to internal touched tracking
```

### Type-Safe Path Utilities

Full TypeScript inference for nested object paths:

```typescript
interface UserForm {
  profile: {
    address: {
      street: string;
      city: string;
    };
  };
}

const form = createVestForm<UserForm>(suite, initial);

// TypeScript knows these paths exist and their types
form.setValue('profile.address.street', '123 Main'); // ✅
form.setValue('profile.address.invalid', 'value'); // ❌ Type error

const street = form.getValue('profile.address.street'); // string
```

## Optional Features / Improvements

### 1. Form Arrays

- [ ] Add support for dynamic arrays of fields
- [ ] Dedicated helpers for adding/removing items
- [ ] Signal-based array state
- [ ] Type-safe indexing

Why These Utilities Help
Without array utilities, you'd need to:

- Manually update the entire form value
- Re-index validation paths when items are removed
- Handle touched/dirty state for array items
- The utilities handle this complexity automatically.

```ts
interface VestForm<T> {
  // ... existing
  array: {
    push(path: Path<T>, item: any): void;
    remove(path: Path<T>, index: number): void;
    move(path: Path<T>, from: number, to: number): void;
    fields(path: Path<T>): Signal<FieldState[]>;
  };
}

// Usage
form.array.push('items', { name: '', quantity: 0 });
form.array.remove('items', index);
```

#### Usage

```ts
// Phone numbers example
interface ContactForm {
  name: string;
  phones: Array<{ type: 'mobile' | 'home' | 'work'; number: string }>;
}

@Component({
  template: `
    <form>
      <h3>Phone Numbers</h3>

      @for (phone of form.value().phones; track phone; let i = $index) {
        <div class="phone-row">
          <select [(ngModel)]="phone.type">
            <option value="mobile">Mobile</option>
            <option value="home">Home</option>
            <option value="work">Work</option>
          </select>

          <input [(ngModel)]="phone.number" />

          @if (form.getError('phones.' + i + '.number')()) {
            <span class="error">{{
              form.getError('phones.' + i + '.number')()
            }}</span>
          }

          <button (click)="removePhone(i)">Remove</button>
        </div>
      }

      <button (click)="addPhone()">Add Phone</button>
    </form>
  `,
})
export class ContactFormComponent {
  form = createVestForm(
    phoneValidationSuite,
    {
      name: '',
      phones: [{ type: 'mobile', number: '' }],
    },
    { errorDisplay: 'dirty' },
  );

  addPhone() {
    this.form.array.push('phones', { type: 'mobile', number: '' });
  }

  removePhone(index: number) {
    this.form.array.remove('phones', index);
  }
}

// Validation suite
const phoneValidationSuite = staticSuite((data, field) => {
  only(field);

  // Validate each phone dynamically
  data.phones?.forEach((phone, index) => {
    test(`phones.${index}.number`, 'Phone number required', () => {
      enforce(phone.number).isNotEmpty();
    });

    test(`phones.${index}.number`, 'Invalid phone format', () => {
      enforce(phone.number).matches(/^\+?[\d\s\-\(\)]+$/);
    });
  });
});
```

### 2. Nested Objects

- [ ] Support for deeply nested object structures
- [ ] Type-safe path utilities
- [ ] Helpers for nested field state
- [ ] Examples and documentation

```ts
// Automatic path completion
form.setValue('address.billing.street', '123 Main');
form.fieldState('address.billing.street');

// Group validation
form.validateGroup('address.billing');
```

### 3. Built-in Debouncing

```ts
const form = createVestForm(suite, initial, {
  validateOn: 'change',
  debounceMs: 300, // Per-form debounce
  fieldDebounce: {
    search: 500, // Field-specific
    email: 100,
  },
});
```

### 4. Form reset with History

```ts
interface VestForm<T> {
  history: {
    canUndo: Signal<boolean>;
    canRedo: Signal<boolean>;
    undo(): void;
    redo(): void;
    checkpoint(): void; // Save current state
  };
}
```

### 5. Async initial Values

```ts
const form = await createVestFormAsync(
  suite,
  () => userService.load(id), // Returns Promise<T>
  options,
);

// Or lazy loading
const form = createVestForm(suite, {});
await form.loadInitial(() => userService.load(id));
```

6. Form Composition

Benefits of Composition:

- Each step has isolated validation
- Can validate individual steps or entire form
- Maintains separate state per step
- Easy to add/remove steps
- Type-safe composed result

- [ ] Support composing multiple Vest forms into one
- [ ] Unified API for validation and submission
- [ ] Type-safe composition
- [ ] Examples and documentation

```ts
const personalForm = createVestForm(personalSuite, personalData);
const addressForm = createVestForm(addressSuite, addressData);

const composedForm = composeVestForms({
  personal: personalForm,
  address: addressForm,
});

// Unified API
composedForm.valid(); // All forms valid
composedForm.submit(); // Submit all
```

### Usage

```ts
// Step 1: Personal Info
const personalForm = createVestForm(personalSuite, {
  firstName: '',
  lastName: '',
  email: '',
});

// Step 2: Address
const addressForm = createVestForm(addressSuite, {
  street: '',
  city: '',
  postalCode: '',
});

// Step 3: Payment
const paymentForm = createVestForm(paymentSuite, {
  cardNumber: '',
  expiryDate: '',
  cvv: '',
});

// Composed wizard form
const wizardForm = composeVestForms({
  personal: personalForm,
  address: addressForm,
  payment: paymentForm,
});

@Component({
  template: `
    <div class="wizard">
      <!-- Progress indicator -->
      <div class="steps">
        <div [class.active]="currentStep === 0">Personal</div>
        <div [class.active]="currentStep === 1">Address</div>
        <div [class.active]="currentStep === 2">Payment</div>
      </div>

      <!-- Step content -->
      @switch (currentStep) {
        @case (0) {
          <personal-step [form]="wizardForm.forms.personal" />
        }
        @case (1) {
          <address-step [form]="wizardForm.forms.address" />
        }
        @case (2) {
          <payment-step [form]="wizardForm.forms.payment" />
        }
      }

      <!-- Navigation -->
      <button (click)="previousStep()" [disabled]="currentStep === 0">
        Previous
      </button>

      <button (click)="nextStep()" [disabled]="!canProceed()">
        {{ currentStep === 2 ? 'Submit' : 'Next' }}
      </button>
    </div>
  `,
})
export class WizardComponent {
  currentStep = signal(0);
  wizardForm = composeVestForms({ personal, address, payment });

  canProceed = computed(() => {
    switch (this.currentStep()) {
      case 0:
        return this.wizardForm.forms.personal.valid();
      case 1:
        return this.wizardForm.forms.address.valid();
      case 2:
        return this.wizardForm.valid(); // All forms valid
    }
  });

  async nextStep() {
    if (this.currentStep() === 2) {
      // Submit all forms
      const result = await this.wizardForm.submit();
      if (result.valid) {
        // Process complete form data
        console.log(result.value); // { personal: {...}, address: {...}, payment: {...} }
      }
    } else {
      this.currentStep.update((s) => s + 1);
    }
  }
}
```

### Lazy-Loaded Wizard Steps Example

For large applications with complex multi-step forms, you can lazy load each step component for better performance and smaller initial bundles:

```typescript
import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { createVestForm, composeVestForms } from 'ngx-vest-forms/core';

@Component({
  selector: 'app-lazy-wizard',
  template: `
    <div class="wizard">
      <nav class="wizard-nav">
        <!-- Step indicators with progress -->
        @for (step of steps(); let i = $index) {
          <button
            [class.active]="currentStep() === i"
            [class.completed]="isStepCompleted(i)"
            [class.disabled]="!canNavigateToStep(i)"
            (click)="goToStep(i)"
            [attr.aria-current]="currentStep() === i ? 'step' : null"
          >
            <span class="step-number">{{ i + 1 }}</span>
            <span class="step-label">{{ step.label }}</span>
          </button>
        }
      </nav>

      <!-- Lazy load each step component -->
      <main class="wizard-content" role="main">
        @switch (currentStep()) {
          @case (0) {
            @defer (on immediate) {
              <personal-step [form]="wizardForm.forms.personal" />
            } @loading {
              <div class="loading" aria-live="polite">
                Loading personal information step...
              </div>
            } @error {
              <div class="error" role="alert">
                Failed to load step. Please try again.
              </div>
            }
          }
          @case (1) {
            @defer (on immediate) {
              <address-step [form]="wizardForm.forms.address" />
            } @loading {
              <div class="loading" aria-live="polite">
                Loading address step...
              </div>
            } @error {
              <div class="error" role="alert">
                Failed to load step. Please try again.
              </div>
            }
          }
          @case (2) {
            @defer (on immediate) {
              <payment-step [form]="wizardForm.forms.payment" />
            } @loading {
              <div class="loading" aria-live="polite">
                Loading payment step...
              </div>
            } @error {
              <div class="error" role="alert">
                Failed to load step. Please try again.
              </div>
            }
          }
        }
      </main>

      <!-- Accessible navigation controls -->
      <footer class="wizard-actions">
        <button
          type="button"
          (click)="previousStep()"
          [disabled]="currentStep() === 0"
          [attr.aria-label]="
            'Go to previous step: ' +
            (currentStep() > 0 ? steps()[currentStep() - 1].label : '')
          "
        >
          <span aria-hidden="true">←</span> Previous
        </button>

        <button
          type="button"
          (click)="nextStep()"
          [disabled]="!canProceed()"
          [attr.aria-label]="
            isLastStep()
              ? 'Submit form'
              : 'Go to next step: ' + steps()[currentStep() + 1]?.label
          "
        >
          {{ isLastStep() ? 'Submit Order' : 'Next' }}
          <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    // Lazy import step components - they'll be loaded on demand
    () =>
      import('./steps/personal-step.component').then(
        (m) => m.PersonalStepComponent,
      ),
    () =>
      import('./steps/address-step.component').then(
        (m) => m.AddressStepComponent,
      ),
    () =>
      import('./steps/payment-step.component').then(
        (m) => m.PaymentStepComponent,
      ),
  ],
})
export class LazyWizardComponent {
  currentStep = signal(0);

  steps = signal([
    { label: 'Personal Information', key: 'personal' },
    { label: 'Shipping Address', key: 'address' },
    { label: 'Payment Details', key: 'payment' },
  ]);

  // Each form is created independently with its own validation suite
  personalForm = createVestForm(personalValidationSuite, {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  addressForm = createVestForm(addressValidationSuite, {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });

  paymentForm = createVestForm(paymentValidationSuite, {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  });

  // Compose all forms into a unified wizard form
  wizardForm = composeVestForms({
    personal: this.personalForm,
    address: this.addressForm,
    payment: this.paymentForm,
  });

  // Computed properties for UI state
  canProceed = computed(() => {
    switch (this.currentStep()) {
      case 0:
        return this.personalForm.valid();
      case 1:
        return this.addressForm.valid();
      case 2:
        return this.wizardForm.valid(); // All forms must be valid for final submit
      default:
        return false;
    }
  });

  isLastStep = computed(() => this.currentStep() === this.steps().length - 1);

  isStepCompleted = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return this.personalForm.valid()();
      case 1:
        return this.addressForm.valid()();
      case 2:
        return this.paymentForm.valid()();
      default:
        return false;
    }
  };

  canNavigateToStep = (stepIndex: number): boolean => {
    // Users can only navigate to current step or previously completed steps
    if (stepIndex <= this.currentStep()) return true;

    // Or if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!this.isStepCompleted(i)) return false;
    }
    return true;
  };

  // Navigation methods
  goToStep(stepIndex: number): void {
    if (this.canNavigateToStep(stepIndex)) {
      this.currentStep.set(stepIndex);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((step) => step - 1);
    }
  }

  async nextStep(): Promise<void> {
    if (this.isLastStep()) {
      // Submit the entire wizard
      const result = await this.wizardForm.submit();

      if (result.valid) {
        // Process the complete form data
        console.log('Order submitted:', result.value);
        // result.value structure: { personal: {...}, address: {...}, payment: {...} }

        // Navigate to success page or show confirmation
        this.handleSuccessfulSubmission(result.value);
      } else {
        // Handle validation errors across all forms
        console.error('Validation errors:', result.errors);
        this.handleValidationErrors(result.errors);
      }
    } else if (this.canProceed()) {
      // Move to next step
      this.currentStep.update((step) => step + 1);
    }
  }

  private handleSuccessfulSubmission(orderData: any): void {
    // Implementation depends on your app's navigation/state management
    // router.navigate(['/order-confirmation'], { state: { order: orderData } });
  }

  private handleValidationErrors(errors: Record<string, string[]>): void {
    // Find first step with errors and navigate there
    if (
      errors.personal ||
      Object.keys(errors).some((key) => key.startsWith('personal.'))
    ) {
      this.currentStep.set(0);
    } else if (
      errors.address ||
      Object.keys(errors).some((key) => key.startsWith('address.'))
    ) {
      this.currentStep.set(1);
    } else if (
      errors.payment ||
      Object.keys(errors).some((key) => key.startsWith('payment.'))
    ) {
      this.currentStep.set(2);
    }
  }
}
```

#### Individual Step Components

Each step is a standalone component that receives its form instance:

```typescript
// personal-step.component.ts
@Component({
  selector: 'personal-step',
  template: `
    <fieldset>
      <legend>Personal Information</legend>

      <div class="form-grid">
        <vest-field name="firstName">
          <label for="firstName">First Name *</label>
          <input id="firstName" [(ngModel)]="form.value().firstName" required />
        </vest-field>

        <vest-field name="lastName">
          <label for="lastName">Last Name *</label>
          <input id="lastName" [(ngModel)]="form.value().lastName" required />
        </vest-field>

        <vest-field name="email">
          <label for="email">Email Address *</label>
          <input
            id="email"
            type="email"
            [(ngModel)]="form.value().email"
            required
          />
        </vest-field>

        <vest-field name="phone">
          <label for="phone">Phone Number</label>
          <input id="phone" type="tel" [(ngModel)]="form.value().phone" />
        </vest-field>
      </div>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VestFieldComponent, FormsModule],
})
export class PersonalStepComponent {
  form = input.required<VestForm<PersonalInfo>>();
}
```

#### Key Benefits of This Approach

1. **Performance**: Each step component is only loaded when needed
2. **Bundle Splitting**: Webpack automatically creates separate chunks for each step
3. **State Preservation**: Form state is maintained in the parent component, so switching steps doesn't lose data
4. **Accessibility**: Proper ARIA attributes, focus management, and screen reader support
5. **User Experience**: Loading states and error handling for failed lazy loads
6. **Type Safety**: Each step receives a properly typed form instance
7. **Scalability**: Easy to add/remove steps without affecting other parts

#### Form State Management

- **Individual Forms**: Each step manages its own validation and state via `createVestForm`
- **Composed State**: `composeVestForms` provides unified access to all form data and validation status
- **Persistent State**: Since forms live in the parent component, state persists when navigating between steps
- **Independent Validation**: Each step can be validated independently, allowing users to complete steps in any order (if business logic allows)

This pattern scales well for complex applications and provides excellent user experience with proper loading states and accessibility support.

## Migration Utilities 🔄

### Tasks

- [ ] Create v2 → v3 migration guide
- [ ] Provide codemods for automatic conversion
- [ ] Add deprecation warnings for v2 patterns
- [ ] Create migration testing utilities
- [ ] Build compatibility layer for gradual migration (optional)

## Feature Comparison Checklist

### Current v2 Features → v3 Implementation

| Feature                  | v2 Status           | v3 Approach                       | Priority |
| ------------------------ | ------------------- | --------------------------------- | -------- |
| **Core Validation**      |
| Field validation         | ✅ Directive-based  | ✅ Signal-based                   | P0       |
| Async validation         | ✅ Complex sync     | ✅ Native with signals            | P0       |
| Cross-field validation   | ✅ ROOT_FORM        | ✅ Direct in suite                | P0       |
| Warning tests            | ✅ Supported        | ✅ Computed signal                | P1       |
| **Form State**           |
| Dirty tracking           | ✅ NgForm based     | ✅ Signal-based                   | P0       |
| Touched tracking         | ✅ NgForm based     | ✅ Signal set                     | P0       |
| Pending state            | ✅ Manual sync      | ✅ Computed signal                | P0       |
| Submit handling          | ✅ Directive        | ✅ Direct method                  | P0       |
| **Advanced Features**    |
| validationConfig         | ✅ Required         | ❌ Not needed!                    | P0       |
| Form arrays              | ✅ Complex          | ✅ Signal arrays                  | P1       |
| Nested objects           | ✅ ngModelGroup     | ✅ Direct binding                 | P1       |
| Schema validation        | ✅ Separate package | ✅ Built-in helper                | P2       |
| **UI Components**        |
| NgxControlWrapper        | ✅ Component        | ✅ Keep + enhance                 | P1       |
| Error display            | ✅ Directive        | ✅ Signal-based                   | P0       |
| Smart state              | ✅ Complex          | ✅ Computed signals               | P2       |
| **New v3 Features**      |
| Form composition         | ❌ Not available    | ✅ Built-in with composeVestForms | P1       |
| Lazy loading support     | ❌ Not available    | ✅ @defer integration             | P2       |
| Array utilities          | ⚠️ Manual           | ✅ Dedicated helpers              | P1       |
| Built-in debouncing      | ❌ Manual           | ✅ Configurable                   | P2       |
| Field metadata           | ❌ Not available    | ✅ Optional support               | P3       |
| Form history/undo        | ❌ Not available    | ✅ Optional feature               | P3       |
| Async initial values     | ❌ Manual           | ✅ Built-in helper                | P2       |
| Injectable form context  | ❌ Prop drilling    | ✅ Injection token                | P2       |
| **Developer Experience** |
| TypeScript support       | ✅ Partial          | ✅ Full inference                 | P0       |
| Debugging                | ⚠️ Hard             | ✅ Signal devtools                | P1       |
| Testing                  | ⚠️ Complex          | ✅ Simple mocks                   | P1       |
| Bundle size              | ⚠️ Large (~15KB)    | ✅ Small (<5KB core)              | P1       |
| Pure functions           | ❌ Directive-based  | ✅ Function-first                 | P0       |
| Two-way binding support  | ⚠️ Problematic      | ✅ Natural with signals           | P0       |

## Optional Testing Utilities

The core package stays lean, but we plan a companion entry point—`ngx-vest-forms/testing`—for teams that want shared helpers:

```ts
import {
  createMockVestForm,
  waitForVestValidation,
  renderVestHarness,
} from 'ngx-vest-forms/testing';

const form = createMockVestForm(initialUser, {
  errors: { email: ['Email required'] },
});

await waitForVestValidation(form);
```

- **`createMockVestForm`**: spin up an in-memory form with seeded state/errors for pure unit tests.
- **`waitForVestValidation`**: await async validations without dealing with Angular test zones.
- **`renderVestHarness`**: small Angular Testing Library helper that wires `createVestForm` to a host component.

These utilities are optional and tree-shakeable; production apps do not pay for them unless they import them explicitly.

## Benefits Summary

### Developer Experience

- **90% less boilerplate** compared to v2 - most forms need just `createVestForm()`
- **Single source of truth** (Vest owns state) - no synchronization complexity
- **No race conditions** (unidirectional flow) - signals handle reactivity
- **Better TypeScript** support with full path inference and auto-completion
- **Easier testing** (just test signals) - no complex directive mocking
- **Smart defaults** - automatic read-only detection, touch-aware errors
- **Progressive enhancement** - start simple, add complexity only when needed

### Performance

- **Smaller bundle** (<5KB core vs ~15KB)
- **Better tree-shaking** (modular design)
- **Optimized reactivity** with signals
- **Lazy validation** with `only()`
- **Automatic memoization** with computed signals

### Maintainability

- **Simpler mental model** (Vest → View)
- **Less code to maintain** (~70% reduction)
- **Easier debugging** with signal devtools
- **Progressive enhancement** path
- **Framework-agnostic core** logic

## Implementation Phases

### Phase 1: Core API

- [ ] `createVestForm` function
- [ ] Signal-based state management
- [ ] Type-safe path utilities
- [ ] Basic validation integration

### Phase 2: Developer Experience

- [ ] Field helper component
- [ ] Error display utilities
- [ ] Async validation handling
- [ ] Performance optimizations

### Phase 3: Optional Features (Week 5-6)

- [ ] Schema integration (StandardSchema)
- [ ] Optional NgForm directive
- [ ] Form arrays helpers
- [ ] Nested object utilities

### Phase 4: Migration & Documentation

- [ ] Migration guide
- [ ] Codemods
- [ ] Examples repository
- [ ] Performance benchmarks

## Key Decisions Summary

1. **No required directives** - Pure function approach
2. **Two-way binding is fine** - Signals handle it properly
3. **Schema validation optional** - But well-integrated via StandardSchema
4. **No backwards compatibility required** - Clean break for simplicity
5. **Vest owns all state** - Angular is just the view layer

## Open Questions

1. Should we maintain backward compatibility with v2?
2. How do we handle server-side rendering?
3. Should schema validation be in core or separate?
4. Do we need a Vue/React version with the same API?
5. How do we handle i18n for error messages?

## Conclusion

The inverted architecture represents a fundamental shift in how we approach form validation in Angular. By making Vest.js the source of truth and leveraging Angular 20.3's signal capabilities, we can deliver a dramatically simpler, more performant, and more maintainable solution.

### Key Insights

1. **Radical Simplicity**: 90% of forms need just `createVestForm(suite, initialValue)` - that's it
2. **Validation state is application state**, not form state - treat it as such with signals
3. **Smart defaults eliminate configuration** - auto-detection of read-only signals, touch states, etc.
4. **NgForm integration is optional and explicit** - only add complexity when actually needed
5. **Type safety comes for free** - full path inference without configuration

### From Complex to Simple

**v2 Pattern (Complex):**

```typescript
// Lots of boilerplate, directives, configuration
<form ngxVestForm [vestSuite]="suite" [validationConfig]="config">
  <ngx-control-wrapper>
    <input ngxFormErrorDisplay #display="formErrorDisplay" />
  </ngx-control-wrapper>
</form>
```

**v3 Pattern (Simple):**

```typescript
// Just a function call and direct signal usage
const form = createVestForm(suite, { email: '' });

<form>
  <input [(ngModel)]="form.value().email" />
  @if (form.showErrors('email')()) {
    <span>{{ form.getError('email')() }}</span>
  }
</form>
```

This approach transforms ngx-vest-forms from a complex adapter into an elegant bridge between two powerful systems, each doing what it does best: Vest handles validation, Angular handles rendering, and signals handle reactivity.

The result: **90% less code, 100% more clarity**.
