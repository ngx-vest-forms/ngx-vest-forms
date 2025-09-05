# Form State Demo

## Overview

The **Form State Demo** is a comprehensive showcase of ngx-vest-forms state management capabilities. This example demonstrates real-time monitoring of all form state properties, async validation with proper loading states, and performance tracking.

## 🎯 Learning Objectives

- **Comprehensive State API**: Understand all properties available in `NgxFormState<T>`
- **Real-time Monitoring**: Watch form state changes live as you interact with the form
- **Async Validation**: Experience proper async validation with loading states and cancellation
- **Performance Insights**: Monitor validation timing and optimize user experience
- **Cross-field Validation**: See password confirmation validation in action
- **State-driven UI**: Learn how to build reactive interfaces based on form state

## 🚀 Features Demonstrated

### Core Form State Properties

- `value: T | null` - Current form data
- `errors: Record<string, string[]>` - Field-specific validation errors
- `warnings: Record<string, string[]>` - Field-specific warnings
- `status: 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED'` - Overall form status
- `valid/invalid: boolean` - Form validation state
- `pending: boolean` - Async validation in progress
- `dirty: boolean` - Form has been modified
- `submitted: boolean` - Form has been submitted
- `errorCount/warningCount: number` - Total error/warning counts
- `firstInvalidField?: string` - First field with validation errors

### Advanced Patterns

- **Async Validation**: Username availability check with 1-second delay
- **Loading States**: Visual indicators during async validation
- **Performance Monitoring**: Real-time validation timing display
- **Error Aggregation**: Multiple validation rules per field
- **Cross-field Dependencies**: Password confirmation validation
- **State Visualization**: Live state monitor panel

## 📚 Technical Implementation

### Validation Suite Features

```typescript
// Async validation with cancellation support
test('username', 'Checking availability...', async ({ signal }) => {
  if (data.username && data.username.length >= 3) {
    await checkUsernameAvailability(data.username, signal);
  }
});

// Multiple validation rules per field
test('password', 'Password must contain uppercase', () => {
  enforce(data.password).matches(/[A-Z]/);
});

// Cross-field validation
test('confirmPassword', 'Passwords must match', () => {
  enforce(data.confirmPassword).equals(data.password);
});
```

### Real-time State Access

```typescript
// Reactive form state
readonly formState = computed(() => this.vestForm().formState());

// Performance tracking
effect(() => {
  const pending = this.formState().pending;
  if (pending && this.validationStartTime() === 0) {
    this.validationStartTime.set(performance.now());
  } else if (!pending && this.validationStartTime() > 0) {
    const duration = performance.now() - this.validationStartTime();
    this.lastValidationTime.set(Math.round(duration));
  }
});
```

### State-driven UI Updates

```typescript
// Template usage
@if (vestForm.formState().pending) {
  <span class="loading">⏳ Validating...</span>
}

// Dynamic styling based on state
[class.state-true]="formState().valid"
[class.state-false]="!formState().valid"

// Conditional button states
[disabled]="vestForm.formState().pending"
```

## 🧪 Interactive Scenarios

Try these scenarios to see different form states:

1. **Username Testing**: Try "admin", "user", "test", or "demo" to trigger async validation failures
2. **Password Strength**: Enter passwords to see multiple validation rules apply simultaneously
3. **Confirmation Mismatch**: Type different passwords to see cross-field validation
4. **Performance Monitoring**: Watch validation timing in the state monitor panel
5. **State Transitions**: Observe how different user actions affect form state

## 🎨 Design Features

- **Real-time State Monitor**: Live display of all form state properties
- **Visual Indicators**: Color-coded state values with emojis
- **Performance Metrics**: Validation timing display
- **Error Tracking**: Detailed error breakdown by field
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: Full WCAG 2.2 AA compliance

## 🔧 Key Code Files

- `form-state-demo.validations.ts` - Comprehensive validation suite with async patterns
- `form-state-demo.form.ts` - Form component with state monitoring
- `form-state-demo.page.ts` - Complete example page with educational content
- `form-state-demo.content.ts` - Educational content and best practices

## 🚀 What's Next?

After mastering form state management, explore:

1. **Control Wrapper Introduction** - Learn automated error handling
2. **Async Validation Demo** - Advanced async patterns and strategies
3. **Form-Level Validation** - Cross-field validation with NGX_ROOT_FORM

## 🏗️ Best Practices Demonstrated

1. **State Transparency**: Make form state visible for debugging and user feedback
2. **Performance Optimization**: Use `only(field)` and computed signals for efficiency
3. **Async UX**: Provide clear loading indicators and handle cancellation
4. **Accessibility**: Proper ARIA attributes and screen reader support
5. **Visual Feedback**: Use colors, icons, and animations to guide user interaction
6. **Error Management**: Comprehensive error tracking and display patterns
