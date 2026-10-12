# Vest-First Business Policy

A business-account application that models real policy in plain Vest:
conditional rules, a cross-field constraint, and advisory guidance that is kept
deliberately separate from blocking errors.

## Why it exists

Business forms are mostly *policy*, not field presence. The interesting rules
are conditional ("VAT ID only for EU businesses"), cross-field ("credit limit
must fit the revenue band"), and advisory ("this looks high — expect manual
review"). Advisory guidance should never block a submit. Vest expresses all of
this naturally with `omitWhen`, `ROOT_FORM`, and `warn()`, and the suite stays a
plain, unit-testable spec with no Angular dependency.

## The policy

### Errors — these block submission

- `accountType` is required
- `legalName` is required
- `country` is required
- `vatId` is required **only** when `accountType === 'business'` **and**
  `country` is in the EU set (conditional via `omitWhen`)
- `requestedCreditLimit` must be greater than 0
- `paymentTermsDays` must be one of 0, 14, 30, 60
- **ROOT_FORM cross-field rule:** a business account with
  `annualRevenue < 50000` may not request `requestedCreditLimit > 10000`
  ("Credit limit exceeds policy for this revenue band")

### Warnings — advisory only, never block submission (`warn()`)

- `requestedCreditLimit > annualRevenue * 0.5` →
  "Requested credit limit is high relative to revenue — expect manual review"
- `paymentTermsDays >= 60` → "Long payment terms may slow onboarding"
- `accountType === 'personal'` and `requestedCreditLimit > 5000` →
  "Personal accounts above 5000 usually need a business upgrade"

A form carrying only warnings still submits successfully — the page checks
`formState().valid` (errors only) before accepting the submission.

## Why Vest expresses this naturally

- `omitWhen` keeps a conditional rule out of the suite entirely until its
  precondition holds, so the VAT-ID error simply does not exist for personal or
  non-EU accounts.
- `ROOT_FORM` gives cross-field policy a single home rather than smearing it
  across two field validators.
- `warn()` flips a test from blocking to advisory with one call, so guidance
  and hard failures share the same authoring model but are surfaced separately.
- The suite is plain Vest: `businessPolicySuite.runStatic(model)` can be asserted in a
  unit test without rendering Angular.

## ngx-vest-forms APIs showcased

- `NgxVestForms`, `FormDirective`, `provideFormContract`
- `createValidationConfig()` with `.whenChanged()` and `.bidirectional()`
  (revalidates the conditional VAT-ID field and the revenue/credit-limit pair)
- `createFormFeedbackSignals()` for `formState`, `warnings`,
  `validatedFields`, `pending`
- `ROOT_FORM`, `NgxVestSuite`, `NgxDeepPartial`, `NgxDeepRequired`
- Vest `create`, `test`, `enforce`, `omitWhen`, `warn`

## Key files

- `business-policy.page.ts` / `.html` — page shell; owns the form value, suite
  and validation config; gates submit on errors only
- `business-policy.form.ts` / `.html` — form body; conditional VAT-ID field via
  `@if`
- `business-policy.validations.ts` — the Vest suite plus the error/warning
  rule maps
- `../../models/business-policy.model.ts` — model and contract
