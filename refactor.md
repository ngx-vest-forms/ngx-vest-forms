# NgxVestForms v2 Architecture: Progressive Enhancement Strategy

## Core Philosophy

**"Start simple, enhance progressively"** - Provide a minimal core that covers 80% of use cases, with opt-in features for advanced scenarios.

## Requirements

### Guiding Principles

1. **Minimal by Default**: Core directive should be <200 lines with essential features only
2. **Tree-Shakeable**: Unused features should not increase bundle size
3. **Progressive Enhancement**: Add complexity only when needed
4. **Type-Safe**: Maintain type safety at all levels
5. **Breaking Changes Allowed**: v2 is a breaking release, no v1 compatibility needed (except formShape migration utility)
6. **Performance First**: Optimize for common cases, not edge cases

### Feature Segmentation

#### Core Features (Always Included)

- Basic Vest validation
- Signal-based state management
- Form value two-way binding
- Basic error collection
- Submit handling

#### Optional Features (Opt-in via separate directives)

- Schema validation
- Smart state synchronization (separate from debugging)
- Debug logging/performance tracking (separate from smart state)
- Advanced error categorization (warnings, root errors)
- Validation dependencies
- Submission tracking

## Directory Structure

```
projects/ngx-vest-forms/
├── core/                           # Minimal core (<500 LOC total)
│   ├── src/
│   │   ├── directives/
│   │   │   ├── form-base.directive.ts      # Abstract base (~50 LOC)
│   │   │   ├── form-core.directive.ts      # Minimal implementation (~150 LOC)
│   │   │   └── form-field.directive.ts     # Field validator (~50 LOC)
│   │   ├── models/
│   │   │   ├── form-state.model.ts         # Core state interface
│   │   │   └── validation.model.ts         # Validation types
│   │   └── utils/
│   │       └── form-utils.ts               # Essential utilities only
│   │
├── features/                       # Optional feature directives
│   ├── schema/                    # Schema validation feature
│   │   ├── src/
│   │   │   ├── schema-validation.directive.ts
│   │   │   ├── schema-validation.service.ts
│   │   │   └── runtime-adapters/
│   │   │       ├── zod.adapter.ts
│   │   │       ├── valibot.adapter.ts
│   │   │       └── arktype.adapter.ts
│   │   │
│   ├── smart-state/               # External state sync (separate from debug)
│   │   ├── src/
│   │   │   ├── smart-state.directive.ts
│   │   │   └── smart-state.service.ts
│   │   │
│   ├── debug/                     # Debug/logging features (separate directive)
│   │   ├── src/
│   │   │   ├── debug-logging.directive.ts
│   │   │   └── performance-tracking.directive.ts
│   │   │
│   ├── advanced/                  # Other advanced features
│   │   ├── src/
│   │   │   ├── validation-dependencies.directive.ts
│   │   │   └── submission-tracking.directive.ts
│   │   │
│   └── enhanced/                  # Full-featured directive (composition)
│       └── src/
│           └── form-enhanced.directive.ts  # Composition of all features
│
├── control-wrapper/               # UI component (unchanged)
│   └── src/
│       └── control-wrapper.component.ts
│
├── schemas/                       # Schema utilities (compatibility)
│   └── src/
│       ├── v1-migration.ts        # formShape migration from v1
│       └── schema-adapter.ts      # StandardSchema compatibility
│
└── presets/                       # Pre-configured bundles
    ├── simple/                    # Core only
    │   └── index.ts              # Exports: ngxVestForms
    ├── standard/                  # Core + Schema
    │   └── index.ts              # Exports: ngxVestFormsWithSchema
    ├── advanced/                  # Core + Schema + Smart State
    │   └── index.ts              # Exports: ngxVestFormsAdvanced
    └── full/                      # Everything including debug
        └── index.ts              # Exports: ngxVestFormsFull
```

## Directive Architecture

### 1. Core Directive (Minimal)

