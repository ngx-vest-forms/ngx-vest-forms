# E2E Tests for ngx-vest-forms Examples

Comprehensive end-to-end tests for the three demo forms showcasing ngx-vest-forms functionality and validating fixes from PR #60.

## Test Structure

### Test Files

- **`example.spec.ts`** - Smoke tests for basic navigation and routing
- **`purchase-form.spec.ts`** - Comprehensive tests for the complex purchase form
- **`business-hours-form.spec.ts`** - Tests for array-based business hours form
- **`validation-config-demo.spec.ts`** - Tests for validationConfig patterns and race condition fixes

### Helper Functions

- **`helpers/form-helpers.ts`** - Reusable utilities for form testing, validation monitoring, and accessibility checks

## Running Tests

### Prerequisites

1. Start the development server:

   ```bash
   npm start
   ```

   The app should be running at `http://localhost:4200`

### Run All Tests

```bash
# Run all e2e tests
npm run ng e2e

# Or using Playwright directly
npx playwright test

# Run specific test file
npx playwright test e2e/purchase-form.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View Test Report

```bash
npx playwright show-report
```

## Test Coverage

### Purchase Form Tests

**Covered Scenarios:**

- Basic field validation (required fields)
- Conditional validations (age → emergencyContact, gender → genderOther, quantity → justification)
- Bidirectional validations (password ↔ confirmPassword, quantity ↔ justification)
- Async validation (userId via SWAPI)
- Auto-population effects (Brecht Billiet, Luke Skywalker)
- Shipping address state preservation
- Utility functions (clear sensitive data, prefill address, fetch data)
- ROOT_FORM validation ("Brecht is not 30 anymore")
- Phone numbers array validation
- Product selection validation
- Address validation (nested forms)

**PR #60 Issues Tested:**

- ✅ ROOT_FORM validation appears correctly
- ✅ Bidirectional validation without infinite loops
- ✅ Conditional field rendering with proper validation
- ✅ Cross-field validation with current values

### Business Hours Form Tests

**Covered Scenarios:**

- ROOT_FORM array requirement (≥1 business hour)
- Time format validation (4 digits, HH < 24, MM < 60)
- Chronological ordering (to > from)
- Overlapping time slot detection
- Add/edit/remove operations
- Multi-slot cross-validation
- Form state display

**PR #60 Issues Tested:**

- ✅ ROOT_FORM validation mode (default 'submit')
- ✅ Array validation with omitWhen patterns
- ✅ Cross-slot validation logic

### ValidationConfig Demo Tests

**Covered Scenarios:**

- Bidirectional password validation (password ↔ confirmPassword)
- Conditional justification (@if rendering)
- Cascade validation (country → state/zipCode)
- Date range validation (startDate → endDate)
- Race condition monitoring (aria-busy stability)
- Debounced validation
- Cross-field automatic revalidation
- Accessibility verification (aria-invalid, aria-describedby)

**PR #60 Issues Tested:**

- ✅ **CRITICAL**: No validation race conditions (fixed with `take(1)`)
- ✅ No aria-busy thrashing (≤4 transitions in 1s)
- ✅ Validation count ≤3 per input (not 10+)
- ✅ Works with @if conditional rendering
- ✅ ValidationConfig fluent builder API
- ✅ Proper event emission with `emitEvent: false`

## Key Testing Patterns

### Validation Monitoring

```typescript
// Wait for async validation to complete
await waitForValidationToComplete(field, 3000);

// Monitor aria-busy stability (no thrashing)
const isStable = await monitorAriaStability(field, 1000);
expect(isStable).toBe(true); // ≤4 transitions = stable
```

### Error Assertions

```typescript
// Assert field has error
await expectFieldHasError(field, /required/i);

// Assert field is valid
await expectFieldValid(field);
```

### Form Interactions

```typescript
// Fill and blur to trigger validation
await fillAndBlur(field, 'value');

// Select radio/dropdown
await selectRadio(page, 'gender', 'male');
await selectOption(dropdown, 'United States');

// Check checkbox state
await expectChecked(checkbox);
await expectUnchecked(checkbox);
```

## Accessibility Testing

Tests verify WCAG compliance including:

- `aria-invalid` attributes on invalid fields
- `aria-describedby` linking errors to fields
- `aria-busy` during async validation
- Form structure and semantics
- Screen reader announcements (implicit via aria attributes)

## Debugging Failed Tests

1. **Run in headed mode:**

   ```bash
   npx playwright test --headed --workers=1
   ```

2. **Use debug mode with Playwright Inspector:**

   ```bash
   npx playwright test --debug
   ```

3. **Check screenshots and videos:**

   Failed tests automatically capture screenshots and videos in `test-results/`

4. **View trace:**

   ```bash
   npx playwright show-report
   # Click on failed test → View trace
   ```

5. **Increase timeouts if needed:**

   Edit `playwright.config.ts` to increase `timeout` or `actionTimeout`

## Common Issues

### Test Timeouts

If tests timeout waiting for validation:

- Ensure dev server is running at `http://localhost:4200`
- Check network tab for failed API calls (SWAPI for userId validation)
- Increase timeouts in `playwright.config.ts` if validations are legitimately slow

### Flaky Tests

If tests pass/fail intermittently:

- Check for proper `await` usage
- Verify debounce waits are sufficient (default 300ms + buffer)
- Use `waitForValidationToComplete()` for async validations
- Check aria-busy monitoring thresholds

### Element Not Found

If tests can't find elements:

- Verify label text matches component HTML
- Check for dynamic rendering (@if/@for blocks)
- Use browser inspector to verify actual rendered HTML

## CI/CD Integration

Tests are configured for CI with:

- Retries: 2 attempts on CI (0 locally)
- Workers: 1 worker on CI (parallel locally)
- Screenshots/videos on failure only
- HTML reporter for results

Set `CI=true` environment variable to enable CI mode:

```bash
CI=true npx playwright test
```

## Contributing

When adding new form features:

1. Add corresponding e2e tests to relevant spec file
2. Update helpers if new patterns emerge
3. Document any new validation patterns
4. Ensure tests cover both happy path and edge cases
5. Verify accessibility attributes are tested
6. Check for potential race conditions if using validationConfig

## Resources

- [Playwright Documentation](https://playwright.dev)
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [ngx-vest-forms Documentation](../../README.md)
- [PR #60 - ValidationConfig Fixes](https://github.com/ngx-vest-forms/ngx-vest-forms/pull/60)
