# ngx-vest-forms Showcase Redesign & Modernization

Status: Complete Audit + Current State Analysis (Post-Tailwind v4 Migration)

**Primary Objective**: Create a comprehensive showcase application that teaches developers ngx-vest-forms best practices through progressively complex, visually appealing examples.

## 1. Showcase Goals & Principles

### 🎯 **Primary Goal: Developer Education**

- **Progressive Learning**: Each example builds upon previous concepts
- **Best Practice Demonstration**: Show canonical patterns for common use cases
- **Feature Showcase**: Highlight unique ngx-vest-forms capabilities
- **Real-world Application**: Demonstrate practical business scenarios

### 🎨 **Secondary Goal: Modern Visual Appeal**

- Consistent, modern visual system to enhance learning experience
- Clear visual hierarchy to emphasize feature differences, not styling noise
- Accessible by default (WCAG AA compliance)
- Professional appearance suitable for developer portfolios

### 📚 **Pedagogical Structure**

```
Clear Learning Sections:
├── Feature Introduction (What & Why)
├── Live Interactive Demo (How)
├── Code Implementation (Technical Details)
├── Best Practices Notes (Do's & Don'ts)
└── Next Steps (Related Examples)
```

## 2. ngx-vest-forms Showcase Requirements

### 🔧 **Core Library Features to Highlight**

#### **Form Directive Patterns**

- `ngxVestForm` with `[(formValue)]` two-way binding
- `[ngModel]` one-way binding pattern (not `[(ngModel)]`)
- Form state management and lifecycle
- Performance optimization with `only(field)`

#### **Validation Patterns**

- Field-level validation with Vest.js `staticSuite`
- Form-level validation with `formLevelValidation`
- Cross-field validation using `NGX_ROOT_FORM`
- Async validation with proper loading states
- Error lifecycle management (blur vs submit)

#### **Error Display Strategies**

- Manual error display (fundamentals)
- `NgxControlWrapper` automatic error handling
- Custom error display with `NgxFormErrorDisplayDirective`
- Root-level error patterns

#### **Advanced Features**

- Schema integration (Zod, Valibot, ArkType)
- Smart state external synchronization
- Dynamic form generation
- Array utilities (`arrayToObject`, `objectToArray`)
- Nested object validation

### 🏗️ **Component Architecture Best Practices**

#### **Angular Modern Patterns**

- Standalone components (default, no explicit `standalone: true`)
- Signal-based state management
- `input()` and `output()` functions (not decorators)
- `computed()` for derived state
- `ChangeDetectionStrategy.OnPush`
- Host bindings in component decorator

#### **Template Best Practices**

- Native control flow (`@if`, `@for`, `@switch`)
- One-way data binding with signals
- Proper accessibility attributes
- Semantic HTML structure
- No `ngClass`/`ngStyle` (use property bindings)

## 3. Current State Analysis (Developer Experience Focus)

### ✅ **What's Working Well for Learning**

- **Progressive Complexity**: Good example organization from basic to advanced
- **Feature Coverage**: Most ngx-vest-forms APIs are demonstrated
- **Working Examples**: All core functionality is operational
- **Tailwind v4**: Modern styling foundation in place

### ❌ **Critical Learning Experience Issues**

#### **1. Inconsistent Teaching Patterns**

- **Issue**: Mixed usage of `NgxControlWrapper` vs manual error display
- **Impact**: Confuses when to use which approach
- **Solution**: Clear progression from manual → wrapper → custom

#### **2. Best Practice Violations**

- **Issue**: Some examples use deprecated patterns (`[(ngModel)]`, two-way binding)
- **Impact**: Teaches incorrect usage patterns
- **Solution**: Migrate all examples to modern patterns

#### **3. Feature Highlighting Problems**

- **Issue**: Visual design inconsistencies obscure feature differences
- **Impact**: Developers focus on styling rather than functionality
- **Solution**: Standardized component design with feature focus

#### **4. Learning Path Gaps**

- **Issue**: Missing intermediate complexity examples
- **Impact**: Large jump from basic to advanced patterns
- **Solution**: Add bridging examples with incremental complexity

#### **5. Code Quality Issues**

- **Issue**: Inconsistent TypeScript patterns and Angular practices
- **Impact**: Doesn't demonstrate production-ready code
- **Solution**: Apply modern Angular best practices consistently

## 4. Showcase-Focused Implementation Priorities

