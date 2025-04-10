# Testing

## E2E - Playwright

<https://playwright.dev/docs/best-practices>

Core Expertise and Style

1. Domain Expertise: You are an expert in TypeScript, Frontend development, and Playwright end-to-end testing.

   - Your code must reflect a deep understanding of Playwright’s APIs, configuration options, and recommended testing patterns.
   - Always use strongly typed variables and parameters, leveraging TypeScript’s type system to provide robust and self-documenting code.

2. Code Quality and Precision:

   - Write code that is concise, idiomatic, and maintainable.
   - Ensure that your examples compile without errors and adhere to TypeScript strict mode.
   - Do not add superfluous comments or explanations; the code should be self-explanatory and aligned with Playwright best practices.
   - When asked to refactor tests, never remove existing tests and always make sure to test the same functionality as the original test.

3. Use of Locators and Selectors:

   - Always prefer built-in and role-based locators (`getByRole`, `getByLabelText`, `getByPlaceholder`, etc.) over custom CSS selectors unless absolutely necessary.
   - Ensure selectors are stable and maintainable, avoiding overly complex or brittle queries.

4. Web-First Assertions and Waiting:

   - Use Playwright’s built-in web-first assertions (`expect(locator).toHaveText()`, `expect(locator).toBeVisible()`, etc.) wherever possible to ensure reliable tests without arbitrary `waitFor` or hardcoded timeouts.
   - Avoid using `page.waitForTimeout()` or other explicit delays unless there is no alternative. If a delay is needed, first consider other synchronization techniques recommended by Playwright.

5. Configuration and Devices:

   - Utilize Playwright’s built-in configuration options and presets (e.g., devices) to ensure consistent and cross-browser coverage.
   - Always store and reuse configuration details in a central configuration file (`playwright.config.ts`) or well-structured fixture setups.

6. Page Object Models (POM) and Reusability:

   - For Page Object Models, encapsulate selectors and actions in dedicated classes, ensuring they provide a clear, intuitive API for tests.
   - Reuse Playwright locators by storing them in variables or class fields, preventing duplication and increasing maintainability.
   - Keep POM methods small and focused, handling a single action or query at a time.

7. Fixtures and Test Setup:

   - Implement fixtures to provide consistent environment setup and teardown, minimizing repetition across tests.
   - Use `test.beforeEach` and `test.afterEach` hooks to maintain a clean, isolated testing environment for each test run.

8. No Unnecessary Comments or Logs:

   - Avoid commenting the Playwright code, unless absolutely required for clarifying complex logic. The code should be inherently understandable through clear naming and structure.
   - Do not include extraneous `console.log()` statements or debugging code.

9. Follow Official Best Practices:

   - Adhere to the official Playwright documentation and recommendations found at <https://playwright.dev>.
   - Reflect the current recommended Playwright patterns for stable, reliable end-to-end testing.

10. Testing Style and Structure:
    - Organize test files logically and use descriptive test names.
    - Each test should focus on a single piece of functionality or user flow scenario.
    - Make use of `test.describe` blocks to group related tests, and `test.step` calls where appropriate for structured test reporting.

- Target high code coverage for e2e flows by covering critical paths.

In summary: Write TypeScript-based Playwright tests, page objects, fixtures, and configurations that are concise, type-safe, and follow official best practices. Use recommended selectors and web-first assertions, employ reusable locators, leverage built-in devices and configuration options, and produce consistent, maintainable, and reliable code without unnecessary comments.

## Integration / Component testing - Storybook

<https://storybook.js.org/docs/6/writing-tests/interaction-testing>

- Use Storybook interaction tests
- Write clear and concise Tests:
  - Avoid overly complex test setups and assertions.
  - Use clear and concise test descriptions to explain the purpose of each test.
- Use Storybook's interaction testing features to simulate user interactions.
- Prefer the getByRole() selectors etc over the getByTestId() selectors to interact with components and assert their state
- do not use `@storybook/jest` but use the new default: `@storyook/test`
- keep accessibility in mind while writing tests
- Isolate Component Behavior
  - Test individual components in isolation to ensure they function correctly.
- Focus on User Interactions:
  - Test how users interact with components, such as clicking buttons, filling out forms, and triggering events.
  - Prefer `userEvent` over `fireEven()` to simulate user interactions accurately
- Use @testing-library/angular:
  - Leverage @testing-library/angular for testing Angular components within Storybook.

- Aim for thorough coverage in integration tests to catch cross-component issues.

## Unit testing - Vitest & Testing Library for Angular

### Core Technologies

- Vitest: <https://vitest.dev/guide/>
- Testing Library for Angular: <https://testing-library.com/docs/angular-testing-library/intro/>

### Test Structure & Style

- Write focused, single-behavior tests following the Arrange-Act-Assert pattern
- Group related tests in descriptive `describe` blocks with clearly named test cases
- Use TypeScript strict mode for all test files
- Render and interact with Angular components using @testing-library/angular

### Component Testing

- Inject mock signals when testing components with Angular Signals
- Prefer role-based selectors (`getByRole`) for accessibility and stability
- Test critical paths and edge cases to achieve high coverage
- Mock external dependencies using Vitest's mocking capabilities or MSW

### Browser-Specific Testing

Use Vitest Browser mode with these features:

1. **Configuration**
   - Set `browser.enabled: true` in Vitest config
   - Use `playwright` or `webdriverio` as provider

2. **Browser Context API**
   - Manage isolated test environments
   - Reference: <https://main.vitest.dev/guide/browser/context.html>

3. **Interactivity API**
   - Simulate user interactions (clicks, typing, scrolling)
   - Reference: <https://main.vitest.dev/guide/browser/interactivity-api.html>

4. **Locator API**
   - Prefer role-based locators for accessibility alignment
   - Use `getByTestId` only when other locators are insufficient
   - Chain locators with filters for precise targeting
   - Reference: <https://main.vitest.dev/guide/browser/locators.html>

5. **Assertion API**
   - Use `expect.element` for retry-ability to reduce flakiness
   - Validate DOM states, accessibility attributes, and form validity
   - Reference: <https://main.vitest.dev/guide/browser/assertion-api.html>
