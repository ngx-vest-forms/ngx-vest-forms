# ngx-vest-forms Breaking Changes: Internal/Architectural

This document lists **internal breaking changes and improvements** to `ngx-vest-forms` for contributors and maintainers. For user-facing public API changes and migration guides, see `BREAKING_CHANGES_PUBLIC_API.md`.

---

## Internal Improvements and Rationale

- **NGX Naming Convention Implementation:** All public API elements (directives, types, tokens, functions) have been updated to use a consistent NGX prefix to follow Angular naming conventions and avoid naming conflicts.
- **Form State Management Refactor:** Unified all form state (value, errors, validity, pending, etc.) into a single `formState` signal, reducing duplication and improving maintainability.
- **Error Object Structure Modernization:** Migrated from joined strings to arrays for better Angular alignment and easier multi-error handling.
- **Standard Schema v1 Adoption:** Schema adapters now support Zod, ArkType, Valibot, and other Standard Schema compatible libraries.
- **Runtime Validation Enhancement:** Improved error handling for model/template mismatches with better developer experience.
- **Selector Modernization:** Updated control wrapper selector to camelCase for Angular convention compliance.
- **Path Utilities Implementation:** Enhanced field path utilities for robust, type-safe nested form value access.
- **Configuration System Overhaul:** Improved error display mode configuration with global and per-instance settings via injection tokens.
- **Modern Angular Migration:** Full adoption of Angular 16+ standalone components, signals, and new control flow syntax.
- **NgxFormControlStateDirective Implementation:** Added standalone directive for signal-based control state tracking used internally by `ngxControlWrapper`.
- **UpdateOn-Aware Error Display:** NgxFormErrorDisplayDirective now respects ngModelOptions.updateOn values for better validation timing.
- **Schema Template Extraction:** Completed `ngxExtractTemplateFromSchema` function for runtime schema validation and mismatch detection.

---

## Why these changes?

- **Angular Alignment:** Fully embrace Angular's latest best practices and signal-based architecture.
- **Technical Debt Reduction:** Eliminate legacy patterns and improve long-term maintainability.
- **Ecosystem Integration:** Enable seamless integration with modern schema validation libraries.
- **Developer Experience:** Provide more robust, type-safe, and intuitive APIs for both users and contributors.

---

## Migration for Contributors

- **Naming Conventions:** All directive classes, types, and tokens now use NGX prefixing - update internal references and tests accordingly.
- **Architecture:** Review the new `formState`-centric architecture and update internal utilities and tests.
- **Error Handling:** Use the new array-based error object structure and field path utilities in all internal code.
- **Schema Support:** Prefer Standard Schema adapters for new schema-related features.
- **Documentation:** Update all documentation and examples to reflect new selectors, error display modes, and modern Angular APIs.
- **Testing:** Update custom wrappers, tests, and internal utilities to use new mode names and validation logic.

---

## References

- [Public API Migration Guide](./BREAKING_CHANGES_PUBLIC_API.md) - User-facing changes and migration steps
- [Standard Schema documentation](https://standardschema.dev/) - Schema specification details
- [NgxFormControlStateDirective documentation](./form-control-state-directive.md) - Directive usage and API
