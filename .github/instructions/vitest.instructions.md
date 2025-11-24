---
applyTo: "projects/**/*.{spec,test}.{ts,tsx,js,jsx}"
---

# Unit and Component Test Instructions (Angular + Vitest)

## General Guidelines
- Write all tests in TypeScript.
- Use Vitest as the test runner.
- Make sure to properly use ngx-vest-forms functionality in tests.
- Do not make up tests for non-existent APIs or features.
- Prefer user-facing behavior over implementation details.
- Use strict typing and modern Angular best practices.
- Prefer fakes over mocks.
- Always await `TestBed.inject(ApplicationRef).whenStable()` for async Angular tests.
- Write tests for actual, user-visible behavior only. Do not invent tests for APIs or code that do not exist.
- Always start with analysis of the current code and, documentation, and intent.
  - Based on that scaffold the tests and add pseudo-code/docs for the expected behavior, with WHAT and WHY.
  - Start with the happy and simple paths, then add edge cases and error handling.
  - Start with `test.todo()` or `test.fixme()` for complex tests that need more time to implement.
- To run tests, prefer using the `#runTests` with the `#VSCodeAPI`
  - If that does not work, use the command line:
    ```bash
    npx vitest run --coverage
    ```

## Test Organization & Structure

### File Organization
- Use `describe` blocks to group related tests and improve readability.
- Follow the Arrange-Act-Assert pattern for clarity and maintainability.
- Use `beforeEach` and `afterEach` hooks to set up and clean up test environments.
- Leverage `test.concurrent` for running independent tests in parallel to speed up execution.

### Test Coverage
- Ensure all new features have corresponding tests.
- Maintain high code coverage with **Vitest**.
- Enable code coverage with `--coverage` to ensure all critical paths are tested.
- Assert error paths and loading states, not just happy paths.

## Unit Testing (Vitest Node)
- Use for pure functions, utilities, and services without Angular dependencies.
- No Angular TestBed or DOM required.
- Use direct function calls and assertions.
- Use `vi.mock()` for mocking dependencies.
- Prefer fakes over mocks/stubs for services you own (see [Fake It Till You Mock It](https://cookbook.marmicode.io/angular/fake-it-till-you-mock-it)).
- Fakes should be type-safe, maintain internal state, and throw on unhandled calls.
- Minimize the number of test doubles per test; only mock at the boundary of the SUT.

## Component Testing (Vitest Browser + Angular Testing Library)
- Use Vitest Browser UI for all component tests whenever possible.
- Always use `render()` from Angular Testing Library.
- Use role-based queries (`getByRole`, `findByRole`, etc.) for DOM assertions.
- Use the `on` property in `render()` to test outputs (signal outputs, EventEmitters, etc.).
- For user interactions, prefer `userEvent` from `@vitest/browser/context` over `@testing-library/user-event`.
- For signal inputs/models, set values via `componentInputs` in `render()`.
- Prefer fakes for service dependencies; use Angular's DI to provide them.
- Always test user-facing behavior, not implementation details.
- For async operations, always `await TestBed.inject(ApplicationRef).whenStable()` after triggering effects/signals.
- When creating a Test Component, use Template Driven Forms.
- Use ngx-vest-forms for the test component's form logic.
- Run tests in headless mode for CI pipelines and Browser UI for debugging.

### ngx-vest-forms Component Testing Patterns

When testing components that use ngx-vest-forms, follow these patterns:

```typescript
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { staticSuite, test, enforce } from 'vest';

// Example validation suite for testing
const testSuite = staticSuite((data = {}, field) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
});

@Component({

  imports: [ngxVestForms, NgxControlWrapper],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" />
      </ngx-control-wrapper>
    </form>
  `,
})
class TestComponent {
  model = signal({ email: '' });
  suite = testSuite;
}

describe('ngx-vest-forms integration', () => {
  it('should validate form fields and show errors', async () => {
    // Arrange
    await render(TestComponent);
    const emailInput = screen.getByRole('textbox', { name: /email/i });

    // Act - trigger validation by focusing and blurring
    await userEvent.click(emailInput);
    await userEvent.tab(); // blur the field

    // Assert - check for validation error
    await expect.element(screen.getByText('Email is required')).toBeInTheDocument();
  });
});
```

### Testing Library Best Practices
- **Avoid Implementation Details**: Never access `fixture.debugElement`, `injector.get()`, or internal component/directive properties in tests.
- **Use DOM-Focused Assertions**: Test what users see and interact with, not internal state or method return values.
- **Prefer Accessible Queries**: Use `screen.getByRole()`, `screen.getByLabelText()`, `screen.getByText()` for better accessibility testing. Fall back to `screen.getByTestId()` when semantic queries aren't sufficient.
- **Use Vitest Browser Assertions**: Prefer `await expect.element(element).toHaveAttribute()` over direct DOM property checks for better retry-ability.
- **Add Test IDs Sparingly**: Use `data-testid` attributes only when semantic queries (role, label, text) aren't sufficient for reliable element querying.
- **Test Attribute Behavior**: Verify directive behavior through DOM attributes (e.g., `toHaveAttribute('validateRootForm', 'false')`) rather than directive properties.
- **Focus on User Experience**: Test form validation states (`toBeValid()`, `toBeInvalid()`), element visibility (`toBeInTheDocument()`), and accessibility attributes.

## Testing Strategies & Tips

### Quick Decision Matrix
| Test Scenario                  | Approach            | Tools                                 |
|------------------------------- |--------------------|---------------------------------------|
| Component + Service dependency | Fake the service   | `render()` + Fake implementation      |
| Service with HTTP calls        | Mock HTTP          | `TestBed` + `HttpTestingController`   |
| Component with `httpResource`  | Mock HTTP          | `render()` + `HttpTestingController`  |
| Pure functions/utils           | Direct call        | No setup needed                       |
| Async signals/effects          | Use polling        | `expect.poll()` + `whenStable()`      |

### HttpResource
- Use `HttpTestingController` to mock HTTP requests in tests.
- For components using `httpResource`, always test loading, error, and success states.
- Use MSW for browser-based integration/component tests if mocking at the network level.

### Async/Signals
- Use `expect.poll()` for polling async signal values.
- Always await `whenStable()` after triggering async changes.


