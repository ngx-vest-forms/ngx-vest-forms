---
name: migration
description: Step-by-step upgrade of an app from ngx-vest-forms v2 to v3, including Vest 5 to 6. Read it when the user asks to upgrade, or when v2 code (`sc-` selectors, `[formShape]`, `staticSuite`, `only(field)` in suites, removed exports) meets a v3 install.
---

# Migrate ngx-vest-forms v2 → v3

Work through the steps in order, in the user's project. The migration is done when the inventory in step 2 comes back empty, the project type-checks and builds, and its tests pass. The human-oriented source for every step is [`MIGRATION-v2.x-to-v3.0.0.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/migration/MIGRATION-v2.x-to-v3.0.0.md); read the matching section there when a step needs more than the table gives.

## 1. Meet the requirements

v3 requires Angular `>=22 <23` (core and forms), Vest `>=6.3.4 <7`, TypeScript `~6.0` and Node `^22.22.3 || ^24.15.0 || ^26`. If the app is on an older Angular, finish the Angular upgrade first; it is a separate migration. Then install:

```bash
npm install ngx-vest-forms@beta vest@^6.3.4   # use ngx-vest-forms@^3 once 3.0.0 is stable
```

`@standard-schema/spec` is a peer only for apps that hand-write `StandardSchemaV1` objects. `@angular/common` is no longer a peer.

## 2. Take the inventory

Run this from the project root and keep the output; every hit is a site some later step changes, and the same command is the final check.

```bash
grep -rnE --include='*.ts' --include='*.html' --include='*.css' --include='*.scss' --exclude-dir=node_modules --exclude-dir=dist \
  -e '\bsc-(control|form-group)-wrapper\b|\bsc(VestForm|ControlWrapper|FormGroupWrapper)\b|\sngx-control-wrapper[\s=>]' \
  -e '\bvalidateRootForm(Mode)?\b|\bform(ControlState|ErrorDisplay|ErrorControl)\b' \
  -e '\b(vestForms|ROOT_FORM_CONSTANT|DeepPartial|DeepRequired|NgxTypedVestSuite|(Ngx)?FormCompatibleDeepRequired|cloneDeep|validateShape|SC_ERROR_DISPLAY_MODE_TOKEN|ScErrorDisplayMode)\b' \
  -e '\b(fastDeepEqual|shallowEqual|parseFieldPath|getFormControlField|getFormGroupField|mergeValuesAndRawValues)\b' \
  -e '\bformShape\b|\bstaticSuite\b|\bpromisify\b|\btest\.memo\b|\bonly\(' \
  -e "['\"][A-Za-z0-9_.]*\[[0-9]+\]"
```

Also list every `import … from 'ngx-vest-forms'` that names `set`, and every call to `getAllFormErrors`; multi-line imports and that short name escape the regex.

## 3. Rewrite selectors and template refs

