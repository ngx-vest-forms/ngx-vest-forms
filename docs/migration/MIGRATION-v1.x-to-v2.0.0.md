# Migration guide: v1.x to v2.0.0

> **Historical guide:** This document covers upgrading from v1.x to **v2.0.0** (Angular 19+, Vest 5). If you are upgrading to **v3.0.0** (Angular 22+, Vest 6), complete this guide only if coming from v1.x, then follow [MIGRATION-v2.x-to-v3.0.0.md](./MIGRATION-v2.x-to-v3.0.0.md).

## Summary of breaking changes in v2.0.0

1. **Unconditional `only(field)` in Vest 5 suites (required).** Remove `if (field)` wrappers around `only(field)`.
2. **`VALIDATION_CONFIG_DEBOUNCE_TIME` constant removed.** Replace with `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`.
3. **Default root-form validation mode changed from `'live'` to `'submit'`.**

## 1. Call `only(field)` unconditionally (Vest 5)

Conditional `if (field) { only(field); }` calls break Vest 5's internal tracking when combined with `omitWhen` and `validationConfig`. Calling `only(undefined)` runs all tests safely.

```ts
// Before (v1.x)
export const suite = staticSuite((model, field?) => {
  if (field) {
    only(field);
  }
  test('email', 'Required', () => {
    enforce(model.email).isNotBlank();
  });
});

// After (v2.0.0)
export const suite = staticSuite((model, field?) => {
  only(field);
  test('email', 'Required', () => {
    enforce(model.email).isNotBlank();
  });
});
```

Find affected suites (matches both single-line and multiline `if (field)` guards):

```bash
grep -rn "if (field)" --include="*.ts"
```

## 2. Replace `VALIDATION_CONFIG_DEBOUNCE_TIME` with `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`

The `VALIDATION_CONFIG_DEBOUNCE_TIME` constant was removed in v2.0.0. Configure dependent-field revalidation debounce through DI (default remains `100` ms):

```ts
import {
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NGX_VALIDATION_DEBOUNCE_PRESETS,
} from 'ngx-vest-forms';

// Application-level configuration
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.default,
    },
  ],
};

// In unit tests (0 ms)
TestBed.configureTestingModule({
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.immediate,
    },
  ],
});
```

## 3. Root-form validation defaults to `'submit'` mode

In v1.x, `validateRootForm` ran on every value change (`'live'`), causing premature cross-field errors before users finished filling related inputs. In v2.0.0, it defaults to `'submit'`.

To keep v1.x live behavior on an existing form, bind the mode explicitly:

```html
<form ngxVestForm ngxValidateRootForm [ngxValidateRootFormMode]="'live'">
  <!-- fields -->
</form>
```

Find forms using root validation:

```bash
grep -rn "validateRootForm" --include="*.ts" --include="*.html"
```

### Updating tests for `'submit'` mode

Unit and integration tests that assert `ROOT_FORM` errors under the default mode must dispatch a submit event first:

```ts
it('validates root form after submit', () => {
  component.formValue.set({ password: '123', confirmPassword: '456' });
  fixture.detectChanges();
  expect(component.errors()[ROOT_FORM]).toBeUndefined();

  const form = fixture.nativeElement.querySelector('form');
  form.dispatchEvent(new Event('submit'));
  fixture.detectChanges();

  expect(component.errors()[ROOT_FORM]).toBeDefined();
});
```

## Notable additions in v2.0.0

- **Unified import array:** `NgxVestForms` (replaces deprecated `vestForms`).
- **`Ngx`-prefixed types:** `NgxDeepPartial<T>`, `NgxDeepRequired<T>`, `NgxVestSuite<T>`, `NgxFieldKey<T>` (v1 aliases remained deprecated in v2 and were removed in v3).
- **`ngx-` selector prefix:** dual `sc-` / `ngx-` selector support in v2 (v3 removes `sc-`).
- **`FormGroupWrapperComponent` (`<ngx-form-group-wrapper>`):** group-safe wrapper for `ngModelGroup` containers.
- **Utilities:** `createValidationConfig()`, `FieldPath<T>` / `LeafFieldPath<T>` / `ValidationConfigMap<T>`, `arrayToObject()` / `deepArrayToObject()` / `objectToArray()`, `stringifyFieldPath()`, `setValueAtPath()`, `clearFieldsWhen()` / `clearFields()` / `keepFieldsWhen()` (top-level keys), `createDebouncedPendingState()`, `createEmptyFormState()`.
- **Accessibility:** WCAG 2.2 AA polite live regions (`role="status"` / `aria-live="polite"`) and `aria-describedby` merging.
- **Browser support:** Uses native `structuredClone()` without a polyfill.

## Migration checklist

- [ ] Remove `if (field)` wrappers around `only(field)` in all Vest 5 suites.
- [ ] Replace `VALIDATION_CONFIG_DEBOUNCE_TIME` with `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`.
- [ ] Review all `validateRootForm` usages and add `[ngxValidateRootFormMode]="'live'"` where live mode is still required.
- [ ] Update tests that expect immediate `ROOT_FORM` errors to trigger form submission.
- [ ] Adopt `NgxVestForms`, `ngx-` selectors, and `Ngx`-prefixed types to prepare for v3.

## Related guides

- [v2.x to v3.0.0 migration guide](./MIGRATION-v2.x-to-v3.0.0.md)
- [Selector prefix migration](../SELECTOR-PREFIX-MIGRATION.md)
- [API tokens](../API-TOKENS.md)
