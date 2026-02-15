---
description: "Minimal Vitest guardrails; delegate detailed guidance to the vitest skill"
applyTo: "projects/**/*.{spec,test}.{ts,tsx,js,jsx}, tests/**/*.{spec,test}.{ts,tsx,js,jsx}"
---

# Vitest testing instructions (minimal)

Use the detailed skill at `.github/skills/vitest/SKILL.md` for full guidance.

Non-negotiables for this repository:

- Write tests in TypeScript and test user-visible behavior (not internals).
- Do not invent APIs or features that do not exist.
- Prefer fakes for app-owned services; mock hard boundaries only.
- For Angular async behavior, await `TestBed.inject(ApplicationRef).whenStable()` after triggering effects/signals.


