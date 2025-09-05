# Examples Tailwind Style Guide

This document defines the Tailwind-first conventions for the examples app (breaking changes accepted).

## Core Principles

- Utility-first: Prefer Tailwind utilities and component layer classes over ad-hoc SCSS.
- Host styling: Form containers styled via host class composition, not element selectors.
- Minimal custom CSS: Only for complex gradients, color-mix, or reusable tokens.
- Accessible defaults: Provide focus, error, and spacing patterns in shared utilities.

## Component Layer Classes (`tailwind-components.css`)

### Typography & Headings

- `.example-title` Large gradient page heading.
- `.example-tagline` Supporting paragraph text (60ch width cap).

### Layout Helpers

- `.actions` Flex row -> stacked on small screens.
- `.feature-list` Bullet list with primary colored dot (uses `::before`).

### Buttons

- `.btn` Base button (rounded, spacing, transitions, disabled styles).
- `.btn-primary` Gradient accent primary (uses CSS shadow tokens `--btn-primary-shadow*`).
- `.btn-secondary` Neutral surface button (bordered, subtle hover fill).
- `.btn-danger` Destructive action (solid danger color with hover/active darken).
- `.btn-ghost` Subtle text button.
- `.btn-outline` Neutral outlined button.
- `.btn-modern-primary` Alias retained for legacy -> maps to `.btn-primary`.

### Form Fields

- `.form-field` Vertical stack container (label + input + errors/hint).
- `.form-input` Base input/textarea/select styling with focus ring + invalid state.
- `.input-group` Wrapper enabling `.floating-label` pattern.
- `.floating-label` Absolutely positioned label that shrinks on focus / non-empty.
- `.errors` Error list with consistent red token styling (list variant).
- `.state-badge` Monospaced small badge for state displays.

### Code

- `.code-block` Scrollable code snippet surface.

## Gradients & Surfaces

- Use `surface-gradient-border` (SCSS utility) for gradient border ring.
- Use host classes: `ngx-form-surface-flat form-surface-flat-full surface-gradient-border surface-no-bg` for flat, full-width, gradient bordered forms.

## Tokens

Shadow tokens for buttons:

```css
--btn-primary-shadow;
--btn-primary-shadow-hover;
--btn-primary-shadow-active;
--btn-primary-shadow-disabled;
```

Deprecated (legacy glassmorphism):

```css
--glass-surface;
--glass-border;
--glass-shadow;
--glass-backdrop;
```

## Migration Patterns

| Old Class             | Replacement                                 |
| --------------------- | ------------------------------------------- |
| `form-title-modern`   | `.example-title`                            |
| `form-section-title`  | `text-lg font-semibold`                     |
| `form-surface-modern` | Host surface class list + spacing utilities |
| `form-field-standard` | `.form-field` + `.form-input`               |
| `input-base`          | `.form-input`                               |
| `btn-modern-primary`  | `.btn-primary`                              |
| `btn-outline-sm`      | `.btn-outline text-xs px-3 py-1.5`          |

## Adding New Patterns

1. Prefer composition of existing utilities.
2. If duplication appears in ≥3 places, add a component layer class.
3. Use CSS vars for multi-stop gradients or complex shadow stacks.
4. Document new class in this guide.

## Do / Avoid

- Do: Use arbitrary values sparingly (`text-[10px]`) when no token exists.
- Do: Keep host class lists explicit for surfaces; avoids global element selectors.
- Avoid: Reintroducing element-level form styling rules.
- Avoid: Mixing legacy SCSS with new utilities in same component.

## Future Enhancements

- (Done) Secondary / destructive button variants.
- Focus-visible only rings.
- Reduced-motion animation variants.
- Consolidated dark-mode typography contrast audit.

---

Maintainers: Update this file alongside any new component layer utility addition.

## Deprecated (Removed in Tailwind Migration)

| Legacy Class                                               | Replacement                                        | Notes                                         |
| ---------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------- |
| `.input-base`                                              | `.form-input`                                      | Unified base input styling                    |
| `.form-field-standard`                                     | `.form-field` + `.form-input`                      | Simpler structure, no nested styling          |
| `.form-field-modern`                                       | `.form-field` + `.input-group` + `.floating-label` | Floating label handled by utilities           |
| `.form-title-modern`                                       | `.example-title`                                   | Gradient heading utility                      |
| `.btn-modern-primary`                                      | `.btn-primary`                                     | Alias kept temporarily then removed           |
| `.button-primary` / `.button-secondary` / `.button-accent` | `.btn`, `.btn-primary`, future variants            | Consolidated button system                    |
| `form-styles.scss` file                                    | Removed (all patterns migrated)                    | Delete obsolete SCSS include lines            |
| `.field-base` & `.field-*` variants                        | `.form-input` + `.status-*` text helpers           | Reduced duplication; status styling separated |
| `.text-status-*`                                           | `.status-*`                                        | New semantic utility naming                   |
| `.table-states`, `.table-divider`                          | `.table-states`, `.table-divider` (Tailwind layer) | Reimplemented in Tailwind layer               |
| `.panel-muted`, `.panel-success`                           | `.panel-muted`, `.panel-success` (Tailwind layer)  | Moved to component layer                      |
| `.form-surface-modern`, `.form-surface-flat*`              | Host class composition / utilities                 | Surface styles managed via host & tokens      |

These classes are pruned from `ui/form-styles.scss`. Avoid reintroducing them—compose from existing utilities.