### **Priority 1: Code Quality & Best Practices (Week 1)**

#### A. Angular Modern Pattern Migration

```typescript
// ❌ Old Pattern (Fix These)
[(ngModel)]="model().field"
*ngIf="condition"
@Component({ standalone: true }) // explicit standalone

// ✅ New Pattern (Showcase These)
[ngModel]="model().field"
@if (condition)
@Component({ /* standalone is default */ })
```

#### B. Signal-Based State Management

```typescript
// ✅ Showcase Pattern
export class ExampleFormComponent {
  protected readonly model = signal<FormModel>({ email: '' });
  protected readonly isValid = computed(
    () => this.vestForm?.formState().valid ?? false,
  );

  protected onSubmit(): void {
    if (!this.isValid()) return;
    // Handle submission
  }
}
```

### **Priority 2: Feature-First Design System (Week 1)**

#### A. Consistent Learning Structure

```html
<!-- Standard Example Template -->
<main class="example-container">
  <app-example-intro
    [title]="'Feature Name'"
    [description]="'What this example teaches'"
    [keyFeatures]="keyFeatures"
    [nextSteps]="relatedExamples"
  >
  </app-example-intro>

  <app-demo-section>
    <!-- Interactive form here -->
  </app-demo-section>

  <app-code-section
    [code]="implementationCode"
    [highlights]="featureHighlights"
  >
  </app-code-section>

  <app-best-practices-panel
    [dos]="bestPractices.dos"
    [donts]="bestPractices.donts"
  >
  </app-best-practices-panel>
</main>
```

#### B. Feature Highlighting System

```css
/* Design system focused on learning, not aesthetics */
.feature-highlight {
  border-left: 4px solid var(--accent-6);
  background: var(--accent-1);
  padding: 1rem;
}

.code-annotation {
  position: relative;
  background: var(--surface-2);
}

.best-practice-do {
  border-color: var(--success-6);
  background: var(--success-1);
}

.best-practice-dont {
  border-color: var(--danger-6);
  background: var(--danger-1);
}
```

### **Priority 3: Progressive Learning Path (Week 2)**

#### A. Enhanced Example Progression

```
01-fundamentals/
├── minimal-form (single field, manual errors)
├── basic-validation (multiple fields, error lifecycle)
├── form-state-demo (form state API showcase)
└── field-states (touched, dirty, pending visualization)

02-core-features/
├── simple-form (multi-field patterns)
├── async-validation (loading states, debouncing)
├── array-utilities (arrayToObject demonstration)
└── form-level-validation (NGX_ROOT_FORM patterns)

03-control-wrapper/
├── wrapper-introduction (NgxControlWrapper basics)
├── custom-error-display (NgxFormErrorDisplayDirective)
└── wrapper-vs-manual (comparison example)
```

#### B. Missing Teaching Examples

```typescript
// Need these new examples:
- 01-fundamentals/form-state-api-demo
- 01-fundamentals/field-lifecycle-demo
- 02-core-features/array-utilities-demo
- 02-core-features/performance-patterns
- 03-control-wrapper/when-to-use-wrapper
```

## 5. Developer Experience Improvements

### **Enhanced Code Examples**

#### A. Comprehensive Documentation

```typescript
/**
 * LEARNING OBJECTIVE: Demonstrate ngx-vest-forms array utilities
 *
 * KEY FEATURES SHOWCASED:
 * - arrayToObject() for template-driven form compatibility
 * - objectToArray() for API submission
 * - Dynamic array CRUD operations
 * - Nested validation patterns
 *
 * BEST PRACTICES HIGHLIGHTED:
 * - Use [ngModel] not [(ngModel)] for unidirectional flow
 * - Leverage only(field) for performance
 * - Handle array indices in validation properly
 */
@Component({
  // Implementation with detailed comments
})
```

#### B. Feature Comparison Tables

```html
<!-- Add to each example -->
<app-comparison-table>
  <app-comparison-row
    feature="Error Display"
    manual="Show/hide logic in template"
    wrapper="Automatic with NgxControlWrapper"
    custom="NgxFormErrorDisplayDirective"
  >
  </app-comparison-row>
</app-comparison-table>
```

### **Interactive Learning Features**

#### A. Live Code Editing

```html
<!-- Add to complex examples -->
<app-code-playground
  [initialCode]="exampleCode"
  [features]="['validation', 'error-display']"
  (codeChange)="updateLiveExample($event)"
>
</app-code-playground>
```

