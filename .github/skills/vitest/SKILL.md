---
name: vitest
description: Vitest testing guidance for unit and component tests with modern mocking, assertions, and configuration. Use when writing or refactoring Vitest tests, setting up test config, improving reliability/coverage, or debugging flaky tests in TypeScript and Angular projects (including ngx-vest-forms patterns).
---

# Vitest Testing Guidance

Apply this skill when creating or updating tests so they remain deterministic, maintainable, and user-focused.

## Core Principles

1. Prefer behavior-focused tests over implementation details.
2. Use TypeScript for all tests.
3. Keep tests isolated; avoid shared mutable state.
4. Prefer fakes for app-owned services; mock only hard boundaries.
5. Use async-safe assertions (`await expect(...).resolves/rejects`, `expect.poll`).
6. Use accessible, user-facing queries for component tests.

## Workspace-Specific Rules (Angular + ngx-vest-forms)

- Use Angular Testing Library `render()` for component tests.
- Prefer role/label/text queries before `data-testid`.
- Always await `TestBed.inject(ApplicationRef).whenStable()` after async effects/signals.
- For ngx-vest-forms tests, validate user-visible outcomes (errors, validity state, accessibility attrs), not directive internals.
- Start complex work with `test.todo()`/`test.fixme()` and then iterate.
- Do not invent tests for APIs/features that do not exist.

## Authoring Checklist

- Structure tests with Arrange-Act-Assert.
- Group by behavior using `describe`.
- Keep assertions meaningful and explicit.
- Assert error/loading paths, not only happy paths.
- For concurrent tests/suites, use scoped context `expect` where needed.
- Prefer `expect.element(...)` style assertions in browser/component tests.

## Mocking Guidelines (Vitest Best Practices)

- Prefer module mocks with dynamic import form for type-safe transformations:
  - `vi.mock(import('./module'), () => ({ ... }))`
- Use partial mocks when needed:
  - `vi.mock(import('./module'), async (importOriginal) => ({ ...(await importOriginal()), overridden: vi.fn() }))`
- Use `vi.mocked()` for typed mocked values.
- Use MSW for API/network boundaries in UI/component/integration-like tests.
- Prefer `clearMocks: true` and `restoreMocks: true` in config to reduce test pollution.

## Async and Reliability

- Use `await expect(Promise.resolve(...)).resolves...` / `rejects...`.
- Use `expect.poll()` for eventually consistent state.
- Use `expect.assertions()` / `expect.hasAssertions()` when callbacks or async branches could silently skip assertions.

## Suggested Config Baseline

Use these defaults unless project constraints require otherwise:

- `clearMocks: true`
- `restoreMocks: true`
- `coverage` enabled in CI runs
- Browser mode enabled only where DOM/browser behavior needs verification

## Execution Flow

1. Understand feature intent and existing test patterns.
2. Add/adjust tests for visible behavior first.
3. Add edge/error/loading cases.
4. Run focused tests, then broader suite.
5. Refine flaky sections (async waits, shared state, over-mocking).

## References

- [Core Config](references/core-config.md)
- [Test API](references/core-test-api.md)
- [Expect API](references/core-expect.md)
- [Mocking](references/features-mocking.md)
- [Coverage](references/features-coverage.md)
- [Concurrency](references/features-concurrency.md)
