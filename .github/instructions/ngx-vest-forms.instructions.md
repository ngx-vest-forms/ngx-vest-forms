---
description: ngx-vest-forms v2.0 - Angular Template-Driven Forms with Vest.js validation
applyTo: '**/*.ts, **/*.html'
---

# ngx-vest-forms invariants

Use this file as the **always-on guardrail sheet** for ngx-vest-forms.
Keep detailed examples and feature-specific workflows in the docs and the
`.github/skills/ngx-vest-forms/` workflow sub-skills.

> **v2.0** | Angular 21+ | Vest.js 5.x | See `vest.instructions.md` for deeper Vest validation patterns.

## Non-negotiable rules

| Rule | Correct | Wrong |
|------|---------|-------|
| Binding | `[ngModel]="formValue().name"` | `[(ngModel)]="formValue().name"` |
| Name = Path | `name="address.street"` | `name="street"` |
| Optional chaining | `formValue().address?.street` | `formValue().address.street` |
| `only()` call | `only(field);` | `if (field) { only(field); }` |
| Child form components | `viewProviders: [vestFormsViewProviders]` | Missing `viewProviders` |
| Single-control wrapper | `<ngx-control-wrapper>` | Group-level misuse of control wrapper |
| Group wrapper | `<ngx-form-group-wrapper ngModelGroup="..."></ngx-form-group-wrapper>` | `ngx-control-wrapper` around a full `ngModelGroup` |

## Canonical default pattern

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FormFieldName,
  NgxDeepPartial,
  NgxTypedVestSuite,
  NgxVestForms,
} from 'ngx-vest-forms';
import { enforce, only, staticSuite, test } from 'vest';

type FormModel = NgxDeepPartial<{ firstName: string; email: string }>;

const suite: NgxTypedVestSuite<FormModel> = staticSuite(
  (model: FormModel, field?: FormFieldName<FormModel>) => {
    only(field);
    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });
    test('email', 'Valid email is required', () => {
      enforce(model.email).isEmail();
    });
  }
);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <ngx-control-wrapper>
        <label for="firstName">First name</label>
        <input id="firstName" name="firstName" [ngModel]="formValue().firstName" />
      </ngx-control-wrapper>
    </form>
  `,
})
export class ExampleComponent {
  protected readonly formValue = signal<FormModel>({});
  protected readonly suite = suite;
}
```

## Use these defaults unless the user’s intent clearly differs

- Model forms with `NgxDeepPartial<T>`.
- Recommend a `NgxDeepRequired<T>` shape for real nested forms where path mistakes are easy.
- Prefer `NgxTypedVestSuite<T>` plus `FormFieldName<T>` in TypeScript.
- Use `ChangeDetectionStrategy.OnPush` with signals.
- Prefer `<ngx-control-wrapper>` for single controls.
- Prefer `<ngx-form-group-wrapper>` for `ngModelGroup` containers and multi-control sections.

## Decision hints

- If field A changing should revalidate field B, use `validationConfig`.
  - See `docs/VALIDATION-CONFIG-BUILDER.md`
  - See `docs/VALIDATION-CONFIG-VS-ROOT-FORM.md`
- If a dependent field becomes invalid immediately but should stay visually quiet
  until its own blur, pair `validationConfig` with `[errorDisplayMode]="'on-blur'"`
  on the dependent wrapper(s). Do **not** add `(blur)` handlers that call
  `triggerFormValidation()` to force this timing.
- If the error belongs to the whole form rather than one field, use `ROOT_FORM` with `ngxValidateRootForm`.
  - See `docs/VALIDATION-CONFIG-VS-ROOT-FORM.md`
- If the form is split into child components, every participating child needs `vestFormsViewProviders`.
  - See `docs/CHILD-COMPONENTS.md`
- If the UI swaps controls for static content or clears hidden values, pair field clearing with `triggerFormValidation()` when needed.
  - See `docs/FIELD-CLEARING-UTILITIES.md`
  - See `docs/STRUCTURE_CHANGE_DETECTION.md`
- If the app needs blur-driven side effects (draft auto-save, analytics,
  field-level persistence), use the form's `fieldBlur` output with
  `NgxFieldBlurEvent<T>` — not `(blur)` handlers that re-trigger validation.
  - See `docs/AUTO-SAVE-ON-BLUR.md`
- If the built-in wrappers are not enough, use the custom wrapper directives instead of hand-rolling validation state.
  - See `docs/CUSTOM-CONTROL-WRAPPERS.md`

## Common mistakes to correct immediately

- `[(ngModel)]` in ngx-vest-forms examples
- `name` values that do not match the bound property path
- direct property access on partial models without `?.`
- conditional `only()` calls
- missing `vestFormsViewProviders` in nested child form components
- using `ROOT_FORM` for what should be a field-level error
- treating `validationConfig` as validation logic instead of revalidation timing
- `(blur)="vestForm.triggerFormValidation(...)"` to force dependent-field error timing — use `validationConfig` + wrapper `errorDisplayMode` instead
- gating draft auto-save on `event.pending` — that blocks persistence in exactly the case auto-save exists for

## Deep references

- `README.md`
- `docs/COMPLETE-EXAMPLE.md`
- `docs/VALIDATION-CONFIG-BUILDER.md`
- `docs/VALIDATION-CONFIG-VS-ROOT-FORM.md`
- `docs/CHILD-COMPONENTS.md`
- `docs/CUSTOM-CONTROL-WRAPPERS.md`
- `docs/FIELD-CLEARING-UTILITIES.md`
- `docs/STRUCTURE_CHANGE_DETECTION.md`
- `docs/AUTO-SAVE-ON-BLUR.md`
- `projects/ngx-vest-forms/src/public-api.ts`
