# Accessibility Guide

ngx-vest-forms is built with accessibility in mind, following WCAG 2.2 Level AA guidelines.

## Quick Reference

### Field-Level Messages (Polite)

The `ngx-control-wrapper` component uses **polite announcements** for inline field errors, warnings, and pending states:

> **Backward Compatibility:** The legacy selector `sc-control-wrapper` still works in v2.x and provides the same accessibility features. See the [Selector Prefix Migration Guide](SELECTOR-PREFIX-MIGRATION.md) for migration details.

- `role="status"` with `aria-live="polite"`
- Avoids interrupting typing flow
- Prevents excessive screen reader chatter

The wrapper also:

- merges its own `aria-describedby` tokens with any consumer-provided tokens (so existing hint text associations are preserved)
- toggles `aria-invalid` only when errors are meant to be shown (based on the configured error display mode)

### Group containers (NgModelGroup) — avoid stamping descendant controls

When applying a wrapper to an `NgModelGroup` container (i.e. a region that contains multiple inputs), do **not** automatically set `aria-describedby`/`aria-invalid` on all descendant controls.

Use one of these patterns:

- Prefer per-field wrappers (each input has its own `<ngx-control-wrapper>`) and keep group-level messages separate.
- Prefer using the dedicated `<ngx-form-group-wrapper>` for `NgModelGroup` containers (group-safe by default).
- If you still want to use `<ngx-control-wrapper>` around a group container, set:
  - `ariaAssociationMode="none"` (group-safe mode)

This keeps ARIA relationships predictable and avoids surprising changes across an entire group.

### Unique `id` attributes (avoid duplicates)

Ensure form control `id` attributes are unique in the DOM.

If you render the same child component multiple times on a page (for example, billing + shipping address),
avoid hard-coded IDs like `id="street"`. Prefer an ID prefix derived from the group/property path
(for example, `billingAddress-street`, `shippingAddress-street`).

See: [Child Form Components](./CHILD-COMPONENTS.md).

### Custom wrappers

If you build a custom wrapper component, you can use `FormErrorControlDirective` to get:

- stable region IDs (`errorId`, `warningId`, `pendingId`)
- the same `aria-describedby` merging behavior
- `aria-invalid` wiring

See: [Custom Control Wrappers](./CUSTOM-CONTROL-WRAPPERS.md).

### Form-Level Errors (Assertive)

For blocking post-submit errors, implement a form-level summary with **assertive announcements**:

```html
<!-- Keep in DOM; update on submit -->
<div id="form-errors" role="alert" aria-live="assertive" aria-atomic="true">
  <!-- Populate with error summary when form submission fails -->
</div>
```

## Why This Strategy?

**Polite inline messages:**

- Update frequently as users type
- Non-critical (users can continue typing)
- Following WCAG guidance for continuously updating content

**Assertive form-level errors:**

- Block critical actions (form submission)
- Require immediate attention
- Following WCAG ARIA19/ARIA22 guidance for blocking errors

## Implementation Details

See the `ControlWrapperComponent` docs for comprehensive accessibility features including:

- Automatic ARIA ID generation
- `aria-describedby` associations
- `aria-invalid` state management
- Unique region identification

Component docs:

- [`projects/ngx-vest-forms/src/lib/components/control-wrapper/README.md`](../projects/ngx-vest-forms/src/lib/components/control-wrapper/README.md)

For directive-only composition (no UI), see `FormErrorControlDirective`.

## Validation & Testing

Always validate with:

- **Screen readers**: NVDA, JAWS, VoiceOver
- **Automated tools**: [Accessibility Insights](https://accessibilityinsights.io/)
- **Real users**: People who use assistive technologies

## References

- [WCAG ARIA19](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19) - Using role=alert
- [WCAG ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22) - Using role=status
