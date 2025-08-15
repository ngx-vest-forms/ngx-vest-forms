# ngx-vest-forms Examples Structure & Requirements

## Folder Organization

```
src/app/
├── 01-fundamentals/              # Core concepts without extras
│   ├── minimal-form/             # Absolute minimum: form + vest validation
│   ├── basic-validation/         # Field-level validation patterns
│   └── field-states/             # Touch, dirty, pristine, valid states
│
├── 02-core-features/             # Introduction of control-wrapper
│   ├── simple-form/              # [EXISTING] Migrate to use control-wrapper
│   ├── contact-form/             # [EXISTING] Enhanced with control-wrapper
│   ├── registration-form/        # [EXISTING] Cross-field validation example
│   └── async-validation/         # [EXISTING] Async validation with pending states
│
├── 03-schema-integration/        # Type-safe forms with schemas
│   ├── zod-schema/              # [EXISTING] Zod + control-wrapper
│   ├── valibot-schema/          # [EXISTING] Valibot + control-wrapper
│   ├── arktype-schema/          # [EXISTING] ArkType + control-wrapper
│   ├── custom-schema/           # [EXISTING] Custom schema adapter
│   └── migration-example/       # [NEW] Legacy v1 migration using ngxModelToStandardSchema
│
├── 04-smart-state/              # Advanced state management
│   ├── basic-smart-state/       # [NEW] Minimal smart state example
│   ├── smart-profile/           # [EXISTING] Profile with external sync
│   ├── phone-numbers/           # [EXISTING] Dynamic array management
│   └── realtime-sync/           # [NEW] WebSocket/polling sync with schema
│
├── 05-advanced-patterns/        # Complex real-world scenarios
│   ├── nested-arrays/           # [NEW] 3-level deep nested arrays
│   ├── dynamic-forms/           # [NEW] Runtime field generation
│   ├── multi-step-wizard/       # [EXISTING - wizard-form] Multi-page flow
│   ├── purchase-form/           # [EXISTING] Complex business logic
│   └── custom-wrapper/          # [NEW] Custom error display component
│
├── 06-real-world/              # Complete application examples
│   ├── business-hours/         # [EXISTING] Full business hours management
│   ├── survey-builder/         # [EXISTING - survey-form] Dynamic survey
│   ├── profile-management/     # [EXISTING - profile-form] User profile
│   └── project-management/     # [NEW] The ultimate nested form example
│
└── shared/                     # Shared utilities and components
    ├── models/
    ├── services/
    └── ui/
```

## Form Specifications

### 01-fundamentals

#### minimal-form

- **Purpose**: Show absolute minimum ngx-vest-forms setup
- **Features**:
  - Single field with validation
  - Manual error display (no wrapper)
  - Signal-based model
  - Vest suite integration

#### basic-validation

- **Purpose**: Demonstrate validation patterns
- **Features**:
  - Multiple field types
  - Different validation rules
  - Manual error display
  - Field-specific validation (`only()`)

#### field-states

- **Purpose**: Show form control states
- **Features**:
  - Display touched/untouched states
  - Show dirty/pristine states
  - Valid/invalid indicators
  - Pending state during async validation

### 02-core-features

#### simple-form (MIGRATION)

- **Current**: Uses bare `ngModel`
- **Migration**:
  - Switch to `[ngModel]`
  - Add `<ngx-control-wrapper>`
  - Keep as simple introduction

#### contact-form (ENHANCEMENT)

- **Current**: Basic contact form
- **Enhancement**:
  - Add `<ngx-control-wrapper>` for all fields
  - Add proper validation messages
  - Show accessibility features

#### registration-form (ENHANCEMENT)

- **Current**: Basic registration
- **Enhancement**:
  - Add password confirmation (cross-field)
  - Use `[validateRootForm]="true"`
  - Add `<ngx-control-wrapper>`

#### async-validation (ENHANCEMENT)

- **Current**: Async validation example
- **Enhancement**:
  - Show pending state in wrapper
  - Add loading indicators
  - Demonstrate debouncing

### 03-schema-integration

All schema examples should:

- Use `[formSchema]` for type safety
- Include `<ngx-control-wrapper>`
- Show both Vest and schema validation
- Demonstrate type inference

#### migration-example (NEW)

- **Purpose**: Help v1 users migrate
- **Features**:
  - Use `ngxModelToStandardSchema`
  - Show before/after code
  - Include migration comments

### 04-smart-state

#### basic-smart-state (NEW)

- **Purpose**: Minimal smart state setup
- **Features**:
  - External data source
  - Auto-merge on changes
  - Conflict indicators
  - No schema (simple example)

#### realtime-sync (NEW)