```typescript
import {
  Directive,
  inject,
  model,
  input,
  computed,
  effect,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs';

export interface CoreFormState<T> {
  value: T | null;
  errors: Record<string, string[]>;
  valid: boolean;
  dirty: boolean;
  submitted: boolean;
}

@Directive({
  selector: 'form[ngxVestForm]',
  exportAs: 'ngxVestForm',
  host: { '[attr.novalidate]': '""' },
})
export class NgxFormCoreDirective<T = Record<string, unknown>> {
  private readonly ngForm = inject(NgForm);

  // Core inputs
  readonly formValue = model<T | null>(null);
  readonly vestSuite = input<NgxVestSuite<T> | null>(null);
  readonly validationOptions = input({ debounceTime: 0 });

  // Minimal state tracking
  private readonly submitted = signal(false);

  private readonly errors$ = toSignal(
    this.ngForm.form.statusChanges.pipe(
      startWith(this.ngForm.form.status),
      map(() => this.collectErrors()),
    ),
    { initialValue: {} },
  );

  private readonly status$ = toSignal(
    this.ngForm.form.statusChanges.pipe(startWith(this.ngForm.form.status)),
    { initialValue: 'VALID' },
  );

  // Simple public state
  readonly formState = computed<CoreFormState<T>>(() => ({
    value: this.formValue() ?? null,
    errors: this.errors$(),
    valid: this.status$() === 'VALID',
    dirty: this.ngForm.form.dirty,
    submitted: this.submitted(),
  }));

  constructor() {
    // Simple form value sync
    effect(() => {
      const value = this.formValue();
      if (value && this.ngForm.form) {
        this.ngForm.form.patchValue(value, { emitEvent: false });
      }
    });

    // Simple submit handler
    this.ngForm.ngSubmit.subscribe(() => {
      this.submitted.set(true);
      this.ngForm.form.markAllAsTouched();
    });
  }

  private collectErrors(): Record<string, string[]> {
    // Simple error collection from form controls
    const errors: Record<string, string[]> = {};
    for (const [key, control] of Object.entries(this.ngForm.form.controls)) {
      if (control.errors?.['errors']) {
        errors[key] = control.errors['errors'];
      }
    }
    return errors;
  }

  // Simple validator factory
  createAsyncValidator(field: string): AsyncValidatorFn | null {
    const suite = this.vestSuite();
    const options = this.validationOptions();

    if (!suite) return null;

    return NgxFormCoreDirective.createVestAsyncValidator(
      suite,
      field,
      () => this.getCurrentModel(),
      options.debounceTime,
    );
  }

  private getCurrentModel(): T {
    return mergeValuesAndRawValues<T>(this.ngForm.form);
  }

  // Static helper (keep existing implementation but simplified)
  static createVestAsyncValidator<M>(
    suite: NgxVestSuite<M>,
    field: string,
    getModel: () => M,
    debounceTimeMs = 300,
  ): AsyncValidatorFn {
    // Simplified version of existing static method
    // ...existing implementation but streamlined
  }
}
```

### 2. Schema Feature Directive (Separate)

