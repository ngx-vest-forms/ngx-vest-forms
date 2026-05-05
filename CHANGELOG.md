# Changelog

## Unreleased

- fix: update `fastDeepEqual` to use visited object-pair cycle detection, remove the depth cap, and document `Map`/`Set` reference-only semantics alongside structural `Date`/`RegExp` comparisons
- fix(form-directive): `formState().value` now returns `null` after all controls are dynamically removed instead of returning the previous `linkedSignal` snapshot. Prevents ghost data after group teardown.
- fix(form-control-state): retry `NgModel.control` attachment once via `afterNextRender` when it is undefined on the first effect run, then dispose. Fixes stale state when the directive renders before NgModel registers (no permanent polling).
- fix(validate-root-form): `ngxValidateRootFormMode` and `validateRootFormMode` now default to `undefined`. Mode resolution is `ngx ?? legacy ?? 'submit'` so the documented `ngx`-prefix precedence is finally observable when both attributes are explicitly set. **Behavior change is observable only when both attributes are set on the same form** — neither attribute alone changes behavior versus prior versions.
- feat(pending-state): `createDebouncedPendingState` now accepts either a static `DebouncedPendingStateOptions` object or a `Signal<DebouncedPendingStateOptions>`. Passing a signal makes the debounce timings reactive — `<ngx-form-group-wrapper [pendingDebounce]>` now reflects runtime input changes. Static-object callers are unchanged.