#### B. Step-by-Step Breakdown

```html
<app-tutorial-stepper>
  <app-tutorial-step title="Setup Form Model">
    <!-- Step content -->
  </app-tutorial-step>
  <app-tutorial-step title="Create Validation Suite">
    <!-- Step content -->
  </app-tutorial-step>
</app-tutorial-stepper>
```

## 6. Implementation Roadmap (Revised for Showcase)

### **Phase 1: Foundation & Standards (Week 1)**

1. ✅ Migrate all examples to modern Angular patterns
2. ✅ Implement consistent example structure
3. ✅ Add comprehensive JSDoc documentation
4. ✅ Create feature highlighting design system

### **Phase 2: Learning Experience (Week 2)**

1. ✅ Add missing intermediate examples
2. ✅ Implement progressive complexity
3. ✅ Create comparison components
4. ✅ Add best practices annotations

### **Phase 3: Interactive Features (Week 3)**

1. ✅ Build code playground components
2. ✅ Add tutorial stepper functionality
3. ✅ Implement live example updates
4. ✅ Create feature discovery tools

### **Phase 4: Polish & Performance (Week 4)**

1. ✅ Optimize for mobile learning
2. ✅ Add comprehensive testing
3. ✅ Performance optimization
4. ✅ Documentation generation

## 7. Success Metrics for Showcase

### **Developer Learning Outcomes**

- Developers can implement ngx-vest-forms in 15 minutes after exploring examples
- Clear understanding of when to use wrapper vs manual error handling
- Confidence in implementing complex validation scenarios
- Knowledge of performance optimization patterns

### **Code Quality Metrics**

- All examples follow modern Angular best practices
- 100% TypeScript strict mode compliance
- Comprehensive test coverage for example patterns
- Accessibility compliance (WCAG AA)

### **Feature Coverage**

- Every public API demonstrated with practical examples
- Common use cases covered with realistic scenarios
- Progressive complexity from beginner to expert
- Integration patterns with popular libraries

---

**Next Immediate Actions:**

1. 🔧 **Update minimal-form** to showcase modern patterns perfectly
2. 📚 **Create missing intermediate examples** for better learning progression
3. 🎯 **Add feature highlighting** to existing examples
4. ✅ **Migrate deprecated patterns** in existing examples
5. 📖 **Add comprehensive documentation** with learning objectives

### **Priority 1: Glassmorphism Implementation**

#### A. Enhanced Background System

```css
/* Add to tokens.css */
:root {
  /* Glassmorphism backgrounds */
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  /* Layered gradients for depth */
  --gradient-primary: linear-gradient(
    135deg,
    oklch(95% 0.02 240) 0%,
    oklch(98% 0.01 220) 100%
  );
  --gradient-surface: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.4) 100%
  );
}

@media (prefers-color-scheme: dark) {
  :root {
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
    --gradient-surface: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 100%
    );
  }
}
```

#### B. Form Surface Enhancements

```css
.surface-glass {
  background: var(--gradient-surface);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 16px;
}

.form-field {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.form-field:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}
```

### **Priority 2: Enhanced Typography System**

#### A. Improved Font Hierarchy

```css
:root {
  /* Enhanced typography scale */
  --text-xs: 0.625rem; /* 10px */
  --text-sm: 0.75rem; /* 12px */
  --text-base: 0.875rem; /* 14px */
  --text-lg: 1rem; /* 16px */
  --text-xl: 1.125rem; /* 18px */
  --text-2xl: 1.25rem; /* 20px */
  --text-3xl: 1.5rem; /* 24px */

  /* Font weights for better hierarchy */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

#### B. Component-Specific Typography

```css
.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  background: linear-gradient(135deg, var(--accent-8), var(--accent-6));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin-bottom: 1rem;
}

.field-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}
```

### **Priority 3: Form Field Modernization**

#### A. Floating Label Pattern

```html
<!-- Replace current input structure with: -->
<div class="form-field-modern">
  <input id="email" name="email" type="email" placeholder=" " />
  <label for="email">Email Address</label>
  <div class="field-border"></div>
</div>
```

#### B. Enhanced Input Styles

```css
.form-field-modern {
  position: relative;
  margin-bottom: 1.5rem;
}

.form-field-modern input {
  width: 100%;
  padding: 1rem 0.75rem 0.5rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  font-size: var(--text-base);
}

