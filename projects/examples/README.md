# ngx-vest-forms v2 Examples

This directory contains a comprehensive set of examples demonstrating the ngx-vest-forms library from basic to advanced usage.

## 📁 Directory Structure

```
examples/src/app/
├── 01-getting-started/          # Tier 1: Basic examples
│   ├── simple-form/             # ✅ Single field validation
│   ├── contact-form/            # ✅ Control wrapper usage
│   └── registration-form/       # ✅ Cross-field validation
├── 02-standard-forms/           # Tier 2: Common patterns
│   ├── profile-form/            # ✅ Comprehensive form
│   ├── business-hours-form/     # ✅ Complex nested data
│   ├── survey-form/             # ✅ Conditional validation
│   └── async-validation-form/   # 🚧 Server-side validation
├── 03-schema-integration/       # Tier 3: Type-safe schemas
│   ├── zod-schema-form/         # 🚧 Zod integration
│   ├── valibot-schema-form/     # 📋 Planned
│   └── arktype-schema-form/     # 📋 Planned
├── 04-advanced-state/           # Tier 4: State management
│   ├── smart-profile-form/      # ✅ Smart state extension
│   ├── phone-numbers-form/      # ✅ Dynamic arrays
│   └── realtime-collab-form/    # 📋 Planned
├── 05-complex-integrations/     # Tier 5: Advanced patterns
│   ├── purchase-form/           # ✅ Migration showcase
│   └── wizard-form/             # ✅ Multi-step workflow
└── backup-old-examples/         # 📦 Legacy examples
```

## 🎯 Learning Progression

### Tier 1: Getting Started (3 examples)

Perfect for new users learning the basics:

1. **Simple Form** - Single email field with basic validation
2. **Contact Form** - Multi-field form with NgxControlWrapper
3. **Registration Form** - Password confirmation and terms validation

### Tier 2: Standard Forms (4 examples)

Common real-world form patterns:

4. **Profile Form** - Comprehensive form with nested objects, file upload, various input types
5. **Business Hours Form** - Complex nested structures and dynamic arrays
6. **Survey Form** - Conditional validation, dynamic sections, rating scales
7. **Async Validation Form** - Server-side validation with debounced checks

### Tier 3: Schema Integration (3 examples)

Type-safe forms with popular schema libraries:

8. **Zod Schema Form** - Type inference and validation with Zod
9. **Valibot Schema Form** - Alternative schema library demonstration
10. **ArkType Schema Form** - ArkType integration example

### Tier 4: Advanced State Management (3 examples)

Complex state scenarios:

11. **Smart Profile Form** - External data sync with conflict resolution
12. **Phone Numbers Form** - Dynamic array manipulation
13. **Real-time Collaboration Form** - Multi-user editing (planned)

### Tier 5: Complex Integrations (2 examples)

Production-ready scenarios:

14. **Purchase Form** - Migration showcase with all features
15. **Wizard Form** - Multi-step workflow with navigation

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