- **Purpose**: Real-time collaboration
- **Features**:
  - WebSocket or polling integration
  - Zod schema for type safety
  - `<ngx-control-wrapper>` for errors
  - Optimistic updates
  - Conflict resolution UI

### 05-advanced-patterns

#### nested-arrays (NEW)

- **See detailed requirements below**

#### dynamic-forms (NEW)

- **Purpose**: Runtime field generation
- **Features**:
  - Add/remove fields dynamically
  - Dynamic validation rules
  - Maintain form state
  - Schema adaptation

#### custom-wrapper (NEW)

- **Purpose**: Custom error display
- **Features**:
  - Use `NgxFormErrorDisplayDirective`
  - Custom styling (non-Tailwind)
  - Animation on error appearance
  - Custom error formatting

## Detailed Requirements: Nested Arrays Form

### Overview

Create a comprehensive project management form demonstrating deeply nested array structures with full CRUD operations at each level.

### Data Structure

```typescript
interface Organization {
  name: string;
  description: string;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'planned' | 'in-progress' | 'completed';
  tasks: Task[];
}

interface Task {
  id: string;
  name: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimatedHours: number;
  actualHours?: number;
  subtasks: Subtask[]; // Optional 4th level
}

interface Subtask {
  id: string;
  description: string;
  completed: boolean;
}
```

### Functional Requirements

#### 1. Form Structure

- Root organization fields (name, description)
- Expandable/collapsible sections for each level
- Visual hierarchy with indentation and borders
- Breadcrumb navigation for deep nesting

#### 2. CRUD Operations

- **Create**: Add button at each array level
- **Read**: Display all nested data with proper formatting
- **Update**: Inline editing of all fields
- **Delete**: Remove button with confirmation for non-empty arrays

#### 3. Validation Rules

```typescript
// Organization level
- name: required, min 3 chars
- description: required, min 10 chars
- projects: min 1 project required

// Project level
- name: required, unique within organization
- dates: endDate must be after startDate
- budget: positive number, required
- milestones: at least 1 milestone required

// Milestone level
- title: required, unique within project
- dueDate: must be between project dates
- status: required enum value
- tasks: optional (can be empty)

// Task level
- name: required
- assignee: required email format
- priority: required enum
- estimatedHours: positive number
- actualHours: positive number, only if completed
- subtasks: optional array

// Subtask level
- description: required, min 5 chars
```

#### 4. UI/UX Requirements

- Drag-and-drop reordering within arrays
- Bulk operations (complete all tasks, delete completed)
- Progress indicators (tasks completed per milestone)
- Auto-save with debouncing
- Undo/redo for array operations
- Import/export JSON functionality

#### 5. Performance Optimizations

- Virtual scrolling for large arrays
- Lazy loading of nested levels
- Memoized computed values (totals, percentages)
- Optimistic updates with rollback

#### 6. State Management

- Use signals for all state
- Computed signals for derived data:
  - Total budget across projects
  - Overall completion percentage
  - Overdue items count
  - Resource allocation summary

#### 7. Accessibility

- Keyboard navigation through nested levels
- Screen reader announcements for CRUD operations
- Focus management after add/delete
- ARIA labels for all interactive elements

#### 8. Error Handling

- Field-level validation errors
- Array-level validation (min/max items)
- Cross-field validation within objects
- Global form validation summary
- Recovery from failed operations

#### 9. Schema Integration

- Zod schema for full type safety
- Runtime validation via schema
- Type inference for model
- Schema-based form generation hints

#### 10. Smart State Features

- External data source simulation
- Optimistic updates
- Conflict detection
- Auto-merge strategies
- Change history tracking

### Technical Implementation Notes

1. **Array Path Management**
   - Use dot notation: `projects.0.milestones.1.tasks.2.name`
   - Dynamic name generation for nested fields
   - Path utilities for navigation

2. **Validation Strategy**
   - Lazy validation for performance
   - Only validate changed paths
   - Batch validation on submit
   - Progressive enhancement

3. **Component Architecture**
   - Recursive components for each level
   - Shared array item component
   - Composition over inheritance
   - Smart/dumb component split

4. **Testing Requirements**
   - Unit tests for CRUD operations
   - Integration tests for validation
   - E2E tests for user workflows
   - Performance benchmarks

## Migration Path for Existing Forms

### Phase 1: Add Control Wrapper

- All existing forms get `<ngx-control-wrapper>`
- Update to use `[ngModel]` pattern
- Maintain current functionality

### Phase 2: Add Schemas

- Add type-safe schemas where applicable
- Demonstrate schema + Vest validation
- Show type inference benefits

### Phase 3: Advanced Features

- Add smart state to suitable forms
- Implement progressive enhancement
- Add accessibility improvements

### Phase 4: New Examples

- Build the new advanced examples
- Focus on real-world scenarios
- Showcase all library features

## Success Metrics

