# Tailwind CSS v4 Migration Notes

## Issue Resolution: Angular CLI Auto-Detection Conflict

### Problem
Angular CLI v20.2.0+ has built-in Tailwind CSS auto-detection that conflicts with Tailwind CSS v4's new PostCSS plugin architecture.

**Error**: `"It looks like you're trying to use 'tailwindcss' directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package..."`

### Root Cause
1. Angular CLI detects `tailwind.config.ts` or `tailwindcss` in dependencies
2. Automatically tries to use core `tailwindcss` package as PostCSS plugin  
3. Tailwind CSS v4 moved PostCSS plugin to `@tailwindcss/postcss` package
4. Creates hard conflict between Angular CLI expectations and v4 architecture

### Solution
**Remove `tailwind.config.ts`** to prevent Angular CLI auto-detection:

```bash
# This fixes the build issue
rm tailwind.config.ts
```

### Working Configuration

#### PostCSS Config (`postcss.config.js`)
```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

#### Dependencies Setup
- `@tailwindcss/postcss`: PostCSS plugin for Angular CLI builds
- `@tailwindcss/vite`: Vite plugin for development server  
- `tailwindcss`: Core library (devDependency)

#### Tailwind Configuration
Use CSS-based configuration in `styles.scss`:

```css
@import 'tailwindcss';

@theme {
  --font-display: "Inter", sans-serif;
  --color-primary: oklch(0.5 0.2 250);
  /* Add custom design tokens here */
}
```

### Build Results
- ✅ **Vite development**: Works via `@tailwindcss/vite`
- ✅ **Angular CLI production**: Works via `@tailwindcss/postcss`
- ✅ **No auto-detection**: Angular CLI ignores project
- ⚠️ **Sass deprecation warning**: Non-breaking, will be resolved in future Tailwind updates

### Key Learnings
1. **Angular CLI auto-detection** can interfere with modern build tools
2. **Tailwind v4** prefers CSS-based configuration over JavaScript
3. **Removing config files** sometimes solves more problems than adding them
4. **Multiple build systems** (Vite + Angular CLI) require different plugin strategies

---
*Fixed: September 10, 2025*  
*Commit: [Link to commit after creation]*
