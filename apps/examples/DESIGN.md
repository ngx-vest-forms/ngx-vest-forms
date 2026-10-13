---
name: ngx-vest-forms Examples
description: Developer demo hub for Angular template-driven forms with Vest.js validation
colors:
  # Primary — Confident Teal ramp (OKLCH; Tailwind v4 @theme canonical)
  teal-50: "oklch(0.978 0.014 180.744)"
  teal-100: "oklch(0.952 0.027 180.899)"
  teal-200: "oklch(0.905 0.054 181.072)"
  teal-300: "oklch(0.831 0.096 182.361)"
  teal-400: "oklch(0.742 0.131 183.563)"
  teal-500: "oklch(0.647 0.138 186.42)"
  teal-600: "oklch(0.551 0.128 189.206)"
  teal-700: "oklch(0.473 0.111 191.25)"
  teal-800: "oklch(0.406 0.09 192.846)"
  teal-900: "oklch(0.356 0.07 194.893)"
  teal-950: "oklch(0.253 0.048 198.286)"
  # Ink
  body-ink: "oklch(0.278 0.029 256.848)"
  # Background gradient stops (light mode)
  bg-cool-start: "oklch(0.924 0.018 267.416)"
  bg-teal-end: "oklch(0.954 0.05 195.365)"
  # Background (dark mode)
  dark-surface-deep: "oklch(0.175 0.028 264.052)"
  dark-surface-mid: "oklch(0.264 0.055 293.357)"
  # Semantic states
  error: "#ef4444"
  error-bg: "#fef2f2"
  warning: "#d97706"
  warning-bg: "#fffbeb"
  success: "#16a34a"
  success-bg: "#f0fdf4"
  info: "#2563eb"
  info-bg: "#eff6ff"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.teal-700}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.teal-800}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "#374151"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-danger:
    backgroundColor: "#ffffff"
    textColor: "#b91c1c"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "#f9fafb"
    textColor: "#111827"
    rounded: "{rounded.md}"
    padding: "10px"
  badge-pristine:
    backgroundColor: "#f1f5f9"
    textColor: "#334155"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-valid:
    backgroundColor: "#dcfce7"
    textColor: "#166534"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-invalid:
    backgroundColor: "#fee2e2"
    textColor: "#991b1b"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: ngx-vest-forms Examples

## 1. Overview

**Creative North Star: "The Reference Manual"**

This system is built for developers who want answers quickly. The aesthetic philosophy is: information earns the screen; chrome does not. Every visual decision serves legibility — of the form itself, of the validation feedback, of the code pattern being demonstrated. When in doubt, remove. The surface should read like a well-typeset technical document: precise, confident, visually calm.

The palette is restrained by design. Confident Teal is used only for primary actions, active navigation states, and the library's identity mark — not as decoration. Neutral grays carry the structure. The body background is a soft blue-to-teal gradient that grounds the page with a slight technical-cool quality without competing with content.

This system explicitly rejects: heavy-handed SaaS dashboard aesthetics (gradient blobs, hero metrics, full-color sidebars); marketing-page ornamentation (illustration, big gradients, stock imagery); and lowest-common-denominator admin panel defaults (flat gray with random blue accents). Per PRODUCT.md: "Clarity over decoration. Developers parse fast. Every visual element should either help them orient, help them focus on the demo, or step aside."

**Key Characteristics:**
- One font family (system-ui) at disciplined weights — no display/body pairing needed
- Shadow-sm + thin border on cards; no layered or dramatic elevation
- Teal accent at ≤15% of any screen; earned by primary actions and nav selection only
- Semantic state vocabulary (error/warning/success/info) is the only place non-teal color appears consistently
- Form sections use low-saturation tonal tinting (blue/teal/green sections) to group fields without adding visual noise
- Dark mode is a first-class peer, not an afterthought
- Staggered nav entrance animation is the only motion on load; everything else is instant-or-transition