Run the codemod in [`SELECTOR-PREFIX-MIGRATION.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/SELECTOR-PREFIX-MIGRATION.md), or apply this map by hand:

| v2                                                                                                    | v3                                                      |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `scVestForm`, `#f="scVestForm"`                                                                       | `ngxVestForm`, `#f="ngxVestForm"`                       |
| `validateRootForm`, `[validateRootFormMode]`                                                          | `ngxValidateRootForm`, `[ngxValidateRootFormMode]`      |
| `formControlState`, `formErrorDisplay`, `formErrorControl` (attribute and `exportAs`)                 | `ngxControlState`, `ngxErrorDisplay`, `ngxErrorControl` |
| `<sc-control-wrapper>`, `[scControlWrapper]`, `sc-control-wrapper` / `ngx-control-wrapper` attributes | `<ngx-control-wrapper>`, `ngxControlWrapper`            |
| `<sc-form-group-wrapper>`, `[scFormGroupWrapper]`                                                     | `<ngx-form-group-wrapper>`, `ngxFormGroupWrapper`       |

Update CSS that targets removed `sc-` host classes.

## 4. Rename removed exports

| v2                                                                                                                       | v3                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `vestForms`                                                                                                              | `NgxVestForms`                                                                                                          |
| `ROOT_FORM_CONSTANT`                                                                                                     | `ROOT_FORM`                                                                                                             |
| `DeepPartial<T>`, `DeepRequired<T>`                                                                                      | `NgxDeepPartial<T>`, `NgxDeepRequired<T>`                                                                               |
| `NgxTypedVestSuite<T>`                                                                                                   | `NgxVestSuite<T>`                                                                                                       |
| `SC_ERROR_DISPLAY_MODE_TOKEN`, `ScErrorDisplayMode`                                                                      | `NGX_ERROR_DISPLAY_MODE_TOKEN`, `NgxErrorDisplayMode`                                                                   |
| `cloneDeep(v)`                                                                                                           | `structuredClone(v)` (global, no import)                                                                                |
| `set(obj, path, v)`                                                                                                      | `setValueAtPath(obj, path, v)`                                                                                          |
| `FormCompatibleDeepRequired<T>`, `NgxFormCompatibleDeepRequired<T>`                                                      | express the date coercion in a schema (`z.union([z.date(), z.literal('')])`), or copy the type from the migration guide |
| `validateShape(...)`                                                                                                     | `toFormContract(shape)`, or let `[formContract]` take the shape directly                                                |
| `fastDeepEqual`, `shallowEqual`, `parseFieldPath`, `getFormControlField`, `getFormGroupField`, `mergeValuesAndRawValues` | the same names from `'ngx-vest-forms/internal'` (no semver guarantees), or app code                                     |

## 5. Rewrite every suite for Vest 6

Each change is mechanical. A suite is done when its callback takes only the model and contains no `only()`:

```ts
// v2 (Vest 5)
const suite: NgxVestSuite<Model> = staticSuite((model, field?) => {
  only(field);
  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });
});

// v3 (Vest 6)
const suite: NgxVestSuite<Model> = create((model) => {
  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });
});
```

- `staticSuite(...)` → `create(...)`; outside the form (server code, scripts) run it with `suite.runStatic(model)`. `runStatic` is on the suite's inferred type, not on `NgxVestSuite<T>`, so a suite run that way is declared `create((model: NgxDeepPartial<Model>) => { … }) satisfies NgxVestSuite<Model>` instead of with a type annotation.
- Drop the `field` parameter and the `only(field)` call. Code outside the form that ran one field calls `suite.only(field).run(model)`.
- `promisify(suite)(model)` → `await suite.run(model)`.
- `test.memo(name, msg, fn, deps)` → `memo(() => { test(name, msg, fn); }, deps)` with `import { memo } from 'vest/memo'`.
- Async tests: pass the `signal` from the test context into `fetch` (or `takeUntil(fromEvent(signal, 'abort'))` for RxJS) so stale requests are cancelled.
- Tests of the suite: shared `create()` suites need `beforeEach(() => suite.reset())`; see [`../core/references/testing-vest-6.md`](../core/references/testing-vest-6.md).

For Vest changes beyond these (enforce rules, `group`, `each`, result access), use the `vestjs` skill.

## 6. Replace `[formShape]`

`[formShape]="shape"` → `[formContract]="shape"`; the `NgxDeepRequired<T>` shape is still accepted. When the app already has a Zod/Valibot/ArkType schema for the model, pass that instead. When the contract is fixed per component, move it to `providers: [provideFormContract(shape)]` and drop the binding.

## 7. Update error reads and array keys

- `getAllFormErrors(form)` returns `{ errors, warnings }`: `all['user.name']` → `all.errors['user.name']`, and the old non-enumerable `.warnings` on an errors array → `all.warnings['user.name']`. `(errorsChange)` still emits the plain errors record.
- Array indices are dot segments everywhere the library reports a path: `errors['users[0].name']` → `errors['users.0.name']`, and touched/validated paths `contacts[0]` → `contacts.0`.

## 8. Type `validationConfig`

The `[validationConfig]` binding is checked against the model, so a typo'd path is now a compile error. Annotate the object as `NgxValidationConfig<Model>` or build it with `createValidationConfig<Model>()`. For runtime paths `FieldPath<T>` cannot express (`'addresses.0.street'`), cast the built object: `config as NgxValidationConfig<Model>`.

## 9. Review behavior changes

These compile unchanged; check each site the user has:

- **Model writes emit form events.** `ngForm.form.valueChanges`, `statusChanges` and `events` now fire when `[formValue]` changes, not only on user input. A subscriber that writes back to the model or starts a request needs a guard such as comparing against the last value it handled. Grep for `valueChanges`, `statusChanges` and `.events` on the form.
- **Submit-mode root validation runs before `(ngSubmit)`.** Handlers that worked around a late `ROOT_FORM` error can drop the workaround. With async tests, move the submit decision to `(submitSettled)`.
- **ARIA on custom widgets.** Wrappers in `all-controls` mode now stamp `aria-invalid`/`aria-describedby` on elements with a form-widget role (`combobox`, `radiogroup`, `slider`, `switch`, …). Remove manual `aria-invalid` workarounds on such widgets.
- **Wrapper message ids** include a non-default `APP_ID` (`ngx-control-wrapper-<APP_ID>-0-error`). Update CSS selectors and tests that match the old ids; in tests, prefer matching by role or text.

## 10. Verify

Re-run the step 2 inventory until only intentional hits remain (for example an app's own `only(` outside a suite). Then run the project's type-check or build and its tests. Report any hit or failure you left in place, with the reason.