```typescript
import {
  Directive,
  inject,
  input,
  effect,
  signal,
  computed,
} from '@angular/core';
import { NgxFormCoreDirective } from 'ngx-vest-forms/core';

export interface SchemaFormState {
  schema: {
    hasRun: boolean;
    success: boolean | null;
    issues: readonly { path?: string; message: string }[];
    errorMap: Readonly<Record<string, readonly string[]>>;
  } | null;
}

@Directive({
  selector: 'form[ngxVestForm][formSchema]',
  hostDirectives: [
    {
      directive: NgxFormCoreDirective,
      inputs: ['formValue', 'vestSuite', 'validationOptions'],
      outputs: ['formValueChange'],
    },
  ],
})
export class NgxSchemaValidationDirective {
  private readonly form = inject(NgxFormCoreDirective, { host: true });
  private readonly schemaState = signal<SchemaFormState['schema']>(null);

  readonly formSchema = input<
    SchemaDefinition | NgxRuntimeSchema<unknown> | null
  >(null);

  // Extended state that includes schema
  readonly enhancedFormState = computed(() => ({
    ...this.form.formState(),
    schema: this.schemaState(),
  }));

  constructor() {
    // Schema validation on submit
    effect(() => {
      // Only run on form submission
      if (this.form.formState().submitted) {
        this.validateSchema();
      }
    });
  }

  private validateSchema(): void {
    const schema = this.formSchema();
    if (!schema) return;

    try {
      const runtime = toAnyRuntimeSchema(schema);
      const currentModel = this.form.getCurrentModel();
      const result = runtime.safeParse(currentModel);

      if (result.success === false) {
        const issues = result.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        }));

        const errorMap: Record<string, readonly string[]> = {};
        for (const issue of issues) {
          const key = issue.path || '_root';
          errorMap[key] = [...(errorMap[key] || []), issue.message];
        }

        this.schemaState.set({
          hasRun: true,
          success: false,
          issues,
          errorMap,
        });
      } else {
        this.schemaState.set({
          hasRun: true,
          success: true,
          issues: [],
          errorMap: {},
        });
      }
    } catch (error) {
      this.schemaState.set({
        hasRun: true,
        success: false,
        issues: [{ message: 'Schema validation error' }],
        errorMap: { _root: ['Schema validation error'] },
      });
    }
  }
}
```

### 3. Smart State Directive (Separate from Debug)

```typescript
import { Directive, inject, input, effect } from '@angular/core';
import { NgxFormCoreDirective } from 'ngx-vest-forms/core';

@Directive({
  selector: 'form[ngxVestForm][smartState]',
  hostDirectives: [NgxFormCoreDirective],
})
export class NgxSmartStateDirective {
  private readonly form = inject(NgxFormCoreDirective, { host: true });

  readonly smartState = input<{
    externalSource$: Observable<any>;
    conflictResolution?: 'client' | 'server' | 'prompt';
    autoSync?: boolean;
  } | null>(null);

  constructor() {
    effect(() => {
      const config = this.smartState();
      if (config) {
        this.setupSmartState(config);
      }
    });
  }

  private setupSmartState(config: any): void {
    // Smart state implementation
    // External data synchronization
    // Conflict detection and resolution
  }
}
```

### 4. Debug Directive (Separate from Smart State)

```typescript
import { Directive, inject, input, effect } from '@angular/core';
import { NgxFormCoreDirective } from 'ngx-vest-forms/core';
import { isDevMode } from '@angular/core';

@Directive({
  selector: 'form[ngxVestForm][enableDebug]',
  hostDirectives: [NgxFormCoreDirective],
})
export class NgxDebugDirective {
  private readonly form = inject(NgxFormCoreDirective, { host: true });

  readonly enableDebug = input(false, { transform: booleanAttribute });
  readonly enablePerformanceTracking = input(false, {
    transform: booleanAttribute,
  });

  constructor() {
    effect(() => {
      if (this.enableDebug() && isDevMode()) {
        this.setupDebugLogging();
      }
    });

    effect(() => {
      if (this.enablePerformanceTracking() && isDevMode()) {
        this.setupPerformanceTracking();
      }
    });
  }

  private setupDebugLogging(): void {
    // Debug logging implementation
    console.log('[NgxVestForms] Debug mode enabled');
  }

  private setupPerformanceTracking(): void {
    // Performance tracking implementation
    console.log('[NgxVestForms] Performance tracking enabled');
  }
}
```

### 5. Enhanced Directive (Composition)

```typescript
import { Directive, computed } from '@angular/core';
import { NgxFormCoreDirective } from 'ngx-vest-forms/core';
import { NgxSchemaValidationDirective } from 'ngx-vest-forms/features/schema';
import { NgxSmartStateDirective } from 'ngx-vest-forms/features/smart-state';

@Directive({
  selector: 'form[ngxVestFormEnhanced]',
  hostDirectives: [
    NgxFormCoreDirective,
    NgxSchemaValidationDirective,
    NgxSmartStateDirective,
  ],
})
export class NgxFormEnhancedDirective<T = Record<string, unknown>> {
  // All features available through host directives
  // No additional logic needed - composition via hostDirectives
}
```

