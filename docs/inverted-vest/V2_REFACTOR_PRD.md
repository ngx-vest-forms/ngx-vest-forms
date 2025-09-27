# ngx-vest-forms V2: Vest-First Architecture PRD

**Project**: ngx-vest-forms V2 Complete Refactor
**Date**: September 27, 2025
**Version**: 2.0.0 (Breaking Changes)
**Author**: Architecture Team

## Executive Summary

This PRD outlines the complete refactor of ngx-vest-forms from a V1 NgForm-centric approach to a V2 Vest-first architecture. The refactor eliminates backward compatibility in favor of a cleaner, more performant, and framework-agnostic validation core with optional Angular integrations.

## Problem Statement

### Current V1 Issues

- **Dual State Management**: NgForm and Vest maintain separate state, causing synchronization complexity
- **Performance Overhead**: Every field change triggers double bookkeeping (NgForm → Vest → Angular)
- **Framework Lock-in**: Core validation logic is tightly coupled to Angular Forms
- **Bundle Bloat**: All users pay for NgForm dependencies even if not needed
- **Complex Touch Detection**: Manual blur event handling and parallel dirty flags
- **Limited Flexibility**: Hard to integrate with Signal Forms or other UI frameworks

### V2 Solution

- **Single Source of Truth**: Vest owns all validation state
- **Framework Agnostic Core**: Pure TypeScript validation with optional Angular bindings
- **Performance First**: Lazy signal creation, efficient caching, EAGER execution mode
- **Modular Architecture**: Pay only for what you use (core + optional packages)
- **Enhanced Developer Experience**: Proxy-based field access with automatic signal generation

## Architecture Overview

### V2 Core Principles

1. **Vest-First**: Vest.js is the single source of truth for validation state
2. **Framework Agnostic**: Core validation works without Angular dependencies
3. **Optional Integrations**: NgForm, Control Wrapper, Schema adapters as separate packages
4. **Signal-Native**: Built for Angular's modern reactivity primitives
5. **Performance Optimized**: Lazy loading, caching, and minimal re-computation

### Package Structure

```text
ngx-vest-forms/
├── core/                          # Framework-agnostic validation core (~3KB)
│   ├── createVestForm()           # Primary factory function
│   ├── Enhanced Field Signals API # Proxy-based field access
│   ├── form-arrays.ts            # Dynamic collection management
│   ├── compose-vest-forms.ts     # Multi-form composition
│   └── utils/                    # Path helpers, value extraction
├── control-wrapper/              # Optional UI helpers (~2KB)
│   ├── NgxControlWrapper         # Accessible field wrapper component
│   └── error display components # Strategy-based error presentation
├── ngform-sync/                  # Optional NgForm integration (~2KB)
│   ├── NgxVestSyncDirective      # Bidirectional NgForm synchronization
│   └── template-driven helpers  # ngModel integration utilities
├── schemas/                      # Optional schema adapters (~1KB each)
│   ├── zod-adapter.ts           # Zod integration
│   ├── valibot-adapter.ts       # Valibot integration
│   └── arktype-adapter.ts       # ArkType integration
└── testing/                      # Optional test utilities (~1KB)
    ├── VestFormHarness          # Test harness for components
    └── mock-strategies.ts       # Mock validation strategies
```

## API Design

### Core API (createVestForm)

#### Basic Usage (No Angular Dependencies)

```typescript
import { createVestForm } from 'ngx-vest-forms/core';
import { staticSuite, test, enforce } from 'vest';

// Define validation suite
const userSuite = staticSuite((data = {}, field) => {
  if (field) only(field);

  test('email', 'Email is required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid email format', () => enforce(data.email).isEmail());
});

// Create form instance
const form = createVestForm(userSuite, { email: '' });

// Enhanced Field Signals API (automatic generation)
const emailValue = form.email(); // signal<string>
const emailValid = form.emailValid(); // computed<boolean>
const emailErrors = form.emailErrors(); // computed<string[]>
const emailTouched = form.emailTouched(); // computed<boolean>
const emailPending = form.emailPending(); // computed<boolean>
const emailShowErrors = form.emailShowErrors(); // computed<boolean>

// Field operations
form.setEmail('user@example.com');
form.touchEmail();
form.resetEmail();

// Alternative explicit API (when proxy conflicts exist)
const emailField = form.field('email');
emailField.value(); // same as form.email()
emailField.set('user@example.com');
```

#### Angular Component Integration