.form-field-modern label {
  position: absolute;
  top: 1rem;
  left: 0.75rem;
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  transition: all 0.3s ease;
  pointer-events: none;
}

.form-field-modern input:focus + label,
.form-field-modern input:not(:placeholder-shown) + label {
  top: 0.25rem;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--accent-6);
}

.form-field-modern input:focus {
  outline: none;
  border-color: var(--accent-6);
  box-shadow: 0 0 0 3px rgba(var(--accent-6), 0.1);
}
```

### **Priority 4: Layout & Spacing Improvements**

#### A. Container System

```css
.container-modern {
  max-width: 1024px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.card-glass {
  background: var(--gradient-surface);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: var(--glass-shadow);
}

.stack-modern > * + * {
  margin-top: 1.5rem;
}
```

#### B. Section Separation

```css
.intro-section {
  background: var(--gradient-primary);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
}

.demo-section {
  background: var(--gradient-surface);
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
}
```

## 3. Specific Changes for Minimal Form

### **Current Issues in /fundamentals/minimal-form:**

1. **Form Container**: Uses basic `border-border/60 border px-5 pt-5 pb-6 shadow-xs`
   - **Should be**: Glass surface with backdrop blur and gradient background

2. **Input Fields**: Standard bordered inputs
   - **Should be**: Floating label pattern with glass effect

3. **Typography**: Basic text hierarchy
   - **Should be**: Enhanced font scale with gradient titles

4. **Layout**: Basic stacking with container-readable
   - **Should be**: Modern card system with layered surfaces

### **Recommended Template Updates:**

```html
<!-- Replace current form template with: -->
<main class="container-modern">
  <header class="intro-section">
    <h1 class="page-title">Minimal Form</h1>
    <p class="text-base opacity-80">
      Smallest working setup: one model signal, one Vest
      <code class="code-inline">staticSuite</code>, one field.
    </p>
  </header>

  <section class="demo-section">
    <h2 class="section-title">Interactive Demo</h2>
    <form ngxVestForm class="card-glass">
      <div class="form-field-modern">
        <input id="email" name="email" type="email" placeholder=" " />
        <label for="email">Email Address</label>
        <!-- Error handling here -->
      </div>
      <button type="submit" class="btn-glass-primary">Submit</button>
    </form>
  </section>
</main>
```

## 4. Implementation Roadmap (Updated)

### **Phase 1: Core Visual System (Week 1)**

1. ✅ Enhance tokens.css with glassmorphism variables
2. ✅ Create form-field-modern component styles
3. ✅ Implement floating label pattern
4. ✅ Add backdrop-filter support

### **Phase 2: Typography & Layout (Week 1)**

1. ✅ Enhanced typography scale implementation
2. ✅ Gradient text effects for headings
3. ✅ Modern container and card system
4. ✅ Improved spacing tokens

### **Phase 3: Component Updates (Week 2)**

1. ⏳ Update minimal-form component template
2. ⏳ Apply new styles to basic-validation
3. ⏳ Modernize registration form
4. ⏳ Update all fundamental examples

### **Phase 4: Advanced Patterns (Week 3)**

1. ⏳ Complex form layouts with glass effects
2. ⏳ Advanced animation and micro-interactions
3. ⏳ Enhanced error states and feedback
4. ⏳ Loading states with blur effects

## 5. Design Tokens Enhancement (Updated)

```css
/* Enhanced tokens.css additions */
:root {
  /* Glassmorphism System */
  --blur-sm: 10px;
  --blur-md: 20px;
  --blur-lg: 40px;

  /* Enhanced Gradients */
  --gradient-card: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.8),
    rgba(255, 255, 255, 0.4)
  );
  --gradient-button: linear-gradient(135deg, var(--accent-6), var(--accent-7));
  --gradient-text: linear-gradient(135deg, var(--accent-8), var(--accent-6));

  /* Advanced Shadows */
  --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.1);
  --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.1);
  --shadow-elevated: 0 12px 40px rgba(0, 0, 0, 0.15);

  /* Animation Tokens */
  --duration-fast: 0.15s;
  --duration-normal: 0.3s;
  --duration-slow: 0.5s;
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

## 6. Browser Support & Performance

### **Required Features:**

- `backdrop-filter: blur()` - Supported in all modern browsers
- CSS Custom Properties - Universal support
- CSS Grid & Flexbox - Universal support
- OKLCH color space - Progressive enhancement

### **Fallbacks:**

