---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

## Angular-Specific Adaptations

The fetched guidelines are framework-agnostic but examples may reference React patterns. When reviewing Angular code, apply the same principles with these adaptations:

- **Components**: Angular standalone components with `host` metadata, `:host` styling, and signals
- **Templates**: Angular template syntax (`@if`, `@for`, `@switch`, `@let`) — not JSX
- **Styling**: Tailwind v4 CSS-first config (`@theme`, `@utility`), component-scoped SCSS, or global styles
- **State**: Angular signals (`signal()`, `computed()`, `effect()`) — not React hooks
- **Routing**: Angular Router with `RouterOutlet` — not file-based routing
- **Forms**: Template-driven forms with `[ngModel]` (unidirectional) and Vest.js validation
- **Accessibility**: Follow `.github/instructions/a11y.instructions.md` for project-specific a11y requirements
- **Modern CSS baseline**: Container queries, oklch colors, native `<dialog>`, Popover API, View Transitions
