---
description: 'Copilot instructions for the ngx-vest-forms project'
applyTo: "**"
---

# GitHub Copilot Instructions

## Project-Specific Instructions

This repository includes detailed, authoritative instructions for key workflows and conventions. **Always consult these files for specifics before generating or editing code or tests:**

- **Commit messages:** `.github/instructions/commit.instructions.md` — Conventional Commits requirements, structure, and examples.
- **Vitest unit/component tests:** `.github/instructions/vitest-test.instructions.md` — Angular+Vitest test structure, best practices, and testing-library usage.
- **Playwright E2E tests:** `.github/instructions/playwright.instructions.md` — Playwright test conventions, locator/step/assertion patterns, and file organization.
- **Angular LLM guidelines:**
  - [angular.dev/llms.txt](https://angular.dev/llms.txt) — Concise Angular LLM prompt guidelines.
  - [angular.dev/llms-full.txt](https://angular.dev/llms-full.txt) — Full Angular LLM prompt guidelines.

Summaries and cross-references are included in relevant sections below, but the full details and up-to-date rules are always in these files.

## Technologies Used

- **TypeScript ^5.8**: With strict typing.
- **Angular ^20**: The primary frontend framework.
- **ngx-vest-forms**: The core library being developed.
- **Vest**: For form validation. -- [vestjs](https://vestjs.dev/)
- **Vitest**: For unit testing.
- **Playwright**: For end-to-end testing.
- **MSW**: For writing mock handlers.
- **Tailwind CSS ^4.x**: For styling.

## Project Overview & Architecture

`ngx-vest-forms` is a lightweight adapter for Angular Template Driven Forms that uses [Vest](https://vestjs.dev) for validation. It is built for modern Angular (20+) and leverages signals, standalone components, and a modular architecture.

### Modular Architecture

The library is split into multiple entry points to allow for tree-shaking and optional features. When working on the library, be mindful of which entry point the code belongs to:

-   **`ngx-vest-forms/core`**: The essential functionality. Contains the main `ngxVestForm` directive.
-   **`ngx-vest-forms/control-wrapper`**: Contains the `NgxControlWrapper` UI helper component for displaying errors and pending states.
-   **`ngx-vest-forms/schemas`**: Contains adapters for schema libraries like Zod, Valibot, and ArkType.
-   **`ngx-vest-forms/smart-state`**: Contains advanced directives for complex state management scenarios.

### Developer Workflow

-   **Run the example app**: `npm start` (runs `ng dev examples`)
-   **Run unit tests**: `npm test` (runs `vitest`)
-   **Build the library**: `npm run build:lib` (runs `ng build ngx-vest-forms`)
-   **Build all**: `npm run build:ci` (builds the library and example app)

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

## Code Reference / Context7
- Always use the context7 MCP to reference documentation for libraries like
 - `/angular/angular`
 - `/mswjs/msw`
 - `/microsoft/playwright`
 - `/testing-library/angular-testing-library`
 - `/context7/tailwindcss`
 - `/microsoft/typescript`
 - `/ealush/vest`
 - `/vitest-dev/vitest`
- Always use 5000 tokens.
- Only search three times maximum for any specific piece of documentation.

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

- Use **Angular 20** or higher for all projects.
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

## Forms and Validation with ngx-vest-forms

This project uses `ngx-vest-forms`, which integrates **Vest** for validation with Angular's **Template-Driven Forms**.

### Core Pattern

The main pattern involves three parts:
1.  A component with a model `signal()`.
2.  A Vest validation suite defined in a separate `*.validations.ts` file.
3.  An HTML template connecting them with the `ngxVestForm` directive.

-   Use `[(formValue)]` on the `<form>` element for two-way binding to the model signal.
-   Use `[vestSuite]` to provide the validation suite.
-   Use `[ngModel]` (one-way binding) for individual form controls.
    - Do NOT use `ngModel` for two-way binding.
-   Wrap form fields in `<ngx-control-wrapper>` (from `ngx-vest-forms/control-wrapper`) to automatically handle error display and pending states.

### Example Implementation

**1. Validation Suite (`user.validations.ts`)**
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

**2. Component (`user-form.component.ts`)**
```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { userValidations } from './user.validations';

@Component({
  standalone: true,
  imports: [ngxVestForms, NgxControlWrapper],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-control-wrapper>
        <label for="name">Name</label>
        <input id="name" name="name" [ngModel]="model().name" />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" type="email" />
      </ngx-control-wrapper>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly model = signal({ name: '', email: '' });
  protected readonly suite = userValidations;
}
```

### Best Practices

-   Keep validation logic in `*.validations.ts` files, separate from components.
-   Use the `NgxControlWrapper` or build a custom equivalent using `NgxFormErrorDisplayDirective` for consistent error handling.
-   Use the most specific entry point possible (e.g., `import { ngxVestForms } from 'ngx-vest-forms/core'`) to aid tree-shaking.
-   For type-safety, use the optional schema adapters from `ngx-vest-forms/schemas`.


## HTML and CSS

### HTML Guidelines

- Follow the [Web Platform Baseline](https://web.dev/baseline) >= 2022.
- Use semantic HTML elements (e.g., `<form>`, `<label>`, `<fieldset>`, `<legend>`, `<button>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<table>`, headings) as the foundation for accessibility and SEO.
- Utilize new HTML features like `<dialog>`, `<details>`, `<summary>`, `<input type="color">`, `<input type="date">`, `<input type="range">`, `<output>`, `<progress>`, `<meter>`, `<picture>`, and `popover` for modern UI patterns.
- Reference the Accessibility section for ARIA and focus management best practices.

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


## Accessibility

### Principles

- Follow **WCAG 2.1 AA** as a minimum standard.
- Use an accessibility-first approach, not as an afterthought.
- Test with screen readers (VoiceOver, NVDA, JAWS) and keyboard navigation.
- Ensure all interactive elements are keyboard accessible and have visible focus indicators.
- Include people with disabilities in user testing where possible.

### Semantic HTML & ARIA

- Use semantic HTML elements for structure and meaning (see HTML Guidelines).
- Use ARIA attributes only when native HTML is insufficient:
  - `aria-label`, `aria-labelledby`, `aria-describedby` for descriptions.
  - `aria-live` for dynamic content updates.
  - `aria-expanded`, `aria-controls` for disclosure widgets.
  - `aria-hidden="true"` for decorative elements.
  - `aria-current` for current navigation items.
  - `role="button"` for non-button elements that function as buttons.
  - `role="alert"` or `aria-atomic="true"` with `aria-live="polite"` for status messages.
  - `role="navigation"`, `role="main"`, `role="search"` for page structure.
  - Prefer native HTML over ARIA roles; "First Rule of ARIA": don't use ARIA if HTML can do the job.

### Focus & Navigation

- Ensure visible focus for all interactive elements (never remove outlines without alternatives).
- Manage focus programmatically for dialogs and modals (focus trap, return focus on close).
- Use logical tab order; avoid `tabindex` > 0, use `tabindex="-1"` for programmatic focus only.
- Provide skip links to bypass repetitive navigation.
- Ensure all interactive elements are keyboard accessible.
- Use CSS to style focus states clearly and consistently.

### Forms

- Associate labels with controls using `<label for="id">` or `aria-labelledby`.
- Group related controls with `<fieldset>` and `<legend>`.
- Provide clear, actionable error messages, visually and for screen readers.
- Use `aria-invalid` and `aria-describedby` for error states.
- Use appropriate input types for better mobile and accessibility support.

### Visual & Media

- Maintain color contrast (≥4.5:1 normal text, 3:1 large text).
- Never rely on color alone for information; use icons/text as well.
- Support text zoom up to 200% and sufficient spacing for motor impairments.
- Provide descriptive alt text for images; use empty alt for decorative images.
- Provide captions/transcripts for audio/video; ensure media controls are keyboard accessible.
- Avoid auto-play media or provide controls to stop it.

### Dynamic Content

- Announce dynamic content changes with ARIA live regions.
- Ensure custom widgets follow WAI-ARIA patterns and are fully keyboard accessible.

### Testing

- Use automated tools (axe-core, Lighthouse) and manual keyboard/screen reader testing.
- Maintain accessibility test plans as part of QA.

## Tools and Resources

- Use tools like [Can I Use](https://caniuse.com/) to check browser support.
- Use [CSS Tricks](https://css-tricks.com/) for design patterns and tips.
- Use [Web.dev](https://web.dev/) for performance and accessibility audits.


## Testing

> **Note:**
> - For Vitest unit/component tests, follow `.github/instructions/vitest-test.instructions.md`
> - For Playwright E2E tests, follow `.github/instructions/playwright.instructions.md`

### Unit & Component Testing (Vitest)

All unit and component tests must follow `.github/instructions/vitest-test.instructions.md`. Do not duplicate or invent test patterns—always defer to the referenced file.

### End-to-End Testing (Playwright)

All E2E tests must follow `.github/instructions/playwright.instructions.md`. Do not duplicate or invent E2E test patterns—always defer to the referenced file.




## Performance

- Optimize images with `NgOptimizedImage` or modern formats like WebP and AVIF.
- Minimize heavy animations; prefer CSS transitions and view transitions.
- Use lazy loading for below-the-fold content.
- Monitor and optimize Core Web Vitals (LCP, INP, CLS).
- Use web workers for CPU-intensive tasks.
- Implement appropriate caching for static assets.

## Commits

All commit messages must follow the Conventional Commits specification as described in [.github/instructions/commit.instructions.md](./instructions/commit.instructions.md). This includes type/scope/description structure, imperative mood, and concise summaries. See the file for full details and examples.

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

