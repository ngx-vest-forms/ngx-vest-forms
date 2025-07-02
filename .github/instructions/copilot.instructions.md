---
applyTo: "**"
---

# GitHub Copilot Instructions

## Technologies Used

- **TypeScript ^5.8**: With strict typing.
- **Angular ^20**: The primary frontend framework.
- **Vest**: For form validation. -- [vestjs](https://vestjs.dev/)
- **Vitest**: For unit testing.
- **Storybook**: For integration/component testing.
- **Playwright**: For end-to-end testing.
- **MSW**: For writing mock handlers.
- **Tailwind CSS ^4.x**: For styling.

## General Guidelines

You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.

### Key preferences

- Always provide a plan or description of the issue and proposed implementation before generating code.
- Request explicit user approval before proceeding with any implementation.
- Do not provide fictional or hallucinate code. Always use real-world examples and libraries and check API's.
- Avoid generating code that is too complex or difficult to understand.
- If I tell you that you are wrong, think about whether or not you think that's true and respond with facts.
- Avoid apologizing or making conciliatory statements.
- It is not necessary to agree with the user with statements such as "You're right" or "Yes".
- Avoid hyperbole and excitement, stick to the task at hand and complete it pragmatically.
- Always review the generated code for correctness and adherence to best practices.
- Iterate and refine until all is correct and there are no errors.
- Ensure that all code examples are relevant to the current context and follow the latest (Angular, HTML, CSS, TypeScript) standards and versions.
- Optimize for understanding, not purity. If a "clean" approach makes code harder to understand, it's not actually clean.
- Value domain clarity over technical elegance. Code that clearly expresses business concepts is more valuable than code that demonstrates technical prowess
- Embrace tradeoffs knowingly. Sometimes, performance matters more than purity. Sometimes, shipping quickly matters more than perfect abstractions. Make these tradeoffs consciously.

## TypeScript

### General Guidelines

- Write all code in **TypeScript**.
- Enforce strict TypeScript mode.
- Prefer types over interfaces.
- Define data structures with types for type safety.
- Use the private class modifier `#` instead of `private` for class properties.
- Use meaningful variable names (e.g., `isActive`, `hasPermission`).
- Use kebab-case for file names (e.g., `user-profile.component.ts`).
- Organize files in the order: imports, definition, implementation.
- Use template strings for multi-line literals.
- Use single quotes for string literals.
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Use `const` for constants and `let` for variables that may change.
- Use `readonly` for immutable properties.
- Use `never` for functions that never return a value.
- Prefer unions over enums.

### Advanced Features

- Use `as const` for immutable variables.
- Use the `satisfies` operator.
- Utilize optional chaining and nullish coalescing.
- Use template strings for string interpolation.
- Prefer named exports for components, services, and utilities.
- Infer return types for functions.

## Angular

### Core Concepts

- Use **Angular 19** or higher for all projects.
- Adopt **Standalone Components** to eliminate the need for NgModules.
  - Avoid manually adding `standalone: true` for components, directives, and pipes, as this is the default in Angular 19.
- Set `ChangeDetectionStrategy.OnPush` by default to optimize performance.
- Ensure compatibility with zoneless applications for better performance and reduced overhead.
- Follow these component naming conventions for clarity and consistency:
  - **Page**: Components tied to routes, often serving as entry points.
  - **Container**: Smart components managing data and logic.
  - **Component**: Dumb/presentational components receiving data via inputs.
  - **Dialog**: Components used for modal dialogs.
- Use semantic HTML elements to enhance accessibility and SEO.
- Handle errors gracefully in asynchronous operations to improve user experience.

### Modern Angular APIs

- Use `inject()` for dependency injection instead of `constructor()` for cleaner and more testable code.
- Prefer **signals** over traditional observables for state management and reactivity.
- Use the new control flow syntax: `@if`, `@for`, and `@defer` for more readable templates.
- Replace `@Input()` and `@Output()` with **signal inputs** (`input()`) and **signal outputs** (`output()`) for better type safety and reactivity.
- Use `input()`, `output()`, and `model()` for component interactions, including two-way binding.
- Replace `@ViewChild()` and `@ContentChild()` with `viewChild()` and `contentChild()` for querying elements in a signal-based manner.
- Prefer `afterNextRender()` and `afterRender()` over traditional lifecycle hooks for better control over rendering.
- Use `hostDirectives` to encapsulate reusable directive behaviors, favoring **composition** over inheritance.
- Implement functional interceptors with `provideHttpClient(withInterceptors([...]))` for cleaner HTTP request handling.
- Use functional guards, interceptors, and resolvers for route management.
- Prefer the `HttpResource` API over `HttpClient` for declarative and reactive data fetching.
- Avoid outdated patterns such as:
  - `@Injectable({ providedIn: 'root' })` for services.
  - `@Input()` and `@Output()` for component inputs and outputs.
  - `@ViewChild()` and `@ContentChild()` for querying elements.
- Replace deprecated lifecycle hooks with modern alternatives for better maintainability.

### General Angular Guidelines

- Use **Template-Driven Forms** as the default approach unless Reactive Forms are explicitly required.
- Leverage **signals** for state management instead of traditional observables where applicable.
- Use `takeUntilDestroyed()` from `@angular/core/rxjs-interop` to manage subscriptions and avoid memory leaks.
- Always prefer the `host` property over `@HostBinding` and `@HostListener` for host element interactions:
  - Use it for ARIA attributes, roles, class bindings, and event handlers.
  - This approach is more performant, provides better type checking, and aligns with Angular's modern architecture.
- Implement `@defer` with prefetch strategies for critical components to improve loading performance.
  - Use `on viewport` for below-the-fold content.
  - Use `on interaction` for user-triggered features.
  - Use `on timer` for delayed loading of non-critical elements.
  - Use `when` for custom loading conditions.
- Use `runInInjectionContext()` for creating signals or reactive patterns outside components.
- Prefer pure standalone pipes for efficient and reusable value transformations.
- Utilize the new Route Animations API for smoother and more engaging transitions between routes.
- Adopt **NgRx Signals** for state management to simplify and modernize application state handling.

### Angular Signals

- Use **Angular Signals** for reactive state management in components.
- Use `signal()` for primitive values and small objects.
- Use `input.required()` for mandatory inputs and `model()` for two-way binding.
- Use the `input({ transform: BooleanAttribute })` and other transform options for type safety and transformation.
- Apply `computed()` for derived state and avoid redundant calculations
- Use `linkedSignal()` for resetting states
- Avoid overusing `effect()`; prefer computed signals where possible
- Treat signals as immutable using `.update()` and `.set()`
- Use signals' `untracked()` to prevent unnecessary re-renders when reading signal values in an `effect()`

### Angular Performance Optimization

- Use `@if` instead of `*ngIf` and `@for` with track instead of `*ngFor` for improved rendering performance.
- Implement the new Angular zoneless change detection for reduced overhead and faster renders.
- Use pure pipes for expensive computations.
- Optimize rendering performance by deferring non-essential views.
- Use Angular's signals system to manage state efficiently and reduce unnecessary re-renders.
- Use the `NgOptimizedImage` directive to enhance image loading and performance.
- Implement lazy loading for routes and components.
- Use virtual scrolling for long lists.
- Memoize expensive computations.
- Monitor and optimize bundle size.
- Offload intensive operations to web workers when appropriate.
- Focus on optimizing Web Vitals like LCP, INP, and CLS.
- Make sure components are Zoneless compatible.

## Forms and Validation

### Forms Guidelines

- Use **Template Driven Forms**.
- Prefer `autocomplete="off"` for all fields.
- Use **[ngx-vest-forms](https://github.com/simplifiedcourses/ngx-vest-forms)** as form library.
- Use **[vestjs](https://vestjs.dev/)** for validations.

### VestJS Validation

#### Core Concepts

- Create validation suites using `create()` or `staticSuite()` from Vest, with `staticSuite()` preferred for field-specific validation optimization.
- Understand that Vest maintains its own suite-state which is merged between validation runs.
- Always implement the `only(field)` pattern in suites to optimize performance by only validating the specified field when appropriate.
- Create validation suites outside of feature code to maintain separation of concerns.
- Organize validation structure to mirror your form structure for better clarity.
- Structure validation suites as self-contained units that receive data and return validation results.

#### Example Basic Pattern

```typescript
import { create, enforce, only, test } from 'vest';

// Create a validation suite that takes form data as a parameter
const suite = staticSuite((data = {}, currentField) => {
  // Use only() for field-specific validation to optimize performance
  only(currentField);

  // Email field validation
  test('email', 'Please provide a valid email', () => {
    enforce(data.email).isNotEmpty().matches(/^[^@]+@[^@]+\.[^@]+$/);
  });

  // Password validation
  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThanOrEquals(8);
  });
});
```

#### Advanced Features

- Use `omitWhen()` for conditional validations that skip tests based on specific conditions.
- Implement `warn()` for non-blocking validation messages that don't prevent form submission.
- Support asynchronous validations with Promises or async/await syntax.
- Create composable validation functions to reuse validation logic across different forms.
- Implement cross-field validations with proper field relationships.
- Use `group()` to organize validations into logical groups for better structure and conditional skipping.

#### Integration with Angular and ngx-vest-forms

- Connect validation suites to forms using the appropriate binding mechanism in ngx-vest-forms.
- Implement form-level validations when needed for cross-field validation scenarios.
- Use the appropriate error handling mechanisms to display validation messages to users.
- Implement proper validation timing with debouncing for fields that trigger expensive validation operations.
- Configure validation to run on appropriate form events (input, change, blur) based on user experience needs.

#### Best Practices

- Keep validation logic separate from UI components for better maintainability.
- Ensure validation error messages are clear, concise, and actionable for users.
- Create reusable validation functions for common patterns like email, phone numbers, etc.
- Consider internationalization needs when designing error messages.
- Use proper typing with TypeScript to ensure type safety in validation rules.
- Structure validations to optimize for both developer experience and performance.

## HTML and CSS

### HTML Guidelines

- Follow the [Web Platform Baseline](https://web.dev/baseline) >= 2022.
- Use semantic HTML elements for better accessibility and SEO.
- Utilize new HTML features like:
  - **`<dialog>`**: For modal dialogs.
  - **`<details>` and `<summary>`**: For collapsible content.
  - **`<input type="color">`**: For color pickers.
  - **`<input type="date">`**: For date pickers.
  - **`<input type="range">`**: For sliders.
  - **`<output>`**: For displaying calculation results.
  - **`<progress>` and `<meter>`**: For progress indicators.
  - **`<picture>`**: For responsive images.
  - **`popover`**: For pop-up elements.

#### Example

```html
<dialog id="myDialog">
  <p>This is a dialog box.</p>
  <button type="button" (click)="myDialog.close()">
    Close
  </button>
</dialog>

<button type="button" (click)="myDialog.showModal()">Open Dialog</button>
```

### CSS Guidelines

- Leverage modern CSS features:
  - **Container Queries**: Adapt styles based on the size of a container.
  - **CSS Grid and Subgrid**: For advanced layout designs.
  - **`:has()`**: For parent-child relationship styling.
  - **`:user-valid` and `:user-invalid`**: For form validation styling.
  - **CSS Variables**: For theming and reusable values.
  - **Logical Properties**: For better internationalization (e.g., `margin-inline`, `padding-block`).
  - **`@layer`**: For organizing CSS layers.
  - **`@supports`**: For feature detection.
  - **`scroll-behavior: smooth;`**: For smooth scrolling.
  - **`aspect-ratio`**: For maintaining element proportions.

#### Example

```css
/* Container Query */
@container (min-width: 600px) {
  .card {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* CSS Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* :has() */
.card:has(img) {
  border: 2px solid blue;
}

/* Logical Properties */
.container {
  padding-block: 1rem;
  margin-inline: auto;
}

/* Smooth Scrolling */
html {
  scroll-behavior: smooth;
}
```

### Tailwind CSS 4

#### Best Practices

- Use utility classes directly in templates instead of custom CSS.
- Take advantage of the new Tailwind 4 features:
  - **Logical Properties**: Use `ms-4` (margin-inline-start) instead of `ml-4`.
  - **Container Queries**: Use `@container` with `cq:` prefix for container queries.
  - **Subgrid**: Use `subgrid-cols` and `subgrid-rows` for nested grid layouts.
  - **Open Variants**: Use the new variants like `open:` for styling open states.
- Follow a consistent utility order for better readability:
  1. Layout (`flex`, `grid`, `container`)
  2. Positioning (`absolute`, `relative`, `top`)
  3. Box model (`w-`, `h-`, `p-`, `m-`)
  4. Typography (`text-`, `font-`)
  5. Visual (`bg-`, `border-`, `shadow-`)
  6. Interactivity (`hover:`, `focus:`)
- Use arbitrary values with square brackets when needed: `[w-32.5px]`
- Leverage the `@apply` directive in component styles for repeated patterns.
- Use variants like `dark:`, `lg:`, `hover:`, etc. for responsive and state-based styling.
- Use `group-` and `peer-` for styling based on parent or sibling states.
- Prefer Tailwind's color palette for consistency, using semantic colors when available.

#### Example

```html
<div class="flex flex-col space-y-4 p-4 cq:md:grid cq:md:grid-cols-2 cq:md:gap-4">
  <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    Submit
  </button>

  <!-- Using logical properties -->
  <div class="ms-4 me-4 block-start-2">Content</div>

  <!-- Using subgrid -->
  <div class="grid grid-cols-2 subgrid-cols">
    <div>Item 1</div>
    <div>Item 2</div>
  </div>
</div>
```

## Accessibility and Performance

### Accessibility Standards

#### Core Principles

- Follow the **WCAG 2.1 AA** standard as a minimum requirement.
- Design with an "accessibility-first" approach, not as an afterthought.
- Test with actual screen readers (VoiceOver, NVDA, JAWS) regularly.
- Include people with disabilities in user testing where possible.
- Ensure the application is fully keyboard navigable without requiring a mouse.

#### Semantic HTML and ARIA Usage

- Use semantic HTML elements as the foundation for accessibility.
  - Use `<button>` for clickable actions, not `<div>` with click handlers.
  - Use `<a>` for navigation links, not `<span>` or other elements.
  - Use heading elements (`<h1>` through `<h6>`) in a logical hierarchy.
  - Use `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, and other semantic elements appropriately.
  - Use `<table>` for tabular data with proper `<th>`, `<caption>`, etc.
  - Use `<form>`, `<fieldset>`, and `<legend>` for form organization.

- Use ARIA attributes only when necessary to supplement HTML semantics.
  - Use `aria-label`, `aria-labelledby`, and `aria-describedby` to provide descriptions for elements.
  - Use `aria-live` regions for dynamic content updates with appropriate politeness levels.
  - Use `aria-expanded` and `aria-controls` for disclosure widgets.
  - Use `aria-hidden="true"` to hide purely decorative content from screen readers.
  - Use `aria-current` for indicating current items in navigation.
  - Use `aria-atomic` and `aria-relevant` to control how updates to live regions are announced.
  - Prefer native HTML semantics over ARIA roles when possible.
  - Follow the "First Rule of ARIA": Don't use ARIA if HTML can do the job.

#### Focus Management

- Ensure visible focus indicators for all interactive elements.
  - Never use `outline: none` without providing an alternative focus style.
  - Consider high contrast mode users when designing focus indicators.
- Manage focus programmatically when needed:
  - Move focus to modal dialogs when opened.
  - Return focus to triggering element when closed.
  - Use focus trapping in modals and drawers.
- Implement logical tab order that follows visual layout.
  - Avoid arbitrary tabindex values greater than 0.
  - Use `tabindex="-1"` for elements that should be programmatically focusable but not in tab order.
- Provide skip links to bypass repetitive navigation.

#### Form Accessibility

- Associate labels with form controls using `<label for="id">` or aria-labelledby.
- Group related form controls with `<fieldset>` and `<legend>`.
- Provide clear error messages that:
  - Are announced to screen readers when they appear.
  - Are visually connected to the relevant form field.
  - Explain how to fix the error, not just that an error exists.
- Ensure form validation errors are accessible using `aria-invalid` and `aria-describedby`.
- Use appropriate input types (`email`, `tel`, `number`, etc.) for better mobile experiences.

#### Color and Visual Design

- Maintain sufficient color contrast (minimum 4.5:1 for normal text, 3:1 for large text).
  - Test with contrast checker tools during development.
  - Consider different lighting conditions and monitor calibrations.
- Never rely on color alone to convey information.
  - Add icons, patterns, or text labels along with color cues.
  - Ensure the application works in grayscale.
- Support different text sizes and zoom levels up to 200% without loss of functionality.
- Provide sufficient spacing between interactive elements for motor control impairments.
- Ensure the application is usable with Windows High Contrast Mode.
- Consider reduced motion preferences with `prefers-reduced-motion` media query.

#### Media Accessibility

- Provide descriptive alt text for all informative images.
  - Use empty alt attributes (`alt=""`) for purely decorative images.
  - Make alt text contextually appropriate and concise.
- Provide captions and transcripts for audio/video content.
- Ensure media controls are keyboard accessible.
- Avoid auto-playing media or provide easy controls to stop it.

#### Dynamic Content and Interactions

- Announce dynamic content changes using ARIA live regions.
- Provide sufficient timing for interactions and allow users to extend time limits.
- Ensure complex widgets follow WAI-ARIA design patterns and authoring practices.
- Make all custom components fully keyboard accessible.
- Test custom interactions with screen readers to ensure they announce appropriately.

#### Testing and Validation

- Use automated testing tools like axe-core or Lighthouse as a first pass.
- Perform manual keyboard navigation testing for all features.
- Test with screen readers on multiple platforms.
- Include users with disabilities in usability testing when possible.
- Create and maintain accessibility test plans as part of regular QA processes.

### Performance Guidelines

- Optimize images with `NgOptimizedImage` or modern formats like WebP and AVIF.
- Minimize the use of heavy animations; prefer CSS transitions.
- Use view transitions for smoother page transitions between routes.
- Implement lazy loading for below-the-fold content.
- Monitor Core Web Vitals (LCP, FID/INP, CLS) and optimize accordingly.
- Implement performance budgets for critical resources.
- Use WebWorkers for CPU-intensive tasks to keep the main thread free.
- Optimize JavaScript execution and minimize main thread blocking time.
- Implement appropriate caching strategies for static assets.

## Tools and Resources

- Use tools like [Can I Use](https://caniuse.com/) to check browser support.
- Use [CSS Tricks](https://css-tricks.com/) for design patterns and tips.
- Use [Web.dev](https://web.dev/) for performance and accessibility audits.

## Testing

### General Guidelines

- Ensure all new features have corresponding tests.
- Maintain high code coverage with **Vitest**.
- Follow the Arrange-Act-Assert pattern for tests.

### Unit Testing

- Use **Vitest** for unit testing.
- Prefer the new **Vitest Browser UI** for unit tests/component tests to ensure components behave as expected
- Write tests in the Arrange-Act-Assert pattern for clarity and maintainability.
- Use `describe` blocks to group related tests and improve readability.
- Mock external dependencies using `vi.mock()` to isolate the unit under test.
- Use `beforeEach` and `afterEach` hooks to set up and clean up test environments.
- Leverage `test.concurrent` for running independent tests in parallel to speed up execution.
- Use `expect` matchers for clear and expressive assertions.
- Enable code coverage with `--coverage` to ensure all critical paths are tested.
- Use snapshot testing for components with stable outputs.
- Test DOM interactions with `@testing-library/dom` for browser-like behavior.
- Use `vi.spyOn()` to track calls to specific functions or methods.
- Prefer mocking browser APIs (e.g., fetch, localStorage) with **MSW** or `vi.fn()` for consistency.
- Run tests in headless mode for CI pipelines and Browser UI for debugging.

### Integration Testing

- Use **Storybook Interaction Tests** to test component interactions in isolation.
- Ensure integration tests cover all critical paths and edge cases.
- Use **Storybook** to document components and their states.
- Use **Storybook Addons** for accessibility checks and visual regression testing.

### End-to-End Testing

- Use **Playwright** version 1.51 or higher for end-to-end testing.
- Automate E2E tests to validate application flows.
- Use the new Aria snapshot testing with Playwright.
- Ensure tests cover critical user journeys and edge cases.
- Use **MSW** to mock API responses in E2E tests.

## Accessibility and Performance

### Accessibility Standards

- Use appropriate ARIA attributes.
  - Use ARIA attributes to enhance accessibility for dynamic content and complex UI components.
  - Use `aria-label`, `aria-labelledby`, and `aria-describedby` for providing descriptive information.
  - Use `aria-live` to notify users of content changes.
  - Use `aria-expanded` and `aria-controls` for collapsible elements.
  - Use `aria-hidden="true"` to hide decorative elements from screen readers.
  - Use `role="button"` for elements that function as buttons but are not native button elements.
  - Use `role="alert"` or `aria-atomic="true"` with `aria-live="polite"` for important status messages.
  - Use `role="navigation"` to identify navigation sections.
  - Use `role="main"` to identify the main content area of a page.
  - Use `role="search"` to identify search functionality.
- Ensure all interactive elements are keyboard accessible.
  - Use the `tabindex` attribute to control the focus order.
  - Ensure that all interactive elements can be accessed using the keyboard.
  - Implement skip links to bypass repetitive navigation.
- Maintain proper color contrast ratios.
  - Use a color contrast analyzer to ensure sufficient contrast between text and background colors.
  - Aim for a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.
- Implement proper focus management.
  - Ensure that focus is always visible and follows a logical order.
  - Use CSS to style the focus state of interactive elements.
  - Manage focus when opening dialogs or modal windows.
- Provide alt text for images.
  - Use descriptive alt text for all images to provide context for users who cannot see them.
  - Ensure that alt text is concise and accurately describes the image content.
- Use ARIA attributes only when necessary; prefer semantic HTML.

### Performance Guidelines

- Optimize images with `NgOptimizedImage` or modern formats like WebP and AVIF.
- Minimize the use of heavy animations; prefer CSS transitions.
- Use view transitions for smoother animations.

## Security Practices

### Security Standards

- Prevent XSS with Angular's sanitization; avoid using `innerHTML`.
- Sanitize dynamic content with built-in tools.
- Implement CSRF tokens for forms.
- Use appropriate CSP headers.
- Implement secure authentication practices.
- Use proper authorization checks.
- Never expose sensitive data in client-side code.

## Documentation

### Documentation Standards

- Use JSDoc comments for public APIs.
- Add comments that explain why, not what. No amount of clean code can explain why a business rule exists or what the historical context is. Good comments are invaluable
- Maintain up-to-date README files for projects and major features.
- Document public APIs thoroughly.
- Provide usage examples for components and services.

## Tools and Resources

- Use tools like [Can I Use](https://caniuse.com/) to check browser support.
- Use [CSS Tricks](https://css-tricks.com/) for design patterns and tips.
- Use [Web.dev](https://web.dev/) for performance and accessibility audits.
