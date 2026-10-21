# validationConfig trigger-control recreation not supported

## Status

Superseded (2026-10-21): re-created trigger controls are followed; see "Superseded by" below.

## Date

2026-05-18

## Context

`validationConfig` binds a dependent field's revalidation to a trigger control's value changes. To avoid a `statusChanges` feedback loop, the pipeline subscribes with a `take(1)`-style binding to the trigger control instance that exists when the config is wired.

If the trigger control is wrapped in an `@if` (or otherwise destroyed and re-created), Angular creates a **new** `AbstractControl` instance. The pipeline stays bound to the original (now-destroyed) instance, so changes to the recreated control no longer drive dependent-field revalidation.

The v3 review prototyped a `statusChanges`-identity rebind (detecting the new control instance and re-subscribing). It could not be made reliable without reintroducing the `statusChanges` feedback loop the `take(1)` exists to prevent.

## Decision

Retain the known-good `take(1)` binding for v3. Do not attempt automatic rebind on trigger-control recreation. Document the limitation and the workaround.

## Rationale

The `take(1)` binding is proven to prevent the feedback loop, a correctness issue. The prototyped rebind traded that guarantee for an unreliable improvement to an uncommon scenario. Keeping the safe binding and documenting a concrete workaround is the better v3 trade-off.

## Consequences

- A `validationConfig` trigger control that is destroyed and recreated (e.g. behind `@if`) silently stops driving dependent-field revalidation for the new instance.
- Workaround for consumers:
  - Keep the trigger control mounted; toggle it via `disabled`/hidden styling instead of `@if`-destroying it, **or**
  - Recreate the whole form group (so the dependent field and its `validationConfig` are re-wired together).
- This limitation and workaround are linked from the v3 migration guide's "Known limitations (v3)" section.

## Revisit when

- A `statusChanges`-identity rebind (or an alternative trigger-instance tracking mechanism) can be implemented that keeps the feedback-loop regression suite green. Until then, the documented workaround is the supported path.

## Superseded by

The `take(1)` binding was replaced by one that follows the control registered under the trigger's path:

- The pipeline listens to the root form's `events` and maps each one to `form.get(triggerField)`.
- `distinctUntilChanged()` on that control instance switches the inner stream only when the instance really changes, as when `@if` renders a new NgModel under the same name.
- Revalidating dependents emits form events, but those never change which control the path resolves to. So they never resubscribe the inner stream, and the feedback loop this ADR guarded against cannot form.
- The cooldown timer and the deferred-change flag live per trigger field, not per control instance. A rebind that cancelled the cooldown would leave the fields marked in progress for good, so every edit to the new control would be deferred and never replayed. The directive test "revalidates the dependent after the trigger is hidden and shown again" covers this.

The bidirectional-loop and cooldown tests in `validation-config-pipeline.spec.ts` stay green. A new test there covers a removed and re-added trigger, and the split-wrappers e2e covers the date-range page's approach toggle, which re-creates both date inputs. That page no longer re-creates the whole form body to work around this.