## Usage Patterns

### 1. Simple Forms (Core Only)

```typescript
import { ngxVestForms } from 'ngx-vest-forms/presets/simple';

@Component({
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <input name="email" [ngModel]="model().email" />
      @if (form.formState().errors['email']) {
        <div>{{ form.formState().errors['email'][0] }}</div>
      }
    </form>
  `,
})
export class SimpleFormComponent {
  protected readonly model = signal({ email: '' });
  protected readonly suite = createSuite(/* ... */);
}
```

### 2. Standard Forms (Core + Schema)

```typescript
import { ngxVestFormsWithSchema } from 'ngx-vest-forms/presets/standard';
import { z } from 'zod';

@Component({
  imports: [ngxVestFormsWithSchema, NgxControlWrapper],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [formSchema]="schema"
      [(formValue)]="model"
    >
      <ngx-control-wrapper>
        <label>Email</label>
        <input name="email" [ngModel]="model().email" />
      </ngx-control-wrapper>
    </form>
  `,
})
export class StandardFormComponent {
  protected readonly schema = z.object({ email: z.string().email() });
  protected readonly model = signal({ email: '' });
  protected readonly suite = vestSuiteFromSchema(this.schema);
}
```

### 3. Advanced Forms (Smart State)

```typescript
import { ngxVestFormsAdvanced } from 'ngx-vest-forms/presets/advanced';

@Component({
  imports: [ngxVestFormsAdvanced, NgxControlWrapper],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [formSchema]="schema"
      [smartState]="{ externalSource$: userService.user$, autoSync: true }"
      [(formValue)]="model"
    >
      <!-- Advanced form with external state sync -->
    </form>
  `,
})
export class AdvancedFormComponent {
  // Smart state features available
}
```

### 4. Full Debug Mode (Development)

```typescript
import { ngxVestFormsFull } from 'ngx-vest-forms/presets/full';

@Component({
  imports: [ngxVestFormsFull, NgxControlWrapper],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [formSchema]="schema"
      [smartState]="externalState"
      [enableDebug]="true"
      [enablePerformanceTracking]="true"
      [(formValue)]="model"
    >
      <!-- Full feature set with debugging -->
    </form>
  `,
})
export class DebugFormComponent {
  // All features including debug logging
}
```

## Migration Strategy

### From v1 to v2 (Breaking Changes)

```typescript
// V1 (Original Simplified Courses version)
@Component({
  template: `
    <form
      [formShape]="shape"
      [formSuite]="suite"
      (formValueChange)="onFormChange($event)"
    >
      <input ngModel name="email" />
      <div *ngIf="errors.email">{{ errors.email[0] }}</div>
    </form>
  `,
})
// V2 Simple Migration
@Component({
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <input name="email" [ngModel]="model().email" />
      @if (form.formState().errors['email']) {
        <div>{{ form.formState().errors['email'][0] }}</div>
      }
    </form>
  `,
})
export class MigratedFormComponent {
  protected readonly model = signal({ email: '' });
  protected readonly suite = createSuite(/* convert formSuite */);
}