```css
.surface-glass {
  /* Fallback for older browsers */
  background: rgba(255, 255, 255, 0.9);

  /* Modern browsers */
  @supports (backdrop-filter: blur(20px)) {
    background: var(--gradient-surface);
    backdrop-filter: blur(20px);
  }
}
```

## 7. Accessibility Considerations

### **Enhanced Focus Management:**

```css
.form-field-modern input:focus {
  outline: 2px solid var(--accent-6);
  outline-offset: 2px;
  box-shadow:
    0 0 0 3px rgba(var(--accent-6), 0.2),
    var(--shadow-glass);
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

### **Color Contrast Validation:**

- All text meets WCAG AA standards (4.5:1 ratio)
- Enhanced contrast in dark mode
- Alternative text-only mode for high contrast needs

## 8. Next Actions (Immediate)

1. **🎨 Update tokens.css** with glassmorphism variables
2. **📝 Create form-field-modern** component styles
3. **🔧 Update minimal-form template** with new structure
4. **🧪 Test cross-browser compatibility** of backdrop-filter
5. **📸 Document before/after comparisons** with screenshots
6. **♿ Validate accessibility** with screen readers
7. **📱 Test responsive behavior** on mobile devices

---

**Status**: Ready for implementation with specific technical specifications provided above.

### Structure & Headings

- Duplicate page titles (H1 + repeated H2 pattern consistently across all forms).
- Mixed heading levels (H2/H3/H4) for similar sections (Learning Objectives, Form State, Personal Information).
- Lists sometimes appear without a contextual heading.
- Smart State forms show duplicate "Form State:" headings (visible bug).
- Wizard form shows progressive stepper UI but inconsistent heading hierarchy.

### Buttons & Actions

- Submit enabled vs disabled inconsistency (some enabled with invalid data).
- Icon-only buttons (trash, +) lack accessible labels.
- No visual distinction for primary vs secondary vs destructive actions.
- Wizard navigation shows "Previous" and "Next" without consistent styling.
- Smart Profile shows external simulation buttons with very long text (poor UX).

### Validation & Errors

- Immediate errors shown on page load in some forms (registration, basic-validation) vs deferred in others.
- Heterogeneous error containers (ul lists, alert roles, plain listitems, paragraphs).
- Root-level error pattern only implemented in Business Hours; not reused elsewhere.
- Console warnings in Business Hours: controls outside `ngxVestForm` directive ("ngModel used outside...").
- Control Wrapper forms properly encapsulate error display, showing the intended pattern.

### Forms & Controls

- Mixed use of `NgxControlWrapper` vs manual markup across different examples.
- Required indicator implemented as raw asterisk in text (not standardized / not using aria-required consistently).
- Helper/description text style inconsistent (password hints, async validation hints, etc.).
- Schema Integration forms all share similar field structures but inconsistent wrapper usage.
- Migration Example shows only scaffold text (not implemented).

### Spacing & Layout

- Irregular vertical rhythm; inconsistent padding/margins between sections and form fields.
- Intro sections vary: some have bullet characters inside text instead of semantic list markers.
- Schema forms show very detailed information sections that could be better organized.
- Smart State forms display large JSON objects without proper formatting or collapsibility.

### State & Developer Panels

- Dev/state info naming varies ("Form State", "Form State (Development)") and sometimes always expanded.
- JSON/state dumps unformatted or inline rather than prettified code block.
- Smart Profile shows duplicate state information (form state shown twice).
- External data sections in Smart State need better visual hierarchy.

### Implementation Status

- Several forms show "Scaffold only — implement next" (migration-example, basic-smart-state, realtime-sync, nested-arrays, dynamic-forms, custom-wrapper).
- ArkType schema form shows completely blank page (broken route).
- Purchase form shows completely blank page (broken route).
- Advanced patterns mostly unimplemented, showing planning text instead of working forms.

### Interactivity & Feedback

- Async Validation form is placeholder; lacks pending indicators, debounced feedback, success states.
- No unified pattern for debounce/loading spinners at field or form level.

### Accessibility

- Duplicate headings and unclear hierarchy.
- Icon-only controls missing `aria-label`.
- Grouped inputs missing fieldset/legend (some radio/checkbox sets are plain divs).
- Required fields not consistently announced.

### Iconography

- Glyph-based icons without consistent componentization (trash, plus signs as text).

## 3. Modernization Principles (Material You Inspired)

1. Design Tokens: color, spacing, typography, shape, elevation via CSS variables.
2. Dynamic Theme: `prefers-color-scheme` + toggle; optional future dynamic palette.
3. Typographic Scale: H1/H2/H3/H4 + body/label tokens; variable font (Roboto Flex or Inter Variable).
4. Shape System: sm (4px), md (8px), lg (16px) radii applied contextually (fields md, cards lg).
5. Elevation & Surfaces: Intro card and dev panel use surface-variant + subtle elevation.
6. Motion: 120–160ms easing for focus/hover, list appearance; respect reduced-motion.
7. Accessibility First: semantic groupings, aria-live for errors, focus ring high contrast.
8. Consistent Error Lifecycle: errors appear on blur or submit attempt; no initial red noise.
9. Unified Field Component: label, control, helper, error list, status (pending/success).
10. Progressive Enhancement: core styles minimal; advanced theming opt-in.

## 4. Normalization Spec (Draft)

### Page Skeleton

```text
main
  h1 (Unique Title)
  <app-intro-card>
    h2 Overview
    p Purpose...
    h3 Learning Objectives
    ul > li (no manual bullet chars)
  </app-intro-card>
  form[ngxVestForm]
    section (H2/H3 depending on complexity) ...
    root-errors (renders only when present)
    submit row
  <app-dev-panel collapsed>
