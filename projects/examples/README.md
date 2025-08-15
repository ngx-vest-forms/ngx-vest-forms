# ngx-vest-forms v2 Examples

This directory contains a comprehensive set of examples demonstrating the ngx-vest-forms library from basic to advanced usage.

## 📁 Directory Structure

```
examples/src/app/
├── 01-fundamentals/              # Tier 1: Basics
│   └── minimal-form/             # ✅ Absolute minimum: form + vest validation
├── 02-core-features/             # Tier 2: Core patterns
│   ├── simple-form/              # ✅ Single field validation
│   ├── contact-form/             # ✅ Control wrapper usage
│   ├── registration-form/        # ✅ Cross-field validation
│   ├── profile-form/             # ✅ Comprehensive form
│   ├── business-hours-form/      # ✅ Complex nested data
│   ├── survey-form/              # ✅ Conditional validation
│   └── async-validation-form/    # ✅ Debounced async checks
├── 03-control-wrapper/           # Tier 3: Wrapper-based UX
│   ├── control-wrapper-basics/   # ✅ Simple form with wrapper
│   └── registration-with-wrapper/# ✅ Registration with wrapper
├── 04-schema-integration/        # Tier 4: Type-safe schemas
│   ├── zod-schema-form/          # ✅ Zod integration
│   ├── valibot-schema-form/      # ✅ Valibot integration
│   ├── arktype-schema-form/      # ✅ ArkType integration
│   ├── custom-schema-form/       # ✅ Custom adapter
│   └── migration-example/        # ✅ v1→v2 migration showcase
├── 05-smart-state/               # Tier 5: Smart state
│   ├── basic-smart-state/        # ✅ Minimal smart state
│   ├── smart-profile-form/       # ✅ External data sync
│   ├── phone-numbers-form/       # ✅ Dynamic arrays
│   └── realtime-sync/            # ✅ Collaboration-ready pattern
├── 06-advanced-patterns/         # Tier 6: Advanced patterns
│   ├── purchase-form/            # ✅ Migration showcase
│   ├── wizard-form/              # ✅ Multi-step workflow
│   ├── nested-arrays/            # ✅ Deep nested arrays
│   ├── dynamic-forms/            # ✅ Runtime field generation
│   └── custom-wrapper/           # ✅ Custom error display
└── backup-old-examples/          # 📦 Legacy examples
```

## 🎯 Learning Progression

### Tier 1: Fundamentals

Perfect for new users learning the basics:

1. **Simple Form** - Single email field with basic validation
2. **Contact Form** - Multi-field form with NgxControlWrapper
3. **Registration Form** - Password confirmation and terms validation

### Tier 2: Core Features

Common real-world form patterns:

1. **Profile Form** - Comprehensive form with nested objects, file upload, various input types
1. **Business Hours Form** - Complex nested structures and dynamic arrays
1. **Survey Form** - Conditional validation, dynamic sections, rating scales
1. **Async Validation Form** - Server-side validation with debounced checks

### Tier 3: Control Wrapper

Dedicated examples showing how `<ngx-control-wrapper>` reduces boilerplate and standardizes error/pending UI across fields.

### Tier 4: Schema Integration

Type-safe forms with popular schema libraries:

1. **Zod Schema Form** - Type inference and validation with Zod
1. **Valibot Schema Form** - Alternative schema library demonstration
1. **ArkType Schema Form** - ArkType integration example

### Tier 5: Smart State

Complex state scenarios:

1. **Smart Profile Form** - External data sync with conflict resolution
1. **Phone Numbers Form** - Dynamic array manipulation
1. **Real-time Collaboration Form** - Multi-user editing (planned)

### Tier 6: Advanced Patterns

Production-ready scenarios:

1. **Purchase Form** - Migration showcase with all features
1. **Wizard Form** - Multi-step workflow with navigation

## 🚀 Getting Started

### Run Examples

```bash
npm start
```

### View Structure

Open `http://localhost:4200` to see all examples in a organized, progressive layout.

## 📝 Implementation Status

| Status | Description                          |
| ------ | ------------------------------------ |
| ✅     | Complete and functional              |
| 🚧     | Partial implementation / placeholder |
| 📋     | Planned for future implementation    |
| 📦     | Archived/backup                      |

## 🔧 Key Features Demonstrated

### Core Validation

- Basic field validation with Vest
- Cross-field validation (password confirmation)
- Conditional validation (age-based requirements)
- Nested object validation
- Array validation and manipulation

### Advanced Patterns

- Async validation with server calls
- Smart state management with external data
- Multi-step forms with navigation
- Dynamic form sections
- File upload handling

### Schema Integration

- Type-safe forms with schema inference
- Runtime validation with schema libraries
- Error message customization
- Complex type definitions

### UI/UX Features

- Control wrapper for consistent styling
- Error display strategies
- Loading states
- Progress indicators
- Responsive design with Tailwind CSS

## 🎨 Design Principles

1. **Progressive Enhancement** - Examples increase in complexity
2. **Real-world Scenarios** - Based on common use cases
3. **Best Practices** - Demonstrates recommended patterns
4. **Type Safety** - Full TypeScript integration
5. **Accessibility** - WCAG 2.1 AA compliance
6. **Performance** - Optimized validation and rendering

## 📚 Documentation

Each example includes:

- Comprehensive inline comments
- Type definitions and interfaces
- Validation suite explanations
- Usage patterns and best practices
- Integration notes for production use

## 🔄 Migration Guide

The `purchase-form` example serves as a complete migration showcase, demonstrating:

- v1 to v2 migration patterns
- Modular import usage
- Smart state integration
- Schema utilities
- Best practices for complex forms

## 🛠️ Development

### Adding New Examples

1. Create component in appropriate tier directory
2. Follow naming convention: `[example-name]-form.component.ts`
3. Include validation suite: `[example-name].validations.ts`
4. Add comprehensive documentation
5. Update main app component to display

### Testing Examples

```bash
npm test
```

### Building Examples

```bash
npm run build:app
```

---

For more information, see the [main documentation](../../../README.md) and [migration guide](../../../docs/MIGRATION_GUIDE_V2.md).