1. **Code Quality**
   - All forms use `[ngModel]` pattern
   - Consistent error handling
   - Type safety throughout
   - Accessible markup

2. **Documentation**
   - Each form has clear purpose
   - Inline comments explain patterns
   - README for each section
   - Migration guides included

3. **Progressive Complexity**
   - Each section builds on previous
   - Clear learning path
   - No feature overload
   - Practical examples

## Recommended Improvements (from recent review)

- Types & API ergonomics
  - Keep public directive inputs accepting unknown | null where it improves DX; narrow internally at use sites with safe casts.
  - Prefer string-only field keys in Vest suites; document NgxFieldKey constraints in validations.
  - Consider exporting a minimal helper type for suite callbacks to guide users in custom suites.

- Control Wrapper DX
  - Now that `errorDisplayMode` is re-exposed via hostDirectives, showcase per-field overrides in examples.
  - Add a short README snippet for `NgxControlWrapper` inputs and recommended error patterns.

- Schema integration
  - Provide a small helper to adapt StandardSchema to runtime schema and vice versa for docs/examples.
  - Ensure template extraction runs only in dev mode and behind isStandardSchema guards (already done); add tests.

- Logging & dev hygiene
  - Wrap non-critical console logs in `isDevMode()` across examples (progress ongoing; verify all examples).
  - Keep critical errors as `console.error` without guards.

- Tests
  - Add focused unit tests around suite casting boundaries and root validator behavior.
  - Add Playwright smoke test for a schema form to validate `[formSchema]` + `[vestSuite]` bindings.

- Accessibility
  - Ensure all example forms associate labels with inputs and use role-based semantics in complex controls.
  - Add aria-live region for form-level error summary example.

- Documentation
  - Expand JSDoc around NgxVestSuite bivariant callback rationale with a one-paragraph summary in core README.
  - Add examples showing `[validateRootForm]` usage for cross-field validation.

- Performance
  - Defer non-critical example sections with `@defer` where appropriate.
  - Audit bundle warnings in examples and trim dependencies where possible.

4. **Performance**
   - Fast initial load
   - Smooth interactions
   - Efficient validation
   - Optimized bundles

## Code Quality Improvements

### Type Safety Enhancements

- [ ] Strengthen `vestSuite` input typing in form.directive.ts
- [ ] Add generic constraints to prevent `any` leakage in templates
- [ ] Create type guards for all schema types
- [ ] Add strict type checking for nested form paths

### NgxControlWrapper Enhancements

- [ ] Expose `errorDisplayMode` input via hostDirectives
- [ ] Add `errorFormatter` input for custom error message formatting
- [ ] Support custom error component injection
- [ ] Add animation support for error appearance/disappearance

### Performance Optimizations

- [ ] Wrap all console.log statements with isDevMode() checks
- [ ] Implement virtual scrolling for large form arrays
- [ ] Add memoization for expensive validation computations
- [ ] Optimize change detection for nested form structures

### Schema Integration Improvements

- [ ] Add combined validation state helper (Vest + Schema)
- [ ] Create schema-to-form-structure generator utility
- [ ] Add schema migration tool for v1 -> v2
- [ ] Implement schema composition utilities

### Developer Experience

- [ ] Add comprehensive JSDoc comments for all public APIs
- [ ] Create VS Code snippets for common patterns
- [ ] Add form debugging utilities (validation tree viewer)
- [ ] Implement form state time-travel debugging

### Testing Infrastructure

- [ ] Add visual regression tests for control-wrapper states
- [ ] Create performance benchmarks for large forms
- [ ] Add accessibility audit tests
- [ ] Implement mutation testing for validation logic

### Documentation Enhancements

- [ ] Document bivariance hack reasoning and implications
- [ ] Add troubleshooting guide for common issues
- [ ] Create video tutorials for advanced patterns
- [ ] Add migration cookbook with real examples

### Accessibility Improvements

- [ ] Ensure all error messages have proper ARIA associations
- [ ] Add keyboard navigation for array operations
- [ ] Implement focus management for dynamic fields
- [ ] Add screen reader announcements for async operations

### Monitoring & Analytics

- [ ] Add performance metrics collection
- [ ] Implement error boundary for form failures
- [ ] Add validation attempt tracking
- [ ] Create form completion analytics helpers

## Breaking Changes to Consider for v3

### API Simplifications

- [ ] Remove deprecated `shapeToSchema` alias
- [ ] Consolidate runtime adapter APIs
- [ ] Simplify schema type hierarchy
- [ ] Remove backward compatibility code

### Modern Angular Features

- [ ] Migrate to Angular's new signal-based forms (when available)
- [ ] Use deferred loading for large form sections
- [ ] Implement partial hydration for SSR forms
- [ ] Adopt new Angular compiler optimizations