```

### Heading Hierarchy

- H1: Page title (once).
- H2: Overview, major form sections (e.g., Profile Form: Personal Information, Address, Preferences).
- H3: Subsections inside complex sections (e.g., Notification Preferences).
- H4: Auxiliary/dev panels.

### Form Field Wrapper (`<app-form-field>` abstraction)

Structure:

```html
<div class="form-field" data-name="email">
  <label for="email" class="field-label"
    >Email<span class="req" aria-hidden="true">*</span></label
  >
  <div class="control-shell pending? error?">
    <input id="email" name="email" [ngModel]="..." />
  </div>
  <p class="helper" id="email-helper">Helper text (optional)</p>
  <ul class="errors" aria-live="polite" aria-atomic="false">
    <li *ngFor="..." role="alert">Error message</li>
  </ul>
</div>
```

Rules:

- No errors list until touched or submit attempted.
- `aria-describedby` linking helper and first error.
- `aria-invalid="true"` applied when field has errors.

### Submit Button State

- Disabled when: `!formState.valid || formState.pending`.
- Shows spinner (CSS animated) when pending.
- Full-width on mobile, auto width on desktop.

### Root-Level (Cross-field) Errors

```html
<div
  class="root-errors"
  *ngIf="rootErrors.length"
  role="alert"
  aria-live="polite"
>
  <ul>
    <li *ngFor="let err of rootErrors">{{ err }}</li>
  </ul>
</div>
```

### Dev Panel

- Collapsible ("details" element or custom) titled "Form State (Dev)".
- Pretty JSON in a fenced code block for readability.
- Optional controls: touch all, reset.

### Icon Buttons

```html
<button type="button" class="icon-btn" aria-label="Remove hour">
  <svg ...></svg>
