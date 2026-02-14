---
name: angular-forms
description: Build Angular Template-Driven Forms with ngx-vest-forms and Vest.js validation. Use when creating forms with NgModel, FormsModule, ngModelGroup, validation suites, error display, unidirectional data flow, child form components, composable validations, or conditional form sections. Triggers on form creation, validation logic, error handling, form splitting, and cross-field validation in Angular 21+ projects using ngx-vest-forms.
---

# Angular Template-Driven Forms with ngx-vest-forms

Build type-safe, validated Angular forms using template-driven forms (`FormsModule`, `NgModel`, `ngModelGroup`) with Vest.js validation suites via the ngx-vest-forms library.

**Key principle:** Unidirectional data flow with `[ngModel]` (never `[(ngModel)]`), signals for state, and `staticSuite` with `only(field)` for performant validation.

## Quick Start

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgxVestForms, NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only } from 'vest';

type FormModel = NgxDeepPartial<{ firstName: string; email: string }>;

const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field);  // ALWAYS unconditional
  test('firstName', 'Required', () => enforce(model.firstName).isNotBlank());
  test('email', 'Invalid email', () => enforce(model.email).isEmail());
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form ngxVestForm [suite]="suite" [formValue]="formValue()"
          (formValueChange)="formValue.set($event)" (ngSubmit)="save()">
      <ngx-control-wrapper>
        <label for="firstName">First Name</label>
        <input id="firstName" name="firstName" [ngModel]="formValue().firstName" />
      </ngx-control-wrapper>
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" [ngModel]="formValue().email" />
      </ngx-control-wrapper>
      <button type="submit">Submit</button>
    </form>
  `
})
export class MyFormComponent {
  protected readonly suite = suite;
  protected readonly formValue = signal<FormModel>({});
  protected save() { console.log(this.formValue()); }
}
```

## Critical Rules

| Rule | Correct | Wrong |
|------|---------|-------|
| Binding | `[ngModel]="formValue().name"` | `[(ngModel)]="formValue().name"` |
| Name = Path | `name="address.street"` | `name="street"` for nested |
| Optional chaining | `formValue().address?.street` | `formValue().address.street` |
| `only()` call | `only(field);` (unconditional) | `if(field){only(field)}` |
| Nested components | `viewProviders: [vestFormsViewProviders]` | Missing viewProviders |
| Form model type | `NgxDeepPartial<T>` | Plain interface |

## Core Concepts

For detailed patterns on each topic, see [references/form-patterns.md](references/form-patterns.md):

- **Form Models & Types** — `NgxDeepPartial<T>`, `NgxDeepRequired<T>`, form shapes
- **Validation Suites** — `staticSuite`, `only()`, `omitWhen`, async, composable
- **Error Display** — `ngx-control-wrapper`, `ngx-form-group-wrapper`, display modes
- **Nested Forms** — `ngModelGroup`, `vestFormsViewProviders`, child components
- **Cross-field Validation** — `validationConfig`, `createValidationConfig()` builder
- **Root Form Validation** — `ROOT_FORM`, `ngxValidateRootForm`
- **Form Actions** — `resetForm()`, `triggerFormValidation()`, `markAllAsTouched()`
- **Array Utilities** — `arrayToObject()`, `objectToArray()`

## Wrapper Conventions

- Prefer `<ngx-control-wrapper>` element for single controls with label + error display
- Use `ngxFormGroupWrapper` attribute on semantic elements: `<fieldset ngxFormGroupWrapper ngModelGroup="addresses">`
- Use `<ngx-form-group-wrapper>` element when a dedicated group wrapper improves readability
- For groups with multiple descendant controls, use group wrappers (not control wrappers) to avoid accidental control-level ARIA association
- Avoid attribute form on control wrapper (`<div ngx-control-wrapper>`) by default

## Pattern Selection Guide

| Scenario | Pattern |
|----------|--------|
| Single field with errors | `<ngx-control-wrapper>` |
| Grouped field errors | `<fieldset ngxFormGroupWrapper ngModelGroup="...">` |
| Reusable form section | Child component + `viewProviders: [vestFormsViewProviders]` |
| Field A affects Field B | `validationConfig` / `createValidationConfig()` |
| Form-level error (no field) | `ROOT_FORM` + `ngxValidateRootForm` |
| Conditional section | `@if` in template + `omitWhen()` in suite |
| Dynamic array data | `arrayToObject()` / `objectToArray()` |
| Catch `name` typos (dev) | `[formShape]="shape"` input |
| Custom error UI | Host directive: `FormErrorDisplayDirective` |
