# ngx-vest-forms/core

**Core form validation functionality** - The minimal, essential features for Vest.js integration with Angular template-driven forms.

## What's Included

The core package provides:

- `NgxFormCoreDirective` - Minimal form directive with Vest validation
- `NgxFormDirective` - Full-featured form directive (extends core)
- `NgxFormModelDirective` - Field-level validation
- `NgxFormModelGroupDirective` - Group validation
- Essential utilities and types

## What's NOT Included

Features available in separate packages:

- **Schema validation** → `ngx-vest-forms/schemas`
- **UI components** → `ngx-vest-forms/control-wrapper`
- **Smart state** → `ngx-vest-forms/smart-state`

## Quick Start

```typescript
import { ngxVestForms } from 'ngx-vest-forms/core';
import { Component, signal } from '@angular/core';
import { staticSuite, test, enforce } from 'vest';

const suite = staticSuite((data = {}, field?: string) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
});

@Component({
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #form="ngxVestForm"
    >
      <input name="email" [ngModel]="model().email" />
      @if (form.formState().errors['email']) {
        <span>{{ form.formState().errors['email'][0] }}</span>
      }
    </form>
  `,
})
export class SimpleFormComponent {
  protected readonly model = signal({ email: '' });
  protected readonly suite = suite;
}
```

## Core vs Full Directive

- **`NgxFormCoreDirective`** (~276 LOC)
  - Minimal state: `{ value, errors, valid, dirty, submitted }`
  - Basic Vest validation
  - Two-way form binding
  - Submit handling

- **`NgxFormDirective`** (~400 LOC)
  - Extends core via `hostDirectives`
  - Adds: `errorCount`, `warningCount`, `firstInvalidField`
  - Root-level error aggregation
  - Validation dependencies support

## Bundle Size Impact

Using core-only keeps your bundle minimal:

- Core directive: ~12KB
- With field validators: ~15KB
- Full directive: ~18KB

Compare to with schemas:

- Core + Schemas: ~23KB
- Everything: ~30KB

## Migration from Main Package

```typescript
// Before - importing from main package
import { ngxVestForms } from 'ngx-vest-forms';

// After - explicit core import (same functionality, clearer intent)
import { ngxVestForms } from 'ngx-vest-forms/core';
```

Both imports provide identical functionality since the main package re-exports core.

## API Reference

See the [main documentation](../../../README.md) for complete API reference.

Dev-time template checks with `_shape`:

- If you wrap a plain object using `ngxModelToStandardSchema`, the schema includes a private `_shape` copy of the template. In development, the form directive can leverage this to detect typos in `ngModel`/`ngModelGroup` names.
- Standard Schema libraries (Zod, Valibot, ArkType) don’t include `_shape`; submit-time validation is unaffected.
- See `ngx-vest-forms/schemas` README for details and v1 migration notes.