```typescript
@Component({
  selector: 'user-form',
  imports: [], // No FormsModule needed!
  template: `
    <form (ngSubmit)="handleSubmit()">
      <label for="email">Email</label>
      <input
        id="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
        [attr.aria-invalid]="form.emailShowErrors() ? 'true' : null"
      />

      @if (form.emailShowErrors()) {
        <p role="alert">{{ form.emailErrors()[0] }}</p>
      }

      <button type="submit" [disabled]="!form.valid()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  form = createVestForm(userSuite, { email: '' });

  handleSubmit() {
    if (form.valid()) {
      console.log('Valid data:', form.value());
    }
  }
}
```

### Optional NgForm Integration

```typescript
import { NgxVestSyncDirective } from 'ngx-vest-forms/ngform-sync';

@Component({
  imports: [FormsModule, NgxVestSyncDirective], // FormsModule only when needed
  template: `
    <form ngxVestSync [vestForm]="form" (ngSubmit)="handleSubmit()">
      <input name="email" [(ngModel)]="form.email()" #emailControl="ngModel" />
      <!-- Automatic .ng-valid, .ng-invalid, .ng-touched classes -->
    </form>
  `,
})
export class NgFormUserComponent {
  form = createVestForm(userSuite, { email: '' });
}
```

### Optional Control Wrapper

```typescript
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

