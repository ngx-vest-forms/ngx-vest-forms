---
description: "Minimal Vitest guardrails; delegate detailed guidance to the vitest skill"
applyTo: "projects/**/*.{spec,test}.{ts,tsx,js,jsx}, tests/**/*.{spec,test}.{ts,tsx,js,jsx}"
---

# Vitest testing instructions (minimal)

Use a dedicated Vitest skill if one is installed in the active agent client. This repository currently keeps only the minimal Vitest guardrails in this file.

Non-negotiables for this repository:

1. Language and scope: Write tests in TypeScript and test user-visible behavior rather than internal implementation details.
2. API accuracy: Do not invent APIs, helpers, or framework features that do not exist in this repository or in Vitest.
3. Test doubles: Use lightweight fake implementations for app-owned services, and mock only external APIs, browser or platform boundaries, or third-party dependencies.
4. Angular async stability: For Angular async behavior, await `TestBed.inject(ApplicationRef).whenStable()` after triggering effects or signals.


