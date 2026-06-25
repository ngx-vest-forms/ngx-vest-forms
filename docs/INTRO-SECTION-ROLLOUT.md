# Intro Section Component Rollout Plan

## Overview
This document captures the rollout strategy for applying the new `IntroSectionComponent` and `IntroItemComponent` across all 17 form demo pages in the examples app.

## Components Reference
- **IntroSectionComponent**: Reusable full-width intro section (location: `apps/examples/src/app/ui/intro-section/intro-section.component.ts`)
  - Provides semantic `<section>`, heading, and `<ul>` wrapper
  - Configurable title input: `title="string"`
  - Content projection for list items
  - Responsive padding: `py-6 md:py-8`
  - Dark mode support

- **IntroItemComponent**: Reusable bullet item (location: `apps/examples/src/app/ui/intro-section/intro-item.component.ts`)
  - Wraps content in semantic `<li>`
  - Styled bullet mark in teal (teal-500 light / teal-400 dark)
  - Flex layout with proper vertical alignment
  - Accessibility: aria-hidden on decorative bullet mark

## Application Pattern

### 1. TypeScript Component Updates
Add imports to each page's `.page.ts` file:
```typescript
import { IntroItemComponent, IntroSectionComponent } from '../../ui/intro-section';
```

Update imports array in component decorator:
```typescript
imports: [
  PageTitle,
  IntroSectionComponent,
  IntroItemComponent,
  // ... other imports, remove FormPageLayout if present
]
```

### 2. HTML Template Updates
Replace old sidebar pattern (when present):
```html
<ngx-form-page-layout>
  <div layout-aside class="sidebar-card-stack">
    <!-- Old sidebar content -->
  </div>
  <div layout-main>
    <!-- Form content -->
  </div>
</ngx-form-page-layout>
```

With new intro section pattern:
```html
<ngx-intro-section title="Custom Title">
  <ngx-intro-item>[Bullet 1 content]</ngx-intro-item>
  <ngx-intro-item>[Bullet 2 content]</ngx-intro-item>
  <ngx-intro-item>[Bullet 3 content]</ngx-intro-item>
  <ngx-intro-item>[Bullet 4 content]</ngx-intro-item>
</ngx-intro-section>

<!-- Two-column form layout -->
<div class="py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
  <!-- Left: state card or related info -->
  <div>
    <!-- Supporting content -->
  </div>
  <!-- Right: main form -->
  <div>
    <!-- Form content -->
  </div>
</div>
```

## Rollout Phases

### Phase 1: High-Priority Pages (4 pages) ✅ IN PROGRESS
These pages establish core patterns and are referenced by learners early in their journey.

1. **Starter Contact Form** ✅ COMPLETED
   - Title: "Why start here"
   - Bullets: Minimal API, public API only, error on blur, signal-owned state
   - Status: DONE - Template updated, visual validated, no errors

2. **Async Username Form** 🔄 IN PROGRESS
   - Title: "Why this matters"
   - Bullets: Async validation gated, request cancellation, pending state, memo keying
   - File: `apps/examples/src/app/pages/async-username-form/`
   - TS Updated: ✅ Imports added
   - HTML: ⏳ Pending (template encoding issues)

3. **Validation Config Demo** 🔄 IN PROGRESS
   - Title: "Why this matters"
   - Bullets: One config map, conditional revalidation, errors vs warnings, conditional rules
   - File: `apps/examples/src/app/pages/validation-config-demo/`
   - TS Updated: ✅ Imports added, FormPageLayout removed
   - HTML: ⏳ Pending

4. **Custom Controls Form**
   - Title: "Why this matters"
   - Bullets: CVA contract, controls in validation, touch-driven errors, keyboard accessible
   - File: `apps/examples/src/app/pages/custom-controls-form/`
   - TS: ⏳ Pending
   - HTML: ⏳ Pending

5. **Business Policy Form**
   - Title: "Why this matters"
   - Bullets: Conditional rules in Vest, cross-field rules (ROOT_FORM), warnings vs errors, portable suite
   - File: `apps/examples/src/app/pages/business-policy-form/`
   - TS: ⏳ Pending
   - HTML: ⏳ Pending

### Phase 2: Medium-Priority Pages (7 pages)
Important advanced patterns; build on Phase 1.

- Business Hours Form (each, per-entry validation, form-level rules)
- Complex Nested Form (ngModelGroup, reusable children, vestFormsViewProviders)
- Purchase Form (full checkout, async uniqueness, imperative helpers)
- Wizard Form (multi-step, reactive config)
- Auto-Save Demo (blur-driven persistence, generation counter)
- Date Range Adapter (composite widget, adapter fan-out)
- Display Modes Demo (error/warning timing, display mode control)

### Phase 3: Lower-Priority Pages (5 pages)
Specialized patterns; reference-only for specific use cases.

- Conditional Structure Demo (clearFieldsWhen, keepFieldsWhen)
- Submission Patterns Form (4-state flow, server error handling)
- Native Schema Demo (Vest native schema, enforce.shape)
- Zod Schema Demo (external schema integration)
- Accessible Wrapper Demo (custom wrappers, ARIA helpers)

## Known Issues & Workarounds

### Issue: String Replacement Encoding
**Problem**: Some HTML files contain "smart quotes" (curly quotes) that cause string matching to fail.
**Impact**: `replace_string_in_file` tool fails on files with fancy character encoding.
**Workaround 1**: Manually edit HTML templates in VS Code (copy-paste works fine)
**Workaround 2**: For automation, use `create_file` to fully replace problematic files after reading and regenerating content

### Issue: FormPageLayout Dependency
**Problem**: Several pages still reference FormPageLayout component which is being phased out.
**Solution**: When updating HTML templates, replace the entire layout structure with new grid-based two-column layout using Tailwind.

## Suggested Implementation Order

1. **Complete Phase 1** (this session): Get 4 high-priority pages fully updated with both TS and HTML
2. **Phase 2 Batch 1**: Next session - update top 3 medium-priority pages (business-hours, complex-nested, purchase)
3. **Phase 2 Batch 2**: Following session - update remaining medium-priority pages
4. **Phase 3**: Reference documents - update as needed when teams request specific patterns

## Testing Checklist for Each Page

After updating each page:
- [ ] No TypeScript errors (run type check)
- [ ] Visual appearance on localhost:4200/[route]
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Dark mode toggle works
- [ ] Form functionality unchanged
- [ ] No console errors

## Performance Notes
- No performance impact expected (component lifecycle is identical to inline markup)
- Reusable component reduces bundle size slightly per page updated
- No additional network requests

## Accessibility Notes
- Decorative bullets are aria-hidden (already handled by IntroItemComponent)
- Semantic HTML structure preserved (ul/li)
- Keyboard navigation through list items works automatically
- WCAG 2.2 AA compliant color contrast on teal bullets
- No reduced-motion issues (no animations in component)

## Files to Track
- `apps/examples/src/app/ui/intro-section/intro-section.component.ts`
- `apps/examples/src/app/ui/intro-section/intro-item.component.ts`
- `apps/examples/src/app/ui/intro-section/index.ts`
- All 17 page `.page.ts` and `.page.html` files in `apps/examples/src/app/pages/*/`

## Future Considerations
1. If new pages are added to examples, use intro-section by default
2. Consider extracting intro copy to a content registry if more customization needed
3. FormPageLayout can eventually be deprecated once all pages migrated
