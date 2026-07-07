# Troubleshooting diagnostics

ngx-vest-forms logs development-mode diagnostics with `console.warn`. They are silent in production builds, but they are useful signals while building forms and while running tests. If a test intentionally exercises a warning path, spy on `console.warn` and assert the diagnostic so test output stays clean.

## `NGX-100` — divergent same-tick form/model writes

**Meaning:** `ngxVestForm` saw the Angular form value and the bound `[formValue]` model change in the same synchronization turn, but to different values. The form value wins for that turn and the directive advances its internal baselines so later single-sided updates still sync.

**Usually caused by application code, not the library:**

- updating the signal bound to `[formValue]` from a native `(change)` / `(input)` handler on the same control that Angular is already updating
- transforming `(formValueChange)` synchronously into a different model shape, such as auto-filling derived fields or clearing hidden fields before the emitted form snapshot has been accepted
- keeping separate input and output signals where `(formValueChange)` updates one signal but `[formValue]` reads another

**Preferred pattern:** keep one owner for form state. First accept the emitted form snapshot unchanged, then apply derived changes in a later turn if needed.

```ts
protected handleFormChange(value: ProfileFormModel | null): void {
  const nextValue = value ?? {};
  const previousMode = this.formValue().mode;

  this.formValue.set(nextValue);

  if (previousMode !== nextValue.mode) {
    setTimeout(() => {
      this.formValue.set(
        clearFieldsWhen(this.formValue(), {
          businessOnlyField: this.formValue().mode !== 'business',
        })
      );
      this.vestForm().triggerFormValidation();
    }, 0);
  }
}
```

Do not add a separate `(change)` handler that writes to the same signal for ordinary form controls. Let `(formValueChange)` be the single write path.

## `NGX-103` — no `ngxVestForm` context

**Meaning:** a form control or `ngModelGroup` picked up ngx-vest-forms validation bridging, but there is no parent `<form ngxVestForm>` context. Validation is skipped fail-open.

**Usually caused by imports or wrapper usage:**

- importing the full `NgxVestForms` bundle into a component that contains a plain Angular template-driven form
- using `<ngx-form-group-wrapper ngModelGroup="...">` outside a parent `<form ngxVestForm>` when you expected Vest-backed validation

**Fix options:**

- If the form should be Vest-backed, add `ngxVestForm`, `[suite]`, and `[formValue]` to the parent `<form>`.
- If the test/component is only exercising wrapper rendering with a plain Angular form, import only the specific wrapper component instead of the full `NgxVestForms` bundle.

```ts
@Component({
  imports: [FormsModule, FormGroupWrapperComponent],
  template: `
    <form #form="ngForm">
      <ngx-form-group-wrapper ngModelGroup="address">
        ...
      </ngx-form-group-wrapper>
    </form>
  `,
})
class WrapperOnlyHost {}
```

## `NGX-105` — `errorDisplayMode="on-blur"` with `updateOn: 'submit'`

**Meaning:** a control is configured to show errors on blur, but Angular is configured not to update that control until submit. The user will not see blur-time errors.

**Fix:** align validation timing and display timing.

```html
<!-- Blur UX -->
<ngx-control-wrapper [errorDisplayMode]="'on-blur'">
  <input name="email" [ngModel]="formValue().email" />
</ngx-control-wrapper>

<!-- Submit-only UX -->
<ngx-control-wrapper [errorDisplayMode]="'on-submit'">
  <input
    name="email"
    [ngModel]="formValue().email"
    [ngModelOptions]="{ updateOn: 'submit' }"
  />
</ngx-control-wrapper>
```

## `validationConfig` timeout warnings

**Meaning:** the dependent-field pipeline waited for either:

- the form to leave `PENDING`, or
- dependent controls to appear after a dynamic structure change,

then continued after its safety timeout so validation would not stall forever.

**Usually caused by:**

- async validators that never resolve or are too slow for the current timeout
- a `validationConfig` dependent path that is currently hidden or misspelled
- dynamic structures where the trigger change removes the dependent control

**Fix:** make async validators resolve/cancel, keep `name` paths aligned with `[ngModel]`, and pair dynamic structures with field-clearing utilities plus `omitWhen(...)` in the Vest suite.

## Duplicate `ValidationConfigBuilder` warnings

**Meaning:** the fluent builder received the same dependency twice. The builder deduplicates automatically, but warns in development mode because duplicate dependencies often indicate unclear dependency ownership.

**Fix:** remove duplicate builder calls, or consolidate them through `.merge(...)` when combining reusable fragments.

```ts
const validationConfig = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .whenChanged('country', ['state', 'postalCode'])
  .build();
```

## `formContract` diagnostics only appear in development mode

**Meaning:** structural contract diagnostics (`[NGX-001]`, `[NGX-002]`, `[NGX-004]`) are development-only warnings and do not block runtime validity.

**Important behavior:**

- diagnostics run only in `isDevMode()`
- only synchronous Standard Schema results are consumed by this pass
- async schema validations are ignored by diagnostics (Vest suite validation still drives runtime validity)

**Fix:** keep contract checks synchronous when you want developer feedback, and keep business validity in the Vest suite.

## Testing expected warnings

When a test intentionally exercises a warning path, assert it without leaking noisy stderr output:

```ts
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// exercise the warning path

expect(consoleWarnSpy).toHaveBeenCalledWith(
  expect.stringContaining('[NGX-100]')
);
consoleWarnSpy.mockRestore();
```