// V2 With Schema (replaces formShape)
@Component({
  imports: [ngxVestFormsWithSchema],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [formSchema]="schema"
      [(formValue)]="model"
    >
      <!-- Use ngxModelToStandardSchema for v1 formShape compatibility -->
    </form>
  `,
})
export class SchemaFormComponent {
  // Convert v1 formShape to v2 schema
  protected readonly schema = ngxModelToStandardSchema(v1FormShape);
  protected readonly model = signal(/* initial model */);
}
```

### Migration Utility for v1 formShape

```typescript
// In schemas package
export function migrateV1FormShape<T>(formShape: T): StandardSchemaV1<T> {
  return ngxModelToStandardSchema(formShape);
}

// Usage
const v1Shape = { email: '', name: '' };
const v2Schema = migrateV1FormShape(v1Shape);
```

## Configuration API

### Global Configuration

```typescript
import { provideNgxVestForms } from 'ngx-vest-forms';

export const appConfig = {
  providers: [
    provideNgxVestForms({
      // Core config
      defaultDebounce: 300,

      // Feature flags (opt-in)
      features: {
        schema: false, // Disabled by default
        smartState: false, // Disabled by default
        debug: isDevMode(), // Only in dev mode
        performance: false, // Disabled by default
      },

      // Performance
      performance: {
        memoizeValidators: true,
        virtualScrollThreshold: 100,
      },
    }),
  ],
};
```

### Per-Form Configuration

```typescript
@Component({
  template: `
    <!-- Minimal -->
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model"></form>

    <!-- With schema -->
    <form
      ngxVestForm
      [vestSuite]="suite"
      [formSchema]="schema"
      [(formValue)]="model"
    ></form>

    <!-- With smart state -->
    <form
      ngxVestForm
      [vestSuite]="suite"
      [smartState]="{ externalSource$: data$ }"
      [(formValue)]="model"
    ></form>

    <!-- With debug (dev only) -->
    <form
      ngxVestForm
      [vestSuite]="suite"
      [enableDebug]="true"
      [enablePerformanceTracking]="true"
      [(formValue)]="model"
    ></form>
  `,
})
export class ConfigurableFormComponent {}
```

## Bundle Size Impact (Estimated)

| Configuration | Size  | Features                                   |
| ------------- | ----- | ------------------------------------------ |
| Core Only     | ~12KB | Basic validation, signals, submit handling |
| + Schema      | ~18KB | + Runtime schema validation                |
| + Smart State | ~23KB | + External state sync, conflict resolution |
| + Debug       | ~25KB | + Debug logging, performance tracking      |
| Full          | ~25KB | All features                               |

## Key Differences from Original Proposal

### 1. **Smart State & Debug Separation** ✅

- Smart state is now a separate directive (`NgxSmartStateDirective`)
- Debug/logging is a separate directive (`NgxDebugDirective`)
- Can be used independently: smart state without debug, or debug without smart state

### 2. **No v3, This IS v2** ✅

- This is the v2 breaking release
- No compatibility mode needed for current v2 work
- Only v1 migration utilities provided via `ngxModelToStandardSchema`

### 3. **v1 to v2 Migration Focus** ✅

- Migration targets original Simplified Courses v1
- `formShape` → `formSchema` with compatibility helper
- `formSuite` → `vestSuite` (API name change)
- Template syntax modernization (`*ngIf` → `@if`, signals, etc.)

### 4. **Cleaner Directive Composition**

- Each feature is a separate, focused directive
- Use `hostDirectives` for clean composition
- No feature interdependencies
- Clear opt-in model

## Implementation Benefits

### For Users

1. **Pay-per-feature**: Only include what you need
2. **Clear upgrade path**: From simple to advanced
3. **Better debugging**: Separate debug features don't affect production
4. **Type safety**: Full type inference at all levels

### For Maintainers

1. **Isolated features**: Test and maintain separately
2. **Clear responsibilities**: Each directive has single purpose
3. **Easier evolution**: Add features without affecting core
4. **Performance focused**: Optimize each layer independently

## Success Metrics

1. **Core directive < 200 LOC** ✅
2. **Bundle size reduction > 40% for simple forms**
3. **Migration success rate > 90% from v1**
4. **Performance improvement > 25% for core-only usage**
5. **Test coverage > 95% for all modules**
6. **Zero breaking changes within v2 feature additions**

## Next Steps

1. **RFC Review**: Community feedback on this architecture
2. **Core Prototype**: Build minimal core directive first
3. **Feature Directives**: Implement schema, smart-state, debug separately
4. **Migration Tools**: Build v1 → v2 migration utilities
5. **Documentation**: Complete API docs and migration guide
6. **Performance Testing**: Benchmark against current v2 implementation

This architecture maintains the simplicity that made ngx-vest-forms popular while providing a clear path to advanced features when needed.
