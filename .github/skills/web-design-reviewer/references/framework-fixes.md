# Framework-specific Fix Guide

This document explains specific fix techniques for each framework and styling method.

---

## Pure CSS / SCSS

### Fixing Layout Overflow

```css
/* Before: Overflow occurs */
.container {
  width: 100%;
}

/* After: Control overflow */
.container {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
```

### Text Clipping Prevention

```css
/* Single line truncation */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line truncation */
.text-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Word wrapping */
.text-wrap {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
```

### Spacing Unification

```css
/* Unify spacing with CSS custom properties */
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

.card {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
```

### Improving Contrast

```css
/* Before: Insufficient contrast */
.text {
  color: #999999;
  background-color: #ffffff;
}

/* After: Meets WCAG AA standards */
.text {
  color: #595959; /* Contrast ratio 7:1 */
  background-color: #ffffff;
}
```

---

## Tailwind CSS v4

### Layout Fixes

```html
<!-- Before: Overflow -->
<div class="w-full">
  <img src="..." />
</div>

<!-- After: Overflow control -->
<div class="w-full max-w-full overflow-hidden">
  <img src="..." class="w-full h-auto object-contain" />
</div>
```

### Text Clipping Prevention

```html
<!-- Single line truncation -->
<p class="truncate">Long text...</p>

<!-- Multi-line truncation -->
<p class="line-clamp-3">Long text...</p>

<!-- Allow wrapping -->
<p class="break-words">Long text...</p>
```

### Responsive Support

```html
<!-- Mobile-first responsive -->
<div class="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">
  <div class="w-full md:w-1/2 lg:w-1/3">
    Content
  </div>
</div>
```

### Spacing Unification (Tailwind v4 CSS-first config)

```css
/* app.css — Tailwind v4 uses CSS-first configuration */
@import 'tailwindcss';

@theme {
  --spacing-18: 4.5rem;
  --spacing-22: 5.5rem;
  --color-brand: oklch(0.65 0.2 250);
  --color-brand-light: oklch(0.85 0.12 250);
}

/* Custom utility (Tailwind v4 syntax) */
@utility content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-6);
}
```

### Accessibility Improvements

```html
<!-- Add focus state -->
<button class="
  bg-blue-500 text-white
  hover:bg-blue-600
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
">
  Button
</button>

<!-- Improve contrast -->
<p class="text-gray-700 bg-white"> <!-- Changed from text-gray-500 -->
  Readable text
</p>
```

### Tailwind v4 Gradient Syntax

```html
<!-- v3 (deprecated): bg-gradient-to-br -->
<!-- v4: bg-linear-to-br -->
<div class="bg-linear-to-br from-blue-500 to-purple-600">
  Gradient background
</div>
```

---

## Angular Component Styles

### Fixes in Component Scope

```css
/* component.scss — Angular ViewEncapsulation.Emulated (default) */

/* Before */
:host {
  display: block;
}

/* After: Add overflow control */
:host {
  display: block;
  max-width: 100%;
  overflow: hidden;
}

.container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
```

### Host Binding Styles

```typescript
// Angular 21 — host bindings via decorator or host metadata
@Component({
  selector: 'app-card',
  host: {
    'class': 'block p-4',
    '[class.overflow-hidden]': 'true',
    '[style.maxWidth.%]': '100',
  },
  template: `...`,
})
export class CardComponent {}
```

### Deep Selectors (Affecting Child Components)

```css
/* Use ::ng-deep sparingly — it's deprecated but still supported */
:host ::ng-deep .child-class {
  margin-bottom: 1rem;
}

/* Preferred: use Angular CDK or shared styles instead */
```

### Angular CDK Overlay Positioning

```typescript
import { CdkOverlayOrigin, CdkConnectedOverlay } from '@angular/cdk/overlay';

// Use CDK for dropdowns, tooltips, modals instead of manual z-index.
// CDK manages stacking context and positioning automatically.
```

---

## Modern CSS Features (2025/2026 Baseline)

### Container Queries

```css
/* Respond to parent container size, not viewport */
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    grid-template-columns: 1fr 1fr;
  }
}
```