## 2. Colors: The Confident Teal Palette

One tightly-focused accent ramp; neutral Tailwind grays fill everything else.

### Primary
- **Confident Teal 700** (`oklch(0.473 0.111 191.25)` ≈ `#1f6d6e`): Primary button background, active sidebar indicator. The anchor of the action vocabulary.
- **Confident Teal 600** (`oklch(0.551 0.128 189.206)` ≈ `#27888a`): Dark-mode primary button background.
- **Confident Teal 500** (`oklch(0.647 0.138 186.42)` ≈ `#38a9ab`): Focus rings, active input borders.
- **Confident Teal 50–200**: Hover tints, active nav highlight backgrounds, form section subtonal fills.

### Neutral
- **Near-Black Slate** (`oklch(0.278 0.029 256.848)` ≈ `#1f2937`): All body text in light mode. Slightly blue-shifted; not pure gray, not warm.
- **White / gray-50 / gray-100**: Card surfaces, input backgrounds, secondary button fills. The content layer.
- **gray-200 / gray-300**: Borders, dividers, disabled field outlines.
- **gray-500 / gray-600**: Secondary text, helper text, placeholders (verify contrast at ≥4.5:1 against the card bg — light gray "for elegance" is the failure point to watch).
- **gray-700 / gray-800 / gray-900**: Dark-mode card surfaces; dark-mode body text reversal.

### Semantic States
- **Error**: `#ef4444` (red-500) on `#fef2f2` tint. Used on input borders, error messages, danger buttons.
- **Warning**: `#d97706` (amber-600) on `#fffbeb` tint. Advisory warnings that don't block submission.
- **Success**: `#16a34a` (green-600) on `#f0fdf4` tint. Successful submission, auto-save confirmation.
- **Info**: `#2563eb` (blue-600) on `#eff6ff` tint. Validation hints, untouched field rules.

### Gradient Background (Light)
- **Coastal Mist** — `linear-gradient(to bottom right, oklch(0.924 0.018 267.416), white, oklch(0.954 0.05 195.365))`: cool blue-tinted near-white blending into a teal-tinted near-white. Provides subtle environmental depth without competing with card content. Sits behind the main content layer; never used on cards or form surfaces.

### Named Rules
**The One Voice Rule.** Confident Teal is used on ≤15% of any given screen. Its rarity signals importance — primary action, current route, focused control. Using it decoratively erodes that signal. Every non-teal blue in the interface is a semantic tone (info), not the brand.

**The Gradient-Behind-Only Rule.** The Coastal Mist gradient belongs to the body background. It never appears inside cards, form sections, or modals. Content lives on flat white or gray-50, not on gradients.

## 3. Typography

**Display / UI Font:** `ui-sans-serif, system-ui, sans-serif` (system font stack)
**Mono Font:** `ui-monospace, SFMono-Regular, monospace` (used for the brand mark and code snippets)

**Character:** A single family used at disciplined weights. The system font stack gives native-platform fidelity — developers trust what their OS renders. The mono font is reserved for the brand logotype and code; its appearance signals "this is technical", not decoration.

### Hierarchy
- **Display** (700, 1.875rem / 30px, lh 1.25, normal tracking): Page `<h1>` — the demo title. One per page. `text-wrap: balance` recommended.
- **Headline** (700, 1.25rem / 20px, lh 1.4): Card headings (`<h3>`), section headings within cards. The most commonly-seen heading weight in the UI.
- **Title** (500, 1.125rem / 18px, lh 1.5): Section-level groupings; `.section-title` class. One step below headline.
- **Body** (400, 1rem / 16px, lh 1.5): Paragraph text, subtitles, description prose. Max 65–75ch for prose; dense UI and lists may run wider.
- **Label** (500, 0.875rem / 14px, lh 1.4): Form field labels, nav items, button text, badge text. The dominant type size in the interface.
- **Caption / Helper** (400, 0.875rem / 14px): Error messages, helper text, metadata, timestamps.
- **Micro** (600, 0.7rem / ~11px, tracking-[0.18em], uppercase): Sidebar category headings only. Do not use this style outside the nav grouping context; wide-tracked uppercase at this size becomes an eyebrow cliché anywhere else.
- **Mono Brand** (600, 0.875rem, tracking-tight): The `ngx-vest-forms` logotype in the sidebar and mobile header. Nowhere else.

