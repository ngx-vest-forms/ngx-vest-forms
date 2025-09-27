# V1 API Reference (Archived)

**Date**: September 27, 2025
**Status**: Archived for V2 Migration Reference

## V1 Architecture Overview

V1 followed an NgForm-centric approach where:

- Angular Forms (NgForm) was the primary state manager
- Vest.js was used as a validation adapter/bridge
- Dual state management between NgForm and Vest

## Key V1 Components (Archived)

### Core Directive

- `ngxVestForm` - Main form directive
- Required FormsModule dependency
- Template-driven form integration

### API Pattern

```typescript
// V1 Pattern (Archived)
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
  <input name="email" [ngModel]="model().email" />
</form>
```

### State Management

- NgForm controlled form state
- Vest provided validation results
- Manual synchronization between systems

## Migration to V2

V1 code has been archived. V2 implements:

- Vest-first architecture
- Framework-agnostic core
- Optional Angular integrations
- Enhanced Field Signals API

See V2 documentation for migration guidance.

## Files Archived

This directory contains the complete V1 implementation including:

- Core library packages
- Control wrapper components
- Schema adapters
- Smart state features
- Build configuration
- Tests and documentation

**Note**: This V1 code is preserved for reference only. All active development is on V2.