### oklch Colors

```css
/* Perceptually uniform colors with better gamut */
:root {
  --primary: oklch(0.65 0.2 250);
  --primary-hover: oklch(0.55 0.2 250);
  --surface: oklch(0.98 0.01 250);
  --text: oklch(0.25 0.02 250);
}
```

### CSS Layers

```css
/* Control specificity with @layer */
@layer reset, base, components, utilities;

@layer base {
  body { font-family: system-ui, sans-serif; }
}

@layer components {
  .btn { padding: 0.5rem 1rem; }
}
```

### Native Dialog & Popover

```html
<!-- Native dialog — no z-index management needed -->
<dialog id="confirm-dialog">
  <h2>Are you sure?</h2>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="confirm">Confirm</button>
  </form>
</dialog>

<!-- Popover API — built-in dismiss behavior -->
<button popovertarget="info-popup">Info</button>
<div id="info-popup" popover>
  <p>Helpful information here.</p>
</div>
```

### View Transitions

```css
/* Smooth page transitions with View Transitions API */
::view-transition-old(root) {
  animation: fade-out 200ms ease-out;
}
::view-transition-new(root) {
  animation: fade-in 200ms ease-in;
}
```

### Anchor Positioning (Emerging)

```css
/* CSS-native tooltip/popover positioning */
.tooltip {
  position: absolute;
  position-anchor: --trigger;
  top: anchor(bottom);
  left: anchor(center);
}
```

---

## Angular SSR / Server-side Rendering

### Global Style Fixes

```css
/* styles.scss or styles.css — Angular global styles */
:root {
  --foreground: oklch(0.15 0.02 260);
  --background: oklch(0.99 0.005 260);
  color-scheme: light dark;
}

/* Prevent layout overflow */
html, body {
  max-width: 100vw;
  overflow-x: hidden;
}

/* Prevent image overflow */
img {
  max-width: 100%;
  height: auto;
}
```

### Fixes in Layout Components

```typescript
// app.component.ts — Angular shell layout
@Component({
  selector: 'app-root',
  template: `
    <header class="sticky top-0 z-50">
      <!-- Header -->
    </header>
    <main class="flex-1 container mx-auto px-4 py-8">
      <router-outlet />
    </main>
    <footer>
      <!-- Footer -->
    </footer>
  `,
  host: { class: 'min-h-screen flex flex-col' },
})
export class AppComponent {}
```

---

## Common Patterns

### Fixing Flexbox Layout Issues

```css
/* Before: Items overflow */
.flex-container {
  display: flex;
  gap: 1rem;
}

/* After: Wrap and size control */
.flex-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.flex-item {
  flex: 1 1 300px; /* grow, shrink, basis */
  min-width: 0; /* Prevent flexbox overflow issues */
}
```

### Fixing Grid Layout Issues

```css
/* Before: Fixed column count */
.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

/* After: Auto-adjust */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}
```

### Organizing z-index

```css
/* Systematize z-index */
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-tooltip: 500;
}

.modal {
  z-index: var(--z-modal);
}
```

### Adding Focus States

```css
/* Add focus state to all interactive elements */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Customize focus ring */
.custom-focus:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.5);
}
```

---

## Debugging Techniques

### Visualizing Element Boundaries

```css
/* Use only during development */
* {
  outline: 1px solid red !important;
}
```

### Detecting Overflow

```javascript
// Run in console to detect overflow elements
document.querySelectorAll('*').forEach(el => {
  if (el.scrollWidth > el.clientWidth) {
    console.log('Horizontal overflow:', el);
  }
  if (el.scrollHeight > el.clientHeight) {
    console.log('Vertical overflow:', el);
  }
});
```

### Checking Contrast Ratio

```javascript
// Use Chrome DevTools Lighthouse or axe DevTools
// Or check at the following site:
// https://webaim.org/resources/contrastchecker/
```

### Checking Container Query Support

```javascript
// Verify container queries are working
document.querySelectorAll('[style*="container-type"]').forEach(el => {
  console.log('Container:', el, 'Size:', el.clientWidth, 'x', el.clientHeight);
});
```
