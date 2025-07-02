---
applyTo: "projects/**/*.{spec,test}.{ts,tsx,js,jsx}"
---

# Unit and Component Test Instructions (Angular + Vitest)

## General Guidelines
- Write all tests in TypeScript.
- Use Vitest as the test runner.
- Prefer user-facing behavior over implementation details.
- Use strict typing and modern Angular best practices.
- Prefer fakes over mocks.
- Always await `TestBed.inject(ApplicationRef).whenStable()` for async Angular tests.
- Write tests for actual, user-visible behavior only. Do not invent tests for APIs or code that do not exist.

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
- Assert error paths and loading states, not just happy paths.
- When creating a Test Component, use Template Driven Forms.
- Use ngx-vest-forms for the test component's form logic.

### Testing Library Best Practices
- **Avoid Implementation Details**: Never access `fixture.debugElement`, `injector.get()`, or internal component/directive properties in tests.
- **Use DOM-Focused Assertions**: Test what users see and interact with, not internal state or method return values.
- **Prefer `screen` Queries**: Use `screen.getByTestId()`, `screen.getByRole()`, etc. instead of fixture debugging.
- **Use Vitest Browser Assertions**: Prefer `await expect.element(element).toHaveAttribute()` over direct DOM property checks for better retry-ability.
- **Add Test IDs Strategically**: Use `data-testid` attributes for reliable element querying, especially for form elements and containers.
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

### NgRx Signals
- Create the store in tests using `runInInjectionContext` (for pure logic) or `TestBed` (for Angular-dependent stores):
  - For stores with Angular dependencies:
    ```typescript
    let store: ReturnType<typeof myStore>;
    beforeEach(() => {
      TestBed.configureTestingModule({
         providers: [provideZonelessChangeDetection()]
      });
      store = TestBed.runInInjectionContext(myStore);
    });
    ```
- Mock store dependencies (e.g., services) using `vi.fn()` or fakes. Provide them via Angular's DI if needed.
- For async store methods or effects, always `await TestBed.inject(ApplicationRef).whenStable()` before assertions.
- Test selectors and computed signals by reading their values and asserting expected state.
- Test store methods (actions) by invoking them and asserting state changes and side effects.
- Always test both happy paths and error/edge cases.
- Use `expect.poll` for polling assertions when testing async state or effects.
- Do not test private implementation details or internal state—focus on observable state and outputs.
- Achieve high coverage by testing all selectors, methods, and error handling paths. Test both the initial state and all state transitions, including error and loading states.
- Example:
  ```typescript
  import { runInInjectionContext } from '@angular/core';
  import { describe, it, expect, beforeEach } from 'vitest';
  import { myStore } from './my.store';

  describe('myStore', () => {
    let store: ReturnType<typeof myStore>;
    beforeEach(() => {
      store = runInInjectionContext(myStore);
    });

    it('should have initial state', () => {
      expect(store.count()).toBe(0);
    });

    it('should increment count', () => {
      store.increment();
      expect(store.count()).toBe(1);
    });
  });
  ```

### Async/Signals
- Use `expect.poll()` for polling async signal values.
- Always await `whenStable()` after triggering async changes.

## Using MSW
- Use MSW for all HTTP/network requests in tests (Vitest, Storybook, Playwright).
- Define reusable handlers per domain or feature. These are often placed in a shared location like `libs/shared/test/msw` or project-specific testing utilities.
- For Vitest Browser UI, use the custom `test` fixture from `@expo/shared-test-msw` (e.g., a file named `msw-vitest.ts`).
  - This fixture is expected to be part of your shared testing infrastructure, typically located in a path like `projects/ngx-vest-forms/src/lib/testing/msw-vitest.ts` or a similar workspace-level shared directory. It encapsulates MSW server setup and teardown per test.
- Use the `worker` fixture (often provided by or used within the custom `test` fixture) to manage handlers per test.
- For Playwright, integrate MSW handlers in your test setup/fixtures.
- Always test both success and error states for API calls.


