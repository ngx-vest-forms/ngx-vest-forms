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
- Prefer reusable, type-safe fakes over ad-hoc mocks (see [Fake It Till You Mock It](https://cookbook.marmicode.io/angular/testing/fake-it-till-you-mock-it)).
  - Share a single fake per dependency and keep it beside the real service (or under `tests/mocks/`) so suites reuse the same behavior contract.
  - Make fakes explicit: throw whenever a test hits an unsupported method or field instead of returning `undefined`.
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
- Prefer fakes over mocks/stubs for services you own (see [Fake It Till You Mock It](https://cookbook.marmicode.io/angular/testing/fake-it-till-you-mock-it)).
- Fakes should expose minimal configuration/state helpers, stay type-safe, maintain internal state, and throw on unhandled calls to guard against stale expectations.
- Assert behavior through the fake's public state instead of relying on `toHaveBeenCalled*` whenever possible.
- Minimize the number of test doubles per test; only mock at the boundary of the SUT.

### Designing Fakes (Marmicode playbook)
- Define or derive the shared interface first so the fake mirrors the real contract.
- Implement only the methods the test actually exercises; any unexpected call must throw (fail fast over silent `undefined`).
- Provide light-weight helpers such as `configure` or `getState` so assertions focus on observable outcomes, not interaction trivia.
- Reuse the same fake across suites—export it once rather than recreating ad-hoc stubs in each spec file.

## Component Testing (Vitest Browser + Angular Testing Library)
- Use Vitest Browser UI for all component tests whenever possible.
- Always use `render()` from Angular Testing Library.
- Use role-based queries (`getByRole`, `findByRole`, etc.) for DOM assertions.
- **NEW BINDINGS API (Angular Testing Library v18.1.0+)**: Use the `bindings` property with `inputBinding`, `outputBinding`, and `twoWayBinding` for setting component inputs/outputs.
  - **Deprecation Notice**: `componentInputs`, `inputs`, `componentOutputs`, and `on` are deprecated in favor of `bindings`.
  - Use `inputBinding(name, signal)` or `inputBinding(name, () => value)` for input properties.
  - Use `outputBinding(name, callback)` for output properties (great with spy functions).
  - Use `twoWayBinding(name, signal)` for two-way bindings (e.g., `model()` properties) - requires writable signal.
- For user interactions, prefer `userEvent` from `@vitest/browser/context` over `@testing-library/user-event`.
- Prefer fakes for service dependencies; use Angular's DI to provide them.
- Always test user-facing behavior, not implementation details.
- For async operations, always `await TestBed.inject(ApplicationRef).whenStable()` after triggering effects/signals.
- When creating a Test Component, use Template Driven Forms.
- Use ngx-vest-forms for the test component's form logic.
- Run tests in headless mode for CI pipelines and Browser UI for debugging.

### ngx-vest-forms Component Testing Patterns

When testing components that use ngx-vest-forms, follow these patterns:

```typescript
import { render, screen, inputBinding } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { Component, signal, input } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { staticSafeSuite, test, enforce } from 'vest';

// Example validation suite for testing
const testSuite = staticSafeSuite((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
});

// Component under test with input property
@Component({

  template: `
    <div>{{ emailValue() }}</div>
  `,
})
class ComponentUnderTest {
  emailValue = input.required<string>();
}

describe('Component with inputs', () => {
  it('should display input value using bindings API', async () => {
    // Arrange: Create signal for input value
    const emailSignal = signal('test@example.com');

    // Act: Render with inputBinding
    await render(ComponentUnderTest, {
      bindings: [
        inputBinding('emailValue', emailSignal),
      ],
    });

    // Assert: Verify initial value
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    // Act: Update signal value
    emailSignal.set('updated@example.com');

    // Assert: Verify updated value (use findBy for auto-retry)
    await expect.element(screen.findByText('updated@example.com')).toBeInTheDocument();
  });
});

// Example with ngx-vest-forms integration
@Component({

  template: `
    <form>
      <input
        type="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
        aria-label="Email"
      />
      @if (form.emailShowErrors() && form.emailErrors().length) {
        <span role="alert">{{ form.emailErrors()[0] }}</span>
      }
    </form>
  `,
})
class FormComponent {
  form = createVestForm(
    testSuite,
    signal({ email: '' }),
    { errorStrategy: 'immediate' }
  );
}

describe('ngx-vest-forms integration', () => {
  it('should validate form fields and show errors', async () => {
    // Arrange
    await render(FormComponent);
    const emailInput = screen.getByRole('textbox', { name: /email/i });

    // Act - input is empty, immediate strategy shows errors

    // Assert - check for validation error (no user interaction needed with immediate strategy)
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');

    // Act - type valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'test@example.com');

    // Assert - error should disappear (use queryBy for non-existence)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
```

### New Bindings API Examples

**Setting Input Properties:**
```typescript
import { inputBinding } from '@testing-library/angular';

// With signal
const nameSignal = signal('John');
await render(Component, {
  bindings: [inputBinding('name', nameSignal)],
});

// With inline function
await render(Component, {
  bindings: [inputBinding('age', () => 25)],
});

// With aliased input (use alias name, not property name)
await render(Component, {
  bindings: [inputBinding('greetingAlias', signal('Hello'))],
});
```

**Testing Output Properties:**
```typescript
import { outputBinding } from '@testing-library/angular';
import { vi } from 'vitest';

const onClickSpy = vi.fn();
await render(Component, {
  bindings: [outputBinding('clicked', onClickSpy)],
});

// Trigger action that emits the output
await userEvent.click(screen.getByRole('button'));

// Assert output was emitted
expect(onClickSpy).toHaveBeenCalledWith(expectedValue);
```

**Two-Way Bindings:**
```typescript
import { twoWayBinding } from '@testing-library/angular';

// For model() properties - MUST use writable signal
const valueSignal = signal('initial');
await render(Component, {
  bindings: [twoWayBinding('value', valueSignal)],
});

// Verify two-way sync works
expect(valueSignal()).toBe('initial');
await userEvent.type(screen.getByRole('textbox'), 'updated');
expect(valueSignal()).toBe('updated');
```

### Testing Library Best Practices
- **Avoid Implementation Details**: Never access `fixture.debugElement`, `injector.get()`, or internal component/directive properties in tests.
- **Use DOM-Focused Assertions**: Test what users see and interact with, not internal state or method return values.
- **Prefer Accessible Queries**: Use `screen.getByRole()`, `screen.getByLabelText()`, `screen.getByText()` for better accessibility testing. Fall back to `screen.getByTestId()` when semantic queries aren't sufficient.
- **Use Standard Vitest Assertions**: Use `expect(element).toHaveAttribute()` for DOM assertions. Do NOT use `expect.element()` - this is Vitest Browser mode syntax only.
- **Add Test IDs Sparingly**: Use `data-testid` attributes only when semantic queries (role, label, text) aren't sufficient for reliable element querying.
- **Test Attribute Behavior**: Verify directive behavior through DOM attributes (e.g., `toHaveAttribute('validateRootForm', 'false')`) rather than directive properties.
- **Focus on User Experience**: Test form validation states (`toBeValid()`, `toBeInvalid()`), element visibility (`toBeInTheDocument()`), and accessibility attributes.
- **Use New Bindings API**: Prefer `bindings: [inputBinding(), outputBinding(), twoWayBinding()]` over deprecated `componentInputs`, `inputs`, `componentOutputs`, and `on` properties.

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


