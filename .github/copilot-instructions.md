---
description: 'GitHub Copilot instructions for ngx-vest-forms'
applyTo: '**'
---

# ngx-vest-forms Copilot Instructions

## Quick Reference

- **Framework**: Angular 20+ with signals, standalone components
- **Forms**: Template-driven with Vest validation
- **Testing**: Vitest (unit), Playwright (E2E)
- **Styling**: Tailwind CSS 4.x
- **TypeScript**: 5.8+ with strict mode

## Project Structure

### Library Entry Points

- `ngx-vest-forms/core` - Main directive (`ngxVestForm`)
- `ngx-vest-forms/control-wrapper` - UI helpers (`NgxControlWrapper`)
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
Follow [`.github/instructions/ngx-vest-forms.instructions.md`](../.github/instructions/ngx-vest-forms.instructions.md):

### Form Implementation Checklist

- [ ] Model defined as `signal()`
- [ ] Validation suite in `*.validations.ts`
- [ ] Form uses `ngxVestForm` directive
- [ ] Two-way binding with `[(formValue)]`
- [ ] One-way binding with `[ngModel]` on controls
- [ ] Fields wrapped in `<ngx-control-wrapper>`

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
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { userValidations } from './user.validations';

@Component({
  imports: [ngxVestForms, NgxControlWrapper],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" type="email" />
      </ngx-control-wrapper>
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

### Unit Tests (Vitest)

- Follow [`.github/instructions/vitest-test.instructions.md`](../.github/instructions/vitest-test.instructions.md)
- Use Testing Library patterns
- Test behavior, not implementation

### E2E Tests (Playwright)

- Follow [`.github/instructions/playwright.instructions.md`](../.github/instructions/playwright.instructions.md)
- Use accessible locators
- Mock APIs with MSW

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

Follow [`.github/instructions/commit.instructions.md`](../.github/instructions/commit.instructions.md):

- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
- Imperative mood in description
- Max 80 chars in summary

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

- [Vest Documentation](https://vestjs.dev/)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular LLM Guidelines](https://angular.dev/llms.txt)
- Project issues: [GitHub Issues](https://github.com/your-org/ngx-vest-forms/issues)
