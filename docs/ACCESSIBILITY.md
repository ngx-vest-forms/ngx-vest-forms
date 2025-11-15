# Accessibility Guide

ngx-vest-forms is built with accessibility in mind, following WCAG 2.2 Level AA guidelines.

## Quick Reference

### Field-Level Messages (Polite)

The `ngx-control-wrapper` component uses **polite announcements** for inline field errors, warnings, and pending states:

- `role="status"` with `aria-live="polite"`
- Avoids interrupting typing flow
- Prevents excessive screen reader chatter

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

See the `ControlWrapperComponent` JSDoc for comprehensive accessibility features including:

- Automatic ARIA ID generation
- `aria-describedby` associations
- `aria-invalid` state management
- Unique region identification

## Validation & Testing

Always validate with:

- **Screen readers**: NVDA, JAWS, VoiceOver
- **Automated tools**: [Accessibility Insights](https://accessibilityinsights.io/)
- **Real users**: People who use assistive technologies

## References

- [WCAG ARIA19](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19) - Using role=alert
- [WCAG ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22) - Using role=status
