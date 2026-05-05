# Changelog

## Unreleased

### fix

- **destroy-aware async scheduling**: Add `scheduleTimeout` and `scheduleMicrotask` utilities in
  `utils/destroy-scheduler` that auto-cancel when the supplied `DestroyRef` fires. Replace all
  bare `setTimeout` and `queueMicrotask` calls in `FormDirective` and `ValidateRootFormDirective`
  with these primitives. Add destroyed-flag guards before any `ChangeDetectorRef` interaction
  (`detectChanges` / `markForCheck`) and before signal writes in async `done()` callbacks.
  Destroying a directive while async validation is in flight no longer produces
  `ViewDestroyedError`, no leaked timer closures, and no writes to disposed signals.
