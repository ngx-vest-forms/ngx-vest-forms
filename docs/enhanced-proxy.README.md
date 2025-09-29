# Enhanced Proxy - README

The Enhanced Proxy provides a more ergonomic API for accessing form fields through JavaScript Proxy objects.

## Quick Example

```typescript
import { createVestForm, createEnhancedProxy } from 'ngx-vest-forms/core';

const form = createVestForm(suite, { email: '' });
const enhanced = createEnhancedProxy(form);

// Instead of: form.field('email').value()
console.log(enhanced.email()); // Direct field access

// Instead of: form.field('email').set(value)
enhanced.setEmail('user@example.com'); // Direct field setter
```

## Documentation

📖 **[Complete Enhanced Proxy Documentation](../../docs/enhanced-proxy.md)**

## Quick Links

- [Browser Compatibility](../../docs/enhanced-proxy.md#browser-compatibility)
- [Performance Considerations](../../docs/enhanced-proxy.md#performance-considerations)
- [Angular Integration](../../docs/enhanced-proxy.md#angular-integration)
- [NgForm Future Considerations](../../docs/enhanced-proxy.md#future-ngform-considerations)
- [Troubleshooting](../../docs/enhanced-proxy.md#troubleshooting)

## When to Use

✅ **Use Enhanced Proxy when:**

- Building new Angular applications with signals
- Want cleaner, more ergonomic field access syntax
- Working in modern browsers (Proxy support)
- Performance overhead (~1-2ms) is acceptable

❌ **Use Explicit API when:**

- Need IE compatibility
- Building NgForm-heavy applications
- Maximum performance is critical
- Working with very large forms (1000+ fields)

## Future NgForm Integration

This module is designed to be conditionally enabled in future NgForm integration packages:

```typescript
// Future ngform-sync package might implement:
const form = options.useNgForm
  ? createVestForm(suite, data) // Explicit API for NgForm
  : createEnhancedProxy(createVestForm(suite, data)); // Enhanced for signals
```