### Named Rules
**The Micro Rule.** Wide-tracked uppercase text is used exactly once: sidebar category labels. It earns its place because nav categories need to be visually distinct from nav items without adding extra decoration. Using this style as section eyebrows on content pages is explicitly banned.

## 4. Elevation

This system is flat-first with ambient lift. Surfaces are separated by value (white vs. gray-50 vs. gradient body) and by thin borders, not by dramatic shadows.

### Shadow Vocabulary
- **Ambient lift** (`box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)` — Tailwind `shadow-sm`): Cards only. Separates the card from the gradient body. Low-contrast, ambient, not structural. Never used on buttons, inputs, or sections.
- **No shadow**: Everything else — form sections, sidebars, nav items, badges, form controls. Elevation is implied by background value, not shadow.

### Tonal Layering
When cards need internal structure (e.g. the `ngx-form-section` component), the pattern is a tinted border + 3–10% tinted background, not a nested card. Form sections use this for blue, teal, green, purple, orange tones. The floating legend (positioned `h2` at `-top-3`) is the section label technique; it avoids adding shadow or card nesting.

### Named Rules
**The Flat-By-Default Rule.** Shadows appear only on cards sitting directly on the gradient body. Everything inside a card is flat. Nested cards with their own shadows are always wrong — the whole point of the card is that it's the containment surface.

## 5. Components

### Buttons
- **Shape:** rounded-lg (8px) for all buttons. Full-pill (`rounded-full`) reserved for status badges and icon-only circular actions only.
- **Primary** (`btn-primary`): teal-700 bg, white text, hover → teal-800. Focus: 4-ring at teal-300 (light) or teal-800 (dark). The dominant call-to-action.
- **Secondary** (`btn-secondary`): white bg, gray-700 text, 1px gray-300 border. Hover → gray-50. The "reset" or "cancel" register. Pair with primary; don't stack two primaries.
- **Danger** (`btn-danger`): white bg, red-700 text, 1px red-300 border. Destructive actions only. Focus: 4-ring red-200.
- **Success** (`btn-success`): green-600 bg, white text. Submission confirmation; appears after successful validation pass.
- **Input action** (`btn-input-action`): small (xs text, 3/1.5 padding), positioned inside input containers. Comes in primary (blue tint) and danger (red tint) variants.
- **States:** every button variant must implement default → hover → focus → active → disabled. Disabled uses `opacity-50 cursor-not-allowed`; do not change color or shape.

### Cards (`ngx-card`)
- **Shape:** rounded-xl (12px), bg-white, border border-gray-200, shadow-sm, p-6.
- **With title:** adds an internal header div with bottom border (border-gray-200), h3 (headline weight), optional subtitle (caption).
- **No card nesting.** If you need grouped sub-content inside a card, use form sections or dividers — never a second card inside a card.

### Form Controls (`.input-field`)
- **Shape:** rounded-lg (8px), bg-gray-50, border-gray-300, p-2.5 (10px), text-sm.
- **Focus:** border-primary-500, ring-primary-500.
- **Error state** (`aria-invalid="true"`): border-red-500, bg-red-50, text-red-900.
- **Disabled:** border-gray-200, bg-gray-100, text-gray-500, opacity-70, cursor-not-allowed.
- All controls share the same shape vocabulary. Do not use different radii between select, input, and textarea.

