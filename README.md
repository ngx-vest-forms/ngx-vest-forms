<!-- prettier-ignore -->
<div align="center">

# ngx-vest-forms

Type-safe adapter between Angular template-driven forms and [Vest.js](https://vestjs.dev) validation.

[![npm version](https://img.shields.io/npm/v/ngx-vest-forms.svg?style=flat-square)](https://www.npmjs.com/package/ngx-vest-forms)
[![npm beta](https://img.shields.io/npm/v/ngx-vest-forms/beta.svg?style=flat-square&label=beta&color=orange)](https://github.com/ngx-vest-forms/ngx-vest-forms/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/ngx-vest-forms/ngx-vest-forms/ci.yml?branch=master&style=flat-square&label=Build)](https://github.com/ngx-vest-forms/ngx-vest-forms/actions/workflows/ci.yml)
[![Angular](https://img.shields.io/badge/Angular-22.x-dd0031?style=flat-square&logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Quick start](#quick-start) · [Core concepts](#core-concepts) · [Documentation](#documentation) · [Migration](#migration) · [Examples](#examples)

</div>

> **Version notice:** This README covers **ngx-vest-forms v3** on `master`. For v2.x (Angular >=19, Vest 5), install `ngx-vest-forms@^2` and read the [v2.x README](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/release/v2.x/README.md).

> **Maintainer note:** [Arjen (@the-ult)](https://bsky.app/profile/the-ult.bsky.social) maintains this project since 2025, building on the original library created by Brecht Billiet.

## Why ngx-vest-forms?

- **Unidirectional signal state.** Bind `[ngModel]` one way and update your signal from `(formValueChange)`.
- **Vest 6 validation suites.** Keep sync, async, conditional, and cross-field rules in plain TypeScript functions, separated from your templates.
- **Automatic control wiring.** `ngxVestForm` connects `ngModel` and `ngModelGroup` controls to your suite with field-level `suite.only(field).run(model)` runs.
- **Accessible feedback out of the box.** Built-in `<ngx-control-wrapper>` and `<ngx-form-group-wrapper>` render errors, non-blocking warnings, and debounced pending states with WCAG 2.2 AA live regions.
- **Development-mode form contracts.** Validate control paths against a Standard Schema (such as Zod or Valibot) or an `NgxDeepRequired<T>` object during development with zero production overhead.

## Prerequisites

- **Angular:** `>=22.0.0 <23.0.0`
- **Vest.js:** `>=6.3.4 <7.0.0`
- **RxJS:** `>=7.8.0`
- **Node.js:** `^22.23.4 || ^24.22.1 || ^26.12.1`

## Installation

```bash
npm install ngx-vest-forms@beta vest@^6.3.4
```

v3 ships on the npm `beta` tag until 3.0.0 is stable. Running `npm install ngx-vest-forms` without `@beta` installs v2. See [releases](https://github.com/ngx-vest-forms/ngx-vest-forms/releases) for release notes.

## Quick start

```ts
import { Component, signal } from '@angular/core';
import {
  NgxVestForms,
  type NgxDeepPartial,
  type NgxSubmitSettledEvent,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type ContactFormModel = NgxDeepPartial<{
  email: string;
  name: string;
}>;

// Vest 6 suite: the callback receives only the model.
// ngx-vest-forms runs focused checks via suite.only(field).run(model).
const contactSuite: NgxVestSuite<ContactFormModel> = create(
  (model: ContactFormModel) => {
    test('email', 'Email is required', () => {
      enforce(model.email).isNotBlank();
    });

    test('name', 'Name is required', () => {
      enforce(model.name).isNotBlank();
    });
  }
);

@Component({
  selector: 'app-contact-form',
  imports: [NgxVestForms],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      (submitSettled)="onSubmit($event)"
    >
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="formValue().email" />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="name">Name</label>
        <input id="name" name="name" [ngModel]="formValue().name" />
      </ngx-control-wrapper>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly formValue = signal<ContactFormModel>({});
  protected readonly suite = contactSuite;

  protected onSubmit(event: NgxSubmitSettledEvent<ContactFormModel>): void {
    if (!event.valid) {
      return;
    }

    console.log('Submitted:', event.value);
  }
}
```

### Four rules to follow

1. **Use `[ngModel]`, not `[(ngModel)]`.** Update the model signal through `(formValueChange)` on `<form ngxVestForm>`.
2. **Type form models with `NgxDeepPartial<T>`.** Template-driven forms populate values incrementally, so read nested paths with optional chaining (`formValue().address?.street`).
3. **Match `name` and `ngModelGroup` to the model path.** A `name="street"` inside `ngModelGroup="address"` maps to `address.street`.
4. **Keep Vest 6 suite callbacks model-only.** Write `create((model) => { ... })` and do not call `only()` inside the callback.

For a fuller step-by-step walkthrough, see [Complete example](./docs/COMPLETE-EXAMPLE.md) or run the `/starter` demo in `apps/examples`.

## Core concepts

### Wrappers and display modes

Wrap single controls in `<ngx-control-wrapper>` and `ngModelGroup` containers in `<ngx-form-group-wrapper>`. Both render inline errors, non-blocking warnings (`warn()` in Vest), and a debounced pending indicator for async tests.

Configure visibility per wrapper or app-wide with `NGX_ERROR_DISPLAY_MODE_TOKEN` and `NGX_WARNING_DISPLAY_MODE_TOKEN`:

- **Error display modes:** `'on-blur-or-submit'` (default), `'on-blur'`, `'on-submit'`, `'on-dirty'`, `'always'`.
- **Warning display modes:** `'on-validated-or-touch'` (default), `'on-touch'`, `'on-dirty'`, `'always'`.

Theme the built-in wrappers with CSS custom properties, or build your own wrapper on `FormErrorDisplayDirective` (`ngxErrorDisplay`) and `FormErrorControlDirective` (`ngxErrorControl`). See [Built-in control wrapper](./packages/ngx-vest-forms/src/lib/components/control-wrapper/README.md) and [Custom control wrappers](./docs/CUSTOM-CONTROL-WRAPPERS.md).

### Submitting with async validation

`(ngSubmit)` fires immediately, while async Vest rules may still be `PENDING`. Listen to `(submitSettled)` instead. It emits one `NgxSubmitSettledEvent<T>` (`{ valid, value, errors }`) per submit after dependent revalidation, `ROOT_FORM` rules, and async validators finish. If the user submits again while an earlier submit is still pending, the newer submit replaces the earlier one so only the latest emits. On an invalid submit, the form focuses the first invalid control automatically (`[focusFirstInvalidOnSubmit]="false"` disables this).

### Cross-field and root-form rules

- Use `[validationConfig]` (with `createValidationConfig<T>()`) when changing one field must revalidate another, such as password confirmation or conditional `omitWhen`/`skipWhen` rules.
- Use `ngxValidateRootForm` with `ROOT_FORM` when an error belongs to the whole form rather than a single input (for example, "provide either an email or a phone number").

See [ValidationConfig vs root-form](./docs/VALIDATION-CONFIG-VS-ROOT-FORM.md) and [ValidationConfig builder](./docs/VALIDATION-CONFIG-BUILDER.md).

### Development-mode form contracts

Pass a [Standard Schema v1](https://standardschema.dev) schema (such as Zod v4 or Valibot) or an `NgxDeepRequired<T>` object via `provideFormContract(...)` (or `[formContract]` when it varies per instance). In development mode, ngx-vest-forms warns in the console when a control `name` or value shape drifts from the contract, without affecting runtime validity or production bundles.

```ts
@Component({
  imports: [NgxVestForms],
  providers: [provideFormContract(myZodSchema)],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <input name="email" [ngModel]="formValue().email" />
      <div ngModelGroup="address">
        <input name="street" [ngModel]="formValue().address?.street" />
      </div>
    </form>
  `,
})
export class AddressFormComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly suite = mySuite;
}
```

### Dynamic forms and Signal Forms controls

- **Dynamic fields:** Clear hidden model fields inside `(formValueChange)` with `clearFieldsWhen()`, purge removed fields from Vest 6 state with `vestForm().removeField(path)`, and call `triggerFormValidation()` when switching between form controls and static text without a value change. See [Field clearing utilities](./docs/FIELD-CLEARING-UTILITIES.md) and [Structure change detection](./docs/STRUCTURE_CHANGE_DETECTION.md).
- **Signal Forms custom controls:** Components implementing Angular Signal Forms `FormValueControl` or `FormCheckboxControl` work with `[ngModel]` inside `<form ngxVestForm>` without a `ControlValueAccessor`. See [Custom control wrappers](./docs/CUSTOM-CONTROL-WRAPPERS.md#signal-forms-controls-inside-a-wrapper) and `/signal-forms-interop` in `apps/examples`.

## Documentation

### Getting started

- [Complete example](./docs/COMPLETE-EXAMPLE.md) - Step-by-step form setup, contract diagnostics, and derived feedback signals
- [Composable validations](./docs/COMPOSABLE-VALIDATIONS.md) - Reusable Vest 6 validation helpers, `memo()`, async `AbortSignal`, and `validationFocus`

### Validation and form lifecycle

- [ValidationConfig vs root-form](./docs/VALIDATION-CONFIG-VS-ROOT-FORM.md) - Choose between `validationConfig`, `ROOT_FORM`, and `triggerFormValidation()`
- [ValidationConfig builder](./docs/VALIDATION-CONFIG-BUILDER.md) - Type-safe fluent API for dependent-field revalidation
- [Field clearing utilities](./docs/FIELD-CLEARING-UTILITIES.md) - Clear hidden fields with `clearFieldsWhen`, `clearFields`, `keepFieldsWhen`, and `removeField()`
- [Structure change detection](./docs/STRUCTURE_CHANGE_DETECTION.md) - Re-evaluate validity when templates switch between controls and static content
- [Clear submitted state](./docs/CLEAR-SUBMITTED-STATE.md) - End a submit cycle without resetting values or touched state

### UI, composition, and patterns

- [Built-in control wrapper](./packages/ngx-vest-forms/src/lib/components/control-wrapper/README.md) - Inputs, display modes, ARIA modes, and CSS theming tokens
- [Custom control wrappers](./docs/CUSTOM-CONTROL-WRAPPERS.md) - Build custom wrappers with `ngxErrorDisplay`, `ngxErrorControl`, debounced pending states, and Signal Forms controls
- [Accessibility](./docs/ACCESSIBILITY.md) - WCAG 2.2 AA live regions, ARIA widget association, and first-invalid focus
- [Child components](./docs/CHILD-COMPONENTS.md) - Split large forms with `vestFormsViewProviders` and `ngModelGroup`
- [Composite adapter recipe](./docs/COMPOSITE-ADAPTER-RECIPE.md) - Map one composite widget (such as a date-range picker) to multiple field paths
- [Auto-save on blur](./docs/AUTO-SAVE-ON-BLUR.md) - Build draft persistence with `(fieldBlur)` and quiet dependent validation

### Configuration and reference

- [API tokens](./docs/API-TOKENS.md) - Global and component-level DI tokens (`NGX_ERROR_DISPLAY_MODE_TOKEN`, `NGX_WARNING_DISPLAY_MODE_TOKEN`, `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`, `NGX_FORM_CONTRACT`, `NGX_PENDING_LABEL`, `NGX_EQUALITY_FN`)
- [Field path types](./docs/FIELD-PATHS.md) - Compile-time path types (`FieldPath<T>`, `ValidationConfigMap<T>`, `FormFieldName<T>`)
- [Suite type compatibility](./docs/TYPE-COMPATIBILITY.md) - Typing suites with `NgxVestSuite<T>` and schema-typed suites
- [Utilities reference](./packages/ngx-vest-forms/src/lib/utils/README.md) - Canonical reference for public and `ngx-vest-forms/internal` utilities
- [Troubleshooting diagnostics](./docs/TROUBLESHOOTING.md) - Every `NGX-xxx` development-mode warning and how to fix it
- [Security policy](./SECURITY.md) - Vulnerability reporting and supported versions

## Migration

- [v2.x to v3.0.0 migration guide](./docs/migration/MIGRATION-v2.x-to-v3.0.0.md)
- [Selector prefix migration (`sc-` to `ngx-`)](./docs/SELECTOR-PREFIX-MIGRATION.md)
- [v1.x to v2.0.0 migration guide](./docs/migration/MIGRATION-v1.x-to-v2.0.0.md)

### Older versions

- [v2.x README](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/release/v2.x/README.md) and [v2.x docs](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/release/v2.x/docs) (`npm install ngx-vest-forms@^2`)
- [v1.x README](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/release/v1.x/README.md)

## Examples

The workspace includes a runnable [Examples App](./apps/examples) covering starter forms, async validation, warnings, Zod and native Vest schemas, nested repeatable forms, custom `ControlValueAccessor` and Signal Forms controls, composite adapters, auto-save on blur, and a multi-form wizard.

Run it locally:

```bash
corepack enable
pnpm install
pnpm start
```

For end-to-end Playwright test setup, see [apps/examples-e2e/README.md](./apps/examples-e2e/README.md).

## FAQ

### Do I need a Vest suite to use ngx-vest-forms?

No. You can bind `<form ngxVestForm [formValue]="formValue()" (formValueChange)="formValue.set($event)">` without `[suite]` while prototyping, migrating incrementally, or relying on server-side errors, and attach `[suite]` later.

## Developer resources

### Agent skills

Install the published Agent Skills for AI coding assistants:

```bash
npx skills add ngx-vest-forms/ngx-vest-forms --skill ngx-vest-forms
npx skills add ngx-vest-forms/ngx-vest-forms --skill vestjs
```

The `ngx-vest-forms` skill checks the version installed in your project, answers v2 projects from the v2 docs, and includes a v2-to-v3 migration workflow. See [Vest.js agent skill guide](./docs/VESTJS-SKILL.md) and [AGENTS.md](./AGENTS.md).

### External learning resources

- [Angular template-driven forms guide](https://angular.dev/guide/forms)
- [Vest.js documentation](https://vestjs.dev)
- [Complex Angular Template-Driven Forms course](https://www.simplified.courses/complex-angular-template-driven-forms)
- Founding articles by Brecht Billiet:
  - [Introducing ngx-vest-forms](https://blog.simplified.courses/introducing-ngx-vest-forms/)
  - [Making Angular Template-Driven Forms Type-Safe](https://blog.simplified.courses/making-angular-template-driven-forms-typesafe/)
  - [Asynchronous Form Validators in Angular with Vest](https://blog.simplified.courses/asynchronous-form-validators-in-angular-with-vest/)
  - [Template-Driven Forms with Form Arrays](https://blog.simplified.courses/template-driven-forms-with-form-arrays/)

## Acknowledgments

- **[Brecht Billiet](https://twitter.com/brechtbilliet)** - Original creator of ngx-vest-forms.
- **[Arjen (@the-ult)](https://github.com/the-ult)** - Lead maintainer since 2025.
- **[Evyatar Alush](https://twitter.com/evyataral)** - Creator of [Vest.js](https://vestjs.dev/) ([PodRocket interview](https://dev.to/podrocket/vest-with-evyatar-alush)).
- **[Ward Bell](https://twitter.com/wardbell)** - Creator of [ngc-validate](https://github.com/wardbell/ngc-validate) and speaker on template-driven forms ([Prefer Template-Driven Forms](https://devconf.net/talk/prefer-template-driven-forms-ward-bell-ng-conf-2021), [Form validation done right](https://www.youtube.com/watch?v=EMUAtQlh9Ko)).

## License

MIT. See [LICENSE](LICENSE).
