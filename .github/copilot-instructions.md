---
description: 'GitHub Copilot instructions for ngx-vest-forms'
applyTo: '**'
---

# ngx-vest-forms Copilot Instructions

## LLM Output
- Provide code snippets, explanations, and suggestions that align with the project's architecture and best practices.
- Ensure all code adheres to TypeScript strict mode and Angular 20+ standards.
- Do not make up code or API's always use real libraries and APIs. And check documentation if unsure. Use context7 if possible.
- When reporting information to me, be very concise and to the point. But also descriptive enough to be useful.
- Eliminate: emojis (expect checkmarks, etc), filler, hype, soft asks, conversational transitions, call-to-action appendixes

## Quick Reference

- **Framework**: Angular 20+ with signals, standalone components
- **Forms**: Template-driven with Vest validation
- **Testing**: Vitest (unit), Playwright (E2E)
- **Styling**: Tailwind CSS 4.x
- **TypeScript**: 5.8+ with strict mode

## Project Structure

### Library Entry Points

- `ngx-vest-forms/core` - Main directive (`ngxVestForm`)
- `ngx-vest-forms/form-field` - UI helpers (`NgxVestFormField`)
- `ngx-vest-forms/schemas` - Schema adapters (Zod, Valibot, ArkType)
- `ngx-vest-forms/smart-state` - Advanced state management

### Developer Commands

- `npm start` - Run example app
- `npm test` - Run Vitest tests
- `npm run build:lib` - Build library
- `npm run build:ci` - Build all

## Core Guidelines

### General Approach

- [ ] Provide implementation plan before coding
- [ ] Request user approval for changes
- [ ] Use real APIs and libraries (no hallucination)
- [ ] Optimize for clarity over purity
- [ ] Make conscious tradeoffs

### Code Quality

- [ ] TypeScript strict mode enabled
- [ ] Meaningful variable names
- [ ] Kebab-case filenames
- [ ] Single quotes for strings
- [ ] Avoid `any` type (use `unknown`)

## ngx-vest-forms Patterns
Follow [`.github/instructions/ngx-vest-forms.instructions.md`](instructions/ngx-vest-forms.instructions.md) and [`.github/instructions/vest.instructions.md`](./instructions/vest.instructions.md):

### Form Implementation Checklist

- [ ] Model defined as `signal()`
- [ ] Validation suite in `*.validations.ts`
- [ ] Form uses `ngxVestForm` directive
- [ ] Two-way binding with `[(formValue)]`
- [ ] One-way binding with `[ngModel]` on controls
- [ ] Fields wrapped in `<ngx-vest-form-field>`
- [ ] Submit button is **NOT** disabled (accessibility requirement)
- [ ] Error display mode selector included (for examples)

### Example Pattern

```typescript
// user.validations.ts
import { staticSuite, enforce, only, test } from 'vest';

export const userValidations = staticSuite((data = {}, currentField) => {
  only(currentField);

  test('email', 'Invalid email', () => {
    enforce(data.email)
      .isNotEmpty()
      .matches(/^[^@]+@[^@]+\.[^@]+$/);
  });
});
```

```typescript
// user-form.component.ts
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import { userValidations } from './user.validations';

@Component({
  imports: [ngxVestForms, NgxVestFormField],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-vest-form-field>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" type="email" />
      </ngx-vest-form-field>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly model = signal({ email: '' });
  protected readonly suite = userValidations;
}
```

## Angular 20+ Checklist

### Must Use

- [ ] Standalone components (default)
- [ ] Signals for state (`signal()`, `computed()`)
- [ ] New control flow (`@if`, `@for`, `@defer`)
- [ ] Signal inputs/outputs (`input()`, `output()`, `model()`)
- [ ] `inject()` for DI
- [ ] `OnPush` change detection
- [ ] Template-driven forms (default)

### Must Avoid

- [ ] `@Injectable({ providedIn: 'root' })`
- [ ] Traditional `@Input()/@Output()`
- [ ] `@ViewChild()/@ContentChild()`
- [ ] Constructor injection
- [ ] Zone.js dependency

## Testing Requirements

- Prefer to use #runTests in VSCode over terminal commands

### Unit Tests (Vitest)

- Follow [`.github/instructions/vitest-test.instructions.md`](./instructions/vitest-test.instructions.md)
- Use Testing Library patterns
- Test behavior, not implementation

### E2E Tests (Playwright)

- Follow [`.github/instructions/playwright.instructions.md`](./instructions/playwright.instructions.md)
- Use accessible locators
- use #playwright and #chrome-devtools for debugging
- Test real user flows

## Accessibility Checklist

- [ ] Semantic HTML elements used
- [ ] Labels associated with controls
- [ ] ARIA only when HTML insufficient
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1
- [ ] Error messages accessible

## Performance Checklist

- [ ] Zoneless compatible
- [ ] `@defer` for non-critical content
- [ ] Signals prevent unnecessary renders
- [ ] Pure pipes for computations
- [ ] Images optimized (`NgOptimizedImage`)

## Commit Messages

Follow [`.github/instructions/commit.instructions.md`](./instructions/commit.instructions.md):

- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
- Imperative mood in description
- Max 80 chars in summary
- be concise but descriptive

## Documentation Requirements

- [ ] JSDoc for public APIs
- [ ] Comments explain "why" not "what"
- [ ] Examples for components/services
- [ ] README updated for features

## File Templates

### Component Template

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [], // Add required imports
  template: ``,
})
export class ExampleComponent {
  // Use signals for state
  protected readonly state = signal({});

  // Use computed for derived state
  protected readonly derived = computed(() => {});
}
```

### Validation Suite Template

```typescript
import { staticSuite, enforce, only, test } from 'vest';

export const validationSuite = staticSuite((data = {}, currentField) => {
  only(currentField);

  test('fieldName', 'Error message', () => {
    enforce(data.fieldName).isNotEmpty();
  });
});
```

## Additional Resources

- [Vest.js Documentation](https://vestjs.dev/)
- [Vest.js Instructions](../.github/instructions/vest.instructions.md) - Comprehensive Vest.js patterns and best practices
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular LLM Guidelines](https://angular.dev/llms.txt)
- Project issues: [GitHub Issues](https://github.com/your-org/ngx-vest-forms/issues)