### Form Sections (`ngx-form-section`)
- **Shape:** rounded-lg (8px) with colored border and low-saturation tinted bg (3–10% opacity).
- **Available tones:** blue, teal, green, purple, orange, neutral. Each has a matching floating legend label.
- **Use tones deliberately:** pick a tone for semantic meaning (blue = account/identity, teal = library-native/financial, green = success-adjacent). Don't assign tones randomly.

### Badges (`ngx-status-badge`)
- **Shape:** rounded-full, text-xs font-medium, px-2.5 py-0.5.
- **States:** pristine (slate), pending (gray), valid (green), invalid (red). Colors are semantic, not customizable per-instance.

### Alert Panels (`ngx-alert-panel`)
- **Shape:** rounded-lg (8px), p-4, 1px border.
- **Tones:** error (red), warning (yellow/amber), info (blue), success (green). Tone drives all color.
- **Accessibility:** `role="alert"` + `aria-live="assertive"` for error tone; `role="status"` + `aria-live="polite"` for all others.

### Navigation (Sidebar)
- **Active state:** bg-primary-50 bg, primary-800 text, font-semibold, 2px primary-600 left indicator bar.
- **Inactive:** text-gray-600, hover → bg-gray-100/70 text-gray-900.
- **Category headings:** micro style (0.7rem, tracking-[0.18em], uppercase, gray-400). Not interactive.
- **Entrance:** `fade-in-up` stagger per category group (0.4s ease-out, 60ms per group delay). Respects `prefers-reduced-motion`.

### JSON / Code Preview
- **Shape:** rounded-lg, bg-gray-50 (light) / bg-gray-900 (dark), p-3, text-xs, text-gray-800 (light) / text-gray-300 (dark), `resize: vertical`, `overflow: auto`.
- Monospace font stack. No syntax highlighting in base implementation.

## 6. Do's and Don'ts

### Do's
- **Use the teal palette for navigation state and primary actions only.** Let neutral grays carry the layout chrome.
- **Use semantic state colors (red/amber/green/blue) consistently.** The same shade for error on every input, in every form, on every page.
- **Use form sections with tonal tinting to group related fields.** The tone is semantic (blue = account, teal = financials); assign it to match the content.
- **Pair one primary button with one secondary button per form action area.** `btn-primary` for submit, `btn-secondary` for reset.
- **Implement all five states for every interactive control:** default, hover, focus, active, disabled. Partial states ship unfinished components.
- **Keep form control shapes uniform.** All inputs, selects, and textareas use `rounded-lg` + `border-gray-300` + `bg-gray-50`. Don't break the vocabulary for one control.
- **Use `shadow-sm` + border on cards, and nothing else.** No layered shadows, no `shadow-md` or larger on flat content.
- **Respect `prefers-reduced-motion`.** The `fade-in-up` nav stagger already does this. Apply the same pattern to any new animation: instant fallback, not just "shorter duration".

### Don'ts
- **Don't use `border-left` > 1px as a colored accent** on list items, callouts, or cards. Rewrite with tonal backgrounds or nothing.
- **Don't nest cards.** No `ngx-card` inside `ngx-card`. Use form sections or dividers internally.
- **Don't use gradient text** (`background-clip: text`). Emphasis via weight or teal color only.
- **Don't use the micro uppercase style (tracking-[0.18em], all-caps, 0.7rem) outside the sidebar nav.** It's earned there; it reads as AI scaffolding everywhere else.
- **Don't add shadows to form sections, inputs, or buttons.** `shadow-sm` lives on cards against the body gradient. Everywhere else is flat.
- **Don't use teal decoratively** — no teal borders, teal section headings, or teal icon fills unless it's a primary action or active nav state.
- **Don't introduce a second accent color** without a deliberate semantic role. The semantic state palette (error/warning/success/info) is not a design choice to vary per component — it's a system contract.
- **Don't use `border-radius: 24px+` on cards, sections, or inputs.** `rounded-xl` (12px) on cards and `rounded-lg` (8px) on controls are the ceiling.
