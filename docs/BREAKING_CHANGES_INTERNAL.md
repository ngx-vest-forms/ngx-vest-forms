# ngx-vest-forms Breaking Changes: Internal/Architectural

---

## Internal Changes Summary

| Change                         | v1 Pattern/Behavior                          | v2 Pattern/Behavior                                     | Impact/Reason                                     |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| NGX Naming Convention          | Non-prefixed (FormDirective, ROOT_FORM, etc) | Consistent NGX prefix (NgxFormDirective, NGX_ROOT_FORM) | Avoids conflicts, aligns with Angular conventions |
| Modular Architecture           | Monolithic, all features bundled             | Modular entry points (core, control-wrapper, schemas)   | Tree-shaking, smaller bundles, better structure   |
| Unified formState signal       | Multiple signals/outputs (validChange, etc)  | Single formState signal for all state                   | Easier state management, less duplication         |
| Error object arrays            | Errors as strings                            | Errors as arrays, path utilities                        | Multi-error support, better Angular alignment     |
| Standard Schema support        | Basic, limited                               | Adapters for Zod, ArkType, Valibot                      | Schema validation, type safety                    |
| Improved runtime validation    | Basic, limited                               | Better DX for model/template mismatches                 | Developer experience                              |
| Selector modernization         | scVestForm, sc-control-wrapper               | ngxVestForm, ngx-control-wrapper                        | Angular convention compliance                     |
| Path utilities                 | Basic                                        | Robust, type-safe nested value access                   | Reliability, maintainability                      |
| Error display config overhaul  | Hardcoded, limited                           | Global/per-instance settings via tokens                 | Flexible error display                            |
| Modern Angular migration       | Angular 15-17, legacy APIs                   | Standalone components, signals, new control flow        | Performance, maintainability                      |
| NgxFormControlStateDirective   | Not available                                | Signal-based control state tracking                     | Internal state management                         |
| UpdateOn-aware error display   | Not available                                | Validation timing respects ngModelOptions               | Accurate validation timing                        |
| Schema template extraction     | Not available                                | Runtime schema validation/mismatch detection            | DX, reliability                                   |
| Form-level validation refactor | ValidateRootFormDirective, complex state     | NgxFormLevelValidationDirective, signal-based state     | Cleaner API, no DI cycles, better performance     |
| Unified build output           | Local dist folders per entry point           | All entry points build to main dist directory           | Build system simplification                       |

---

## Internal Improvements and Rationale

- **NGX Naming Convention Implementation:** All public API elements now use NGX prefixing for clarity and to avoid naming conflicts, replacing v1's non-prefixed names.
- **Modular Architecture:** v2 splits the library into multiple entry points (core, control-wrapper, schemas, smart-state), enabling tree-shaking and smaller bundles. v1 was monolithic.
- **Form State Management Refactor:** v2 unifies all form state into a single `formState` signal, replacing v1's multiple outputs/signals.
- **Error Object Structure Modernization:** v2 uses arrays and path utilities for errors, supporting multi-error scenarios and better Angular alignment.
- **Schema Adapters:** v2 introduces adapters for Zod, ArkType, Valibot, supporting Standard Schema v1. v1 had only basic schema support.
- **Runtime Validation Enhancement:** v2 improves error handling for model/template mismatches, providing better developer experience.
- **Selector Modernization:** v2 updates selectors to camelCase and NGX prefix for Angular convention compliance.
- **Path Utilities Implementation:** v2 enhances field path utilities for robust, type-safe nested form value access.
- **Configuration System Overhaul:** v2 improves error display mode configuration with global and per-instance settings via injection tokens.
- **Modern Angular Migration:** v2 fully adopts Angular 19+ standalone components, signals, and new control flow syntax.
- **NgxFormControlStateDirective Implementation:** v2 adds a directive for signal-based control state tracking, used internally by control wrapper.
- **UpdateOn-Aware Error Display:** v2 respects ngModelOptions.updateOn for validation timing.
- **Schema Template Extraction:** v2 adds runtime schema validation and mismatch detection.
- **Form-Level Validation Refactor:** v2 completely rewrites root form validation from `NgxValidateRootFormDirective` to `NgxFormLevelValidationDirective` with cleaner API, signal-based state management, simplified error shape, and elimination of circular DI dependencies.
- **Unified Build Output:** v2 builds all entry points to the main dist directory, simplifying the build system.

---

## Why these changes?

- **Angular Alignment:** Fully embrace Angular's latest best practices and signal-based architecture.
- **Technical Debt Reduction:** Eliminate legacy patterns and improve long-term maintainability.
- **Ecosystem Integration:** Enable seamless integration with modern schema validation libraries.
- **Developer Experience:** Provide more robust, type-safe, and intuitive APIs for both users and contributors.
- **Bundle Optimization:** Modular architecture allows consumers to import only what they need, reducing bundle sizes significantly.
- **Tree-shaking Support:** Secondary entry points enable better dead code elimination and more efficient builds.

---

## Core Modularization Details

### Architecture Changes

The library has been restructured into a modular architecture:

```text
ngx-vest-forms/
├── (main)           # Re-exports from core for backward compatibility
├── core/            # Core form functionality (NEW)
├── schemas/         # Schema adapters (Zod, Valibot, ArkType)
├── smart-state/     # Advanced state management
└── control-wrapper/ # UI helper components
```

### Build System Changes

- **Unified Build Output:** All secondary entry points build to `/dist/ngx-vest-forms/` instead of local dist folders
- **Package Exports:** Angular automatically generates proper package.json exports for all entry points
- **Tree-shaking Ready:** Consumers can import from specific entry points for optimal bundle sizes

### Migration Impact for Contributors

- **Import Updates:** Core functionality is now available via both `ngx-vest-forms` and `ngx-vest-forms/core`
- **Test Configuration:** Tests now run from the `core` structure, with old `src` directory removed
- **Build Process:** Secondary entry points no longer create local dist directories

---

## Migration for Contributors

- **Naming Conventions:** Update all directive classes, types, and tokens to NGX prefix in internal code/tests
- **Architecture:** Review the new `formState`-centric architecture and update internal utilities and tests
- **Error Handling:** Use the new array-based error object structure and field path utilities in all internal code
- **Schema Support:** Prefer Standard Schema adapters for new schema-related features
- **Documentation:** Update all documentation and examples to reflect new selectors, error display modes, and modern Angular APIs
- **Testing:** Update custom wrappers, tests, and internal utilities to use new mode names and validation logic
- **Error Object Migration:** Refactor any custom error display logic and test utilities to handle arrays of errors per field (not just strings)
- **Custom Wrapper Migration:** If you built custom form field wrappers, update them to support the new error object structure and error display configuration

---

## For Maintainers: Migration Checklist

- [ ] Update all directive, type, and token names to NGX prefix in internal code/tests
- [ ] Refactor utilities and tests to use unified formState signal
- [ ] Use array-based error objects and new path utilities
- [ ] Prefer Standard Schema adapters for new schema features
- [ ] Update documentation/examples to reflect new selectors and error display modes
- [ ] Ensure build/test scripts use new modular structure
- [ ] Test secondary entry points for correct build output
- [ ] Review and update custom wrappers and validation logic for new error display timing

---

## References

- [Public API Migration Guide](./BREAKING_CHANGES_PUBLIC_API.md) - User-facing changes and migration steps
- [Standard Schema documentation](https://standardschema.dev/) - Schema specification details
- [NgxFormControlStateDirective documentation](./form-control-state-directive.md) - Directive usage and API
