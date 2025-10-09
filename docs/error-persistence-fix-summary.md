# Error Persistence Bug Fix - Summary

## Issue Report

User reported that in the nested forms example (http://localhost:4200/fundamentals/nested-forms), when using 'on-touch' error display mode:

- Filling firstName with invalid data → blur → error appears ✅
- Filling lastName with invalid data → blur → error appears ✅
- **BUG**: firstName error disappears when lastName is validated ❌

## Root Cause Analysis

### The Problem

The nested forms example was using `staticSafeSuite` (stateless) instead of `createSafeSuite` (stateful).

### How Vest Suite Types Work

#### `staticSafeSuite` (wraps Vest's `staticSuite`)

- **Stateless**: Each validation call is completely independent
- When validating with `only(field)`, Vest only returns errors for that specific field
- Previous field errors are discarded because there's no state maintained between calls
- **Use case**: Server-side validation, single-field forms

#### `createSafeSuite` (wraps Vest's `create`)

- **Stateful**: Maintains validation state across calls
- When validating with `only(field)`, Vest remembers errors from previously validated fields
- All touched field errors remain visible even when validating a different field
- **Use case**: Multi-field forms with progressive error disclosure (the default for most UI forms)

### Why This Matters for Forms

In 'on-touch' error display mode:

1. User fills firstName → blur → validation runs with `only('firstName')` → error stored
2. User fills lastName → blur → validation runs with `only('lastName')`
3. **With staticSafeSuite**: Only lastName error returned, firstName error lost ❌
4. **With createSafeSuite**: Both firstName and lastName errors returned ✅

## Examples Fixed

### ✅ Changed from `staticSafeSuite` to `createSafeSuite`:

1. **example-form-nested** (originally reported bug)
   - Multiple sections: personalInfo, addressInfo, preferences
   - Fields: firstName, lastName, email, street, city, zipCode, country, newsletter, notifications

2. **field-states**
   - Fields: email, username, password
   - Demonstrates field state changes

3. **form-field-showcase**
   - Fields: name, email, website, age, bio, country, agreeToTerms
   - Showcases NgxVestFormField wrapper

4. **zod-basic**
   - Fields: email, username, password, confirmPassword, age, agreeToTerms
   - Two-layer validation (Zod schema + Vest business logic)

5. **example-form-array**
   - Dynamic array of interest items
   - Each item needs error persistence

6. **example-form-simple**
   - Fields: email, verifyEmail
   - Cross-field validation with `include().when()`

### ✅ Already Using `createSafeSuite` (No Changes):

7. **basic-validation**
   - Fields: name, email, age, role, bio, agreeToTerms
   - Already correctly implemented

8. **error-display-modes**
   - Multiple fields for product feedback form
   - Already correctly implemented

### ✅ Correctly Using `staticSafeSuite` (No Changes):

9. **minimal-form**
   - Single field: email only
   - Stateless suite appropriate for this simple case

## Automated Tests Created

Created comprehensive Playwright test suite: `tests/error-persistence.spec.ts`

### Test Coverage:

1. **Multiple field errors should persist simultaneously**
   - Fill field A with invalid data → blur → verify error
   - Fill field B with invalid data → blur → verify error
   - **Assert**: Both errors remain visible (regression test)

2. **Errors should persist when navigating to third field**
   - Tests with 3 fields to ensure persistence across multiple navigations
   - Verifies debug panel shows all 3 errors

3. **Fixing one field should not clear other field errors**
   - Create errors in 2 fields
   - Fix field A
   - **Assert**: Field B error still visible

4. **Nested form section errors should persist across sections**
   - Tests the originally reported bug in nested forms
   - Verifies firstName and lastName errors persist simultaneously

5. **Valid/Invalid indicators should update correctly**
   - Initial state: Valid: ❌, Invalid: ❌ (untested)
   - After invalid input: Valid: ❌ (errors exist)
   - After fixing all: Valid: ✅, Invalid: ❌ (no errors)

### Test Results:

```
✓  5 passed (4.7s)
```

All tests passing! ✅

## Valid/Invalid State Explanation

### Question: Why does http://localhost:4200/fundamentals/basic-validation show both Valid: ❌ and Invalid: ❌ initially?

**Answer**: This is **correct behavior** for 'on-touch' error display mode!

The form has **three possible states**:

1. **✅ Valid** (all validations passed)
   - Valid: ✅
   - Invalid: ❌
   - All tests have run and passed

2. **❌ Invalid** (validations failed)
   - Valid: ❌
   - Invalid: ✅
   - Tests have run and errors exist

3. **➖ Untested/Pristine** (no validations run yet)
   - Valid: ❌
   - Invalid: ❌
   - No user interaction, no tests run

### How It Works:

**`valid()` computed signal:**

```typescript
const valid = computed(() => {
  const hasSchemaErrors = Object.keys(schemaErrors()).length > 0;
  return !hasSchemaErrors && suiteResult().isValid();
});
```

- Returns `true` ONLY when no schema errors AND `suiteResult().isValid()` is `true`
- Initially, no tests have run, so Vest considers it "not valid" (not the same as "invalid")

**`invalid()` computed signal:**

```typescript
const invalid = computed(() => {
  const allErrors = errors();
  return Object.keys(allErrors).some((key) => allErrors[key].length > 0);
});
```

- Returns `true` ONLY when there are actual errors in the errors object
- Initially, no validation has run in 'on-touch' mode, so no errors exist yet

This design prevents showing misleading "invalid" states before the user has interacted with the form, which is critical for progressive validation UX.

## Documentation Updates Needed

### safe-suite.ts Documentation

The current documentation says `staticSafeSuite` is "recommended for most use cases" but this is **misleading** for UI forms.

**Recommended update:**

- `staticSafeSuite`: "Recommended for server-side validation and single-field forms"
- `createSafeSuite`: "Recommended for multi-field forms with progressive error disclosure (most UI forms)"

Add warning:

> ⚠️ **Important**: Multi-field forms with 'on-touch' or 'on-submit' error display modes MUST use `createSafeSuite` to maintain error state across field navigation. Using `staticSafeSuite` will cause touched field errors to disappear when validating other fields.

## Files Changed

### Examples Fixed:

- `projects/examples/src/app/01-fundamentals/example-form-nested/example-form-nested.validations.ts`
- `projects/examples/src/app/01-fundamentals/field-states/field-states.validations.ts`
- `projects/examples/src/app/02-form-field/form-field-showcase/form-field-showcase.validations.ts`
- `projects/examples/src/app/03-schemas/zod-basic/zod-basic.validations.ts`
- `projects/examples/src/app/01-fundamentals/example-form-array/example-form-array.validation.ts`
- `projects/examples/src/app/01-fundamentals/example-form-simple/example-form-simple.validation.ts`

### Tests Created:

- `tests/error-persistence.spec.ts` (NEW - 5 comprehensive test cases)

### Documentation to Update:

- `projects/ngx-vest-forms/core/src/lib/utils/safe-suite.ts` (recommendations needed)

## Conclusion

✅ **Bug Fixed**: All multi-field examples now use `createSafeSuite` for proper error persistence

✅ **Tests Created**: 5 comprehensive Playwright tests ensure this regression won't happen again

✅ **Documentation Clarified**: Added explanatory comments to all fixed examples explaining why `createSafeSuite` is required

✅ **Valid/Invalid State**: Confirmed that showing both as ❌ initially is correct behavior for untested forms

The error persistence issue is now fully resolved with automated tests in place to prevent regression.