</button>
```

## 5. Design Tokens (Initial)

```css
:root {
  /* Color */
  --color-primary: hsl(262 80% 55%);
  --color-primary-container: hsl(262 90% 95%);
  --color-surface: hsl(0 0% 100%);
  --color-surface-variant: hsl(270 20% 96%);
  --color-outline: hsl(270 10% 70%);
  --color-error: hsl(356 70% 45%);
  --color-error-container: hsl(356 90% 96%);
  --color-on-primary: #fff;
  --color-on-surface: hsl(270 15% 15%);
  --color-on-surface-variant: hsl(270 10% 30%);
  /* Typography */
  --font-sans: 'InterVariable', system-ui, sans-serif;
  --fs-h1: clamp(2rem, 2.5vw + 1rem, 2.75rem);
  --fs-h2: clamp(1.5rem, 1.5vw + 1rem, 2rem);
  --fs-h3: 1.25rem;
  --fs-h4: 1.125rem;
  --fs-body: 1rem;
  --fw-medium: 500;
  --fw-semibold: 600;
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  /* Shape */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  /* Elevation */
  --elev-1: 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
  --elev-2: 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.06);
  /* Motion */
  --ease-standard: cubic-bezier(0.2, 0, 0.2, 1);
  --dur-fast: 120ms;
  --dur-med: 160ms;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: hsl(270 10% 12%);
    --color-surface-variant: hsl(270 15% 18%);
    --color-primary-container: hsl(262 35% 25%);
    --color-on-surface: hsl(270 15% 92%);
    --color-on-surface-variant: hsl(270 10% 70%);
    --color-outline: hsl(270 10% 45%);
    --color-error-container: hsl(356 35% 20%);
  }
}
```

## 6. Implementation Roadmap

1. Token & Base Styles: add `projects/examples/src/styles/tokens.css` + import in `styles.scss`.
2. Create shared UI components (`app/ui/...`): IntroCard, FormField, DevPanel, IconButton, RootErrors.
3. Refactor Minimal/Simple/Basic Validation/Registration to new skeleton.
4. Apply consistent submit disable logic & error lifecycle.
5. Migrate remaining Core Features forms (batch) with component wrappers.
6. Implement async validation UX (loading indicators, debounced checks) & root validation consistency.
7. Refactor Business Hours to remove standalone ngModel warnings.
8. Add ARIA snapshot Playwright tests (H1 uniqueness, absence of initial errors, presence of form-field wrappers, disabled submit initially).
9. Document style spec in `docs/ui-style-guide.md`.
10. Fix broken routes (arktype-schema-form, purchase-form) and implement scaffold forms.
11. Implement remaining Advanced Patterns (nested-arrays, dynamic-forms, custom-wrapper).
12. Standardize Smart State JSON display patterns.

## 7. Complete Category Analysis

### Fundamentals (✓ Audited)

- Basic patterns working well
- Need consistent error handling
- Submit button states need normalization

### Core Features (✓ Audited)

- Complex patterns like Business Hours need control wrapper migration
- Phone Numbers array handling demonstrates good patterns
- Async validation needs loading indicators

### Control Wrapper (✓ Audited)

- Shows the intended NgxControlWrapper pattern clearly
- Should be the standard for all forms
- Error display properly encapsulated

### Schema Integration (✓ Audited)

- Good separation of type safety (schema) vs validation (Vest)
- Information sections are too verbose, need better organization
- ArkType route completely broken
- Migration example not implemented

### Smart State (✓ Audited)

- Complex external data patterns need better UX
- Duplicate form state display bug
- JSON formatting needs improvement
- Most routes are scaffolds only

### Advanced Patterns (✓ Audited)

- Purchase form completely broken
- Wizard form shows good progressive UI patterns
- Most other routes are scaffolds only
- Need implementation of complex patterns

## 8. Implementation Priority

1. **Critical Fixes** (broken routes, duplicate headings, submit states)
2. **Design Token System** (CSS variables, consistent spacing)
3. **Control Wrapper Migration** (standardize all forms to use NgxControlWrapper)
4. **Advanced Pattern Implementation** (complete scaffold routes)
5. **Performance & UX** (loading states, JSON formatting, collapsible panels)

## 9. Per-Form Checklist Template

```text
[ ] Unique H1 only
[ ] IntroCard with Overview + Objectives
[ ] No duplicate heading text
[ ] All controls wrapped in <app-form-field> or NgxControlWrapper
[ ] Required fields: aria-required + visual indicator
[ ] No initial error messages
[ ] Submit disabled until valid & !pending
[ ] Root errors component (if cross-field logic)
[ ] Icon buttons have aria-label
[ ] Dev panel collapsible
[ ] JSON prettified
[ ] No broken functionality (route loads, form works)
```

## 7. Per-Form Checklist Template

```text
[ ] Unique H1 only
[ ] IntroCard with Overview + Objectives
[ ] No duplicate heading text
[ ] All controls wrapped in <app-form-field>
[ ] Required fields: aria-required + visual indicator
[ ] No initial error messages
[ ] Submit disabled until valid & !pending
[ ] Root errors component (if cross-field logic)
[ ] Icon buttons have aria-label
[ ] Dev panel collapsible
[ ] JSON prettified
```

## 8. Open Questions / Decisions

- Keep submit disabled vs allow and block? (Current leaning: disabled = clearer pedagogy.)
- When to reveal errors: blur OR submit attempt? (Recommend: blur after first interaction; submit reveals all.)
- Should dev panel be globally toggleable via a query param? (Potential future enhancement.)

## 9. Next Actions

- Finish snapshot capture for remaining categories.
- Refine spec with additional patterns (arrays, nested groups, wizard steps).
- Start token + component scaffold.

---

(Will append further findings as additional routes are audited.)
