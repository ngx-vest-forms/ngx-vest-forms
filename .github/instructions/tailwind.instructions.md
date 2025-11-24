---
description: Tailwind CSS v4 usage rules for styling (2025 best practices)
applyTo: 'projects/examples/**/*.{html,js,jsx,ts,tsx,css,scss,sass,md,mdx}'
---

## Project Setup (Tailwind CSS v4.1.17)
- This project uses **Tailwind CSS v4.1.17** with the new CSS-first configuration approach
- PostCSS plugin: `@tailwindcss/postcss` (configured in `.postcssrc.json`)
- Angular 21's built-in PostCSS support processes Tailwind automatically
- Theme configuration is in CSS `@theme` blocks (see `projects/examples/src/styles.scss` and `projects/ngx-vest-forms/.storybook/styles.scss`)
- The `tailwind.config.js` file is legacy and no longer used (kept for reference only)

## General Guidelines
- Use Tailwind utility classes for consistent styling, with custom CSS only for special cases
- Organize classes logically (layout, spacing, color, typography)
- Use responsive and state variants (e.g., sm:, md:, lg:, hover:, focus:, dark:) in markup
- Embrace Tailwind v4 features like container queries, CSS variables, and oklch colors
- Rely on Tailwind classes rather than inline styles or external CSS files for a unified design language

## Configuration (CSS Files)
- Use `@use 'tailwindcss';` instead of the old `@tailwind` directives
- Use the `@theme` directive to define custom design tokens like fonts, breakpoints, and colors
- Prefer modern color formats such as `oklch` for better color gamut support and P3 color gamut
- Theme colors use CSS custom properties (e.g., `--color-primary-500: oklch(0.647 0.138 186.42);`)
- Take advantage of automatic content detection, which eliminates the need for a `content` array
- Rely on Oxide engine to scan project files, excluding those in `.gitignore` and binary extensions
- Add specific sources with `@source` only when necessary
- Extend Tailwind with custom utilities using the `@utility` directive (not `@layer utilities`)

## Styling (CSS Files)
- **CRITICAL**: Avoid using `@apply` with custom component classes or responsive variants in component SCSS files
- When using `@apply`, only use it with simple, non-responsive Tailwind utilities in global stylesheets
- For complex styles with responsive variants, use regular CSS with media queries instead of `@apply`
- Gradient syntax: `bg-linear-to-br` instead of `bg-gradient-to-br` (linear gradients)
- Use `outline-hidden` instead of `outline-none` for hiding outlines
- Use renamed utilities: `shadow-xs` (was `shadow-sm`), `shadow-sm` (was `shadow`), `rounded-sm` (was `rounded`)
- Incorporate 3D transform utilities like `rotate-x-*`, `rotate-y-*`, and `scale-z-*` for advanced visual effects
- Implement container queries with `@container`, `@max-*`, and `@min-*` utilities for adaptive layouts
- Use arbitrary values and properties with square bracket notation (e.g., `[mask-type:luminance]` or `top-[117px]`)
- Apply modifiers like `hover` or `lg` with arbitrary values for flexible styling
- Use the `not-*` variant for `:not()` pseudo-classes and the `starting` variant for `@starting-style`

## Components (HTML)
- Apply Tailwind utility classes directly in HTML for styling components
  - But prefer the `:host{}` instead of a wrapper div
  - For forms use css / utility classes.
- Use dynamic arbitrary values like `grid-cols-[1fr_500px_2fr]` for flexible layouts
- Implement data attribute variants like `data-current:opacity-100` for conditional styling
- Ensure accessibility by pairing Tailwind utilities with appropriate ARIA attributes
- Use `aria-hidden="true"` or `role="presentation"` when applying utilities like `hidden` or `sr-only`

## Components (TypeScript/JavaScript)
- Prefer TypeScript over JavaScript for component files to ensure type safety when applying Tailwind classes
- **NEVER** use template literals for dynamic class names (e.g., `` `p-${padding}` ``) - Tailwind cannot detect interpolated strings at build time
- Instead, use static lookup objects that map keys to complete class strings:
  ```typescript
  // ✅ CORRECT: Static class strings in lookup objects
  const paddingMap: Record<string, string> = {
    small: 'p-2',
    medium: 'p-4',
    large: 'p-8'
  };
  const colorMap: Record<string, string> = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    danger: 'bg-red-500'
  };

  // Compose classes from mapped values
  const classes = `${paddingMap[padding]} ${colorMap[color]}`;

  // ❌ WRONG: Template literal interpolation
  // const classes = `p-${padding} bg-${color}`; // Classes won't be detected!
  ```
- All Tailwind class names must appear as complete, static strings somewhere in your source code
- Use TypeScript union types to constrain valid keys: `padding: 'small' | 'medium' | 'large'`
- Integrate Tailwind with modern frameworks by applying utilities in component logic
- Favor functional components over class-based ones in frameworks like React

## Project-Wide Systems
- Leverage the Oxide engine's fast build times for performance optimization
- Avoid manual content configuration unless explicitly required
- Maintain consistency by using theme variables defined in CSS configuration files
- Reference theme variables in both utility classes and custom CSS (e.g., `text-[--color-primary]`)
- Update rules regularly to reflect Tailwind v4's evolving feature set
- Be aware of deprecated options from v3.x like `text-opacity`
