# Product Requirements Document (PRD): Composable Error Display & State Directives for ngx-vest-forms v1.x

## Objective

Introduce composable, signal-based directives for form control state and error display, enabling advanced users to build custom wrappers and field components with full control over error/warning/pending display logic, without breaking the existing API.

## Background

- v2 introduces `NgxFormControlStateDirective` and `NgxFormErrorDisplayDirective` as hostDirectives, allowing error/state logic to be composed into any component.
- Current v1 only exposes error display via a fixed `control-wrapper` component, limiting flexibility.

## Goals

- Add `FormControlStateDirective` (raw state, error/warning signals, no display logic).
- Add `FormErrorDisplayDirective` (extends state directive, adds error display logic, configurable display mode).
- Refactor `control-wrapper` to use new directives internally, preserving public API.
- Ensure no breaking changes for existing users.
- Provide opt-in, hostDirective-based API for advanced use cases.
- Port and adapt v2 directive tests to v1.

## Non-Goals

- No changes to the core validation or form directive APIs.
- No removal of existing components or directives.

## Requirements

### Checklist: Form Directive Improvements (v1.x, non-breaking)

- [ ] Expose only the signals/inputs needed by the new state and error display directives (do **not** aggregate state or introduce a new `formState` object).
- [ ] Refactor `createAsyncValidator` to use a v2-inspired, composable, debounced, and robust error-handling pattern.
- [ ] Update to latest Angular CLI patterns:
  - Use signals, `computed`, and `afterEveryRender` where appropriate
  - Move host bindings to the `host` object in the decorator (not `@HostBinding`)
  - Remove legacy imperative patterns that can be replaced with signals/effects
- [ ] Remove any error/warning display logic now handled by the new composable directives; keep the form directive focused on form state and validation only.
- [ ] Ensure the directive is composable and works well as a host directive, with no duplicated error/warning logic.
- [ ] All changes must be additive and non-breaking (no new `formState` aggregate, no breaking API changes, all new logic opt-in and compatible with existing usage).

### Functional

- [ ] `FormControlStateDirective` exposes signals for:
  - control state (valid, touched, errors, etc.)
  - error messages (parsed from Angular/Vest)
  - warning messages (from Vest)
  - pending state
- [ ] `FormErrorDisplayDirective`:
  - Extends state directive
  - Adds error display logic (`shouldShowErrors`, `errors`, `warnings`, `isPending`)
  - Configurable error display mode: 'on-blur', 'on-submit', 'on-blur-or-submit'
- [ ] Both directives are usable as hostDirectives in custom components.
- [ ] `control-wrapper` uses new directives internally, no API change.
- [ ] All new APIs are additive and opt-in.

### Non-Functional

- [ ] No breaking changes to existing users.
- [ ] Full test coverage for new directives (adapt v2 tests).
- [ ] Documentation/examples for new usage patterns.

## Acceptance Criteria

- Existing forms/components using `control-wrapper` work unchanged.
- Advanced users can compose error/state logic into custom wrappers via hostDirectives.
- All new signals and error display logic are covered by tests.
- Documentation is updated to show both usage patterns.