@Component({
  imports: [NgxControlWrapper],
  template: `
    <form>
      <ngx-control-wrapper [field]="form.field('email')">
        <label for="email">Email</label>
        <input
          id="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
        />
      </ngx-control-wrapper>
    </form>
  `,
})
export class WrappedFormComponent {
  form = createVestForm(userSuite, { email: '' });
}
```

## Migration Strategy

### Phase 1: Archive V1 and Setup V2 Foundation

1. **Backup Current Code**

   ```bash
   mkdir -p _backup/v1
   mv projects/ngx-vest-forms/* _backup/v1/
   ```

2. **Create New Package Structure**
   - Set up new modular architecture
   - Configure build system for multiple entry points
   - Establish testing infrastructure

3. **Implement Core Package**
   - `createVestForm()` factory function
   - Enhanced Field Signals API with Proxy
   - Basic form arrays and composition utilities

### Phase 2: Optional Packages

1. **Control Wrapper Package**
   - Accessible field wrapper component
   - Strategy-based error display
   - Tailwind CSS integration

2. **NgForm Sync Package**
   - Bidirectional synchronization directive
   - Template-driven form helpers
   - CSS class integration

### Phase 3: Advanced Features

1. **Schema Adapters**
   - Zod integration
   - Valibot integration
   - ArkType integration

2. **Testing Utilities**
   - Component test harnesses
   - Mock validation strategies

### Phase 4: Documentation and Examples

1. **Refactor Examples**
   - Pure Vest-first examples (no Angular Forms)
   - NgForm integration examples
   - Side-by-side comparisons
   - Migration guides

## Examples Refactoring Strategy

### Example Categories

#### 1. Pure Vest-First Examples (Recommended)

**Location**: `examples/01-fundamentals-pure/`

- No FormsModule dependency
- Direct signal bindings
- Clean, minimal templates
- Showcases V2 core capabilities

```typescript
// minimal-form-pure.component.ts
@Component({
  imports: [], // No FormsModule!
  template: `
    <form (ngSubmit)="handleSubmit()">
      <input [value]="form.email()" (input)="form.setEmail($event)" />
      @if (form.emailShowErrors()) {
        <p>{{ form.emailErrors()[0] }}</p>
      }
    </form>
  `,
})
export class MinimalFormPureComponent {
  form = createVestForm(emailSuite, { email: '' });
}
```

#### 2. NgForm Integration Examples (Optional)

**Location**: `examples/01-fundamentals-ngform/`

- FormsModule dependency
- ngModel bindings
- Shows migration path from V1
- Demonstrates V2 NgForm sync

```typescript
// minimal-form-ngform.component.ts
@Component({
  imports: [FormsModule, NgxVestSyncDirective],
  template: `
    <form ngxVestSync [vestForm]="form" (ngSubmit)="handleSubmit()">
      <input name="email" [(ngModel)]="form.email()" />
    </form>
  `,
})
export class MinimalFormNgFormComponent {
  form = createVestForm(emailSuite, { email: '' });
}
```

#### 3. Side-by-Side Comparisons

**Location**: `examples/comparisons/`

- Same functionality, different approaches
- Performance comparisons
- Bundle size analysis
- Clear recommendations

### Example Structure

```
examples/
├── 01-fundamentals-pure/          # Clean Vest-first API
│   ├── minimal-form/
│   ├── basic-validation/
│   ├── error-display-modes/
│   └── form-state-demo/
├── 01-fundamentals-ngform/        # NgForm integration
│   ├── minimal-form-ngform/
│   ├── basic-validation-ngform/
│   └── migration-from-v1/
├── 02-advanced-patterns/          # Both approaches where applicable
│   ├── dynamic-arrays/
│   ├── multi-step-form/
│   └── server-side-validation/
├── 03-ui-patterns/               # Control wrapper examples
│   ├── control-wrapper-intro/
│   └── custom-error-display/
├── 04-schema-integration/        # Schema adapter examples
│   ├── zod-integration/
│   ├── valibot-integration/
│   └── schema-comparison/
└── comparisons/                  # Side-by-side analysis
    ├── bundle-size/
    ├── performance/
    └── api-differences/
```

## Implementation Timeline

### Sprint 1-2: Foundation (Weeks 1-4)

- [ ] Archive V1 code to `_backup/v1/`
- [ ] Set up new package structure
- [ ] Implement `createVestForm()` core
- [ ] Enhanced Field Signals API with Proxy
- [ ] Basic unit tests for core functionality
- [ ] Set up build system for multiple entry points

### Sprint 3-4: Core Features (Weeks 5-8)

- [ ] Form arrays implementation (`form.array()`)
- [ ] Form composition (`composeVestForms()`)
- [ ] Error display strategies
- [ ] Path utilities and value extraction
- [ ] Comprehensive core testing
- [ ] Performance benchmarks

### Sprint 5-6: Optional Packages (Weeks 9-12)

- [ ] Control Wrapper package
- [ ] NgForm Sync package
- [ ] Schema adapters (Zod, Valibot, ArkType)
- [ ] Testing utilities
- [ ] Integration tests

### Sprint 7-8: Examples and Documentation (Weeks 13-16)

- [ ] Refactor all examples to V2 API
- [ ] Create pure vs NgForm comparisons
- [ ] Write migration guides
- [ ] Performance analysis documentation
- [ ] API reference documentation

## Testing Strategy

### Unit Testing Requirements

- **Coverage Target**: 95%+ for core package
- **Testing Framework**: Vitest for fast execution
- **Approach**: Test behavior, not implementation
- **Mock Strategy**: Prefer fakes over mocks

### Integration Testing

- **Component Testing**: Vitest Browser + Angular Testing Library
- **E2E Testing**: Playwright for critical user journeys
- **Cross-Package Testing**: Ensure optional packages integrate correctly

### Performance Testing

- **Bundle Size**: Track and enforce size budgets
- **Runtime Performance**: Benchmark form operations
- **Memory Usage**: Monitor signal creation and cleanup

## Success Criteria

### Technical Metrics

- [ ] Core package < 3KB gzipped
- [ ] 95%+ test coverage across all packages
- [ ] Zero breaking changes within V2.x lifecycle
- [ ] <100ms form creation time for 100-field forms
- [ ] Memory usage scales linearly with form size

### Developer Experience

- [ ] 80% reduction in boilerplate code vs V1
- [ ] Clear TypeScript types with IntelliSense
- [ ] Comprehensive documentation with examples
- [ ] Migration path from V1 clearly documented
- [ ] Community feedback incorporated

### Ecosystem Compatibility

- [ ] Works with Angular 18+ (signals-first)
- [ ] Compatible with Vest.js v5+
- [ ] Integrates with popular UI libraries
- [ ] SSR/SSG compatible
- [ ] Works in micro-frontend architectures

## Risk Assessment

### High Risk

- **Breaking Changes**: Complete API redesign may frustrate existing users
  - _Mitigation_: Clear migration guides, codemods if possible
- **Proxy Support**: Enhanced Field Signals API requires Proxy support
  - _Mitigation_: Fallback to explicit API, clear browser support docs

### Medium Risk

- **Performance Regression**: Signal overhead in large forms
  - _Mitigation_: Lazy signal creation, performance testing
- **Bundle Size**: Multiple packages may increase total size
  - _Mitigation_: Tree-shaking, size budgets, bundle analysis

### Low Risk

- **Angular Version Compatibility**: Signals require Angular 16+
  - _Mitigation_: Clear version requirements in documentation

## Next Steps

1. **Approval**: Review and approve this PRD with stakeholders
2. **Team Assignment**: Allocate developers to implementation phases
3. **Environment Setup**: Configure build, test, and CI/CD systems
4. **Kickoff**: Begin Phase 1 implementation with V1 archival

---

_This PRD serves as the authoritative guide for the ngx-vest-forms V2 refactor. All implementation decisions should reference this document for consistency and alignment with project goals._
