# Schema Integration Comparison Example

This example demonstrates the power and flexibility of integrating different schema validation libraries with ngx-vest-forms. It provides a comprehensive comparison between Zod, Valibot, ArkType, and a custom schema implementation.

## Features Demonstrated

### 🔀 Dynamic Schema Switching

- Runtime switching between different schema libraries
- Live code display for each selected schema
- Type safety preservation across all schema types
- Performance comparison metrics

### ⚡ Dual Validation Strategy

- **Vest.js**: Real-time interactive validation for optimal UX
- **Schema Validation**: Submit-time data integrity and type safety
- Clear separation of concerns
- Complete validation coverage

### 📊 Library Comparison

- **Zod**: TypeScript-first, popular choice (~12KB)
- **Valibot**: Lightweight and modular (~8KB)
- **ArkType**: Advanced type features (~15KB)
- **Custom**: Minimal dependencies using `ngxModelToStandardSchema` (~1KB)

## Educational Value

This example helps developers:

1. **Understand when to use schemas** vs Vest-only validation
2. **Compare different schema libraries** and their trade-offs
3. **See dual validation in action** with both Vest and schema validation
4. **Learn about performance implications** of different schema libraries
5. **Experience type safety benefits** of schema-first development

## Form Structure

The example uses a comprehensive user profile form with:

```typescript
interface UserProfile {
  name: string;
  email: string;
  age: number;
  website?: string;
  bio: string;
  preferences: {
    newsletter: boolean;
    notifications: boolean;
  };
}
```

## Key Implementation Details

### Schema Integration

```typescript
<form
  ngxVestFormWithSchema
  [vestSuite]="vestSuite"
  [formSchema]="currentSchema()"
  [(formValue)]="model"
>
  <!-- form controls -->
</form>
```

### Dynamic Schema Selection

```typescript
currentSchema = computed(() => {
  switch (this.selectedSchemaType()) {
    case 'zod':
      return zodUserProfileSchema;
    case 'valibot':
      return valibotUserProfileSchema;
    case 'arktype':
      return arktypeUserProfileSchema;
    case 'custom':
      return customUserProfileSchema;
  }
});
```

### Validation Results

The form displays both Vest validation results (for real-time feedback) and schema validation results (for data integrity), demonstrating how they complement each other.

## When to Use This Pattern

- Complex forms with business rules
- Applications requiring type safety
- Shared validation logic between frontend and backend
- Team environments with strict coding standards
- Enterprise applications with data integrity requirements

## Performance Considerations

The example includes performance monitoring to help you understand the trade-offs between different schema libraries. Generally:

- **Custom schemas**: Fastest, minimal overhead
- **Valibot**: Excellent performance with tree-shaking
- **Zod**: Good performance, popular ecosystem
- **ArkType**: Good performance with advanced features

## Related Examples

- **Basic Validation**: Learn ngx-vest-forms fundamentals
- **Control Wrapper**: See how NgxControlWrapper simplifies error display
- **Advanced Patterns**: Explore complex validation scenarios
