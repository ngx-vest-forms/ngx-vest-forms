# PRD: Nx workspace migration — integrated workspace, `apps/` + `packages/`, Nx-first workflows

> **Status: Draft (2026-05-14).**
>
> Migrate the repository from its current Angular CLI-style `projects/` layout to a fully integrated Nx workspace with `apps/` and `packages/`, while preserving current product behavior, keeping `semantic-release` in place for now, and continuing to deploy the examples app to GitHub Pages.

## Problem Statement

The repository currently behaves like a multi-project workspace, but its physical layout and tooling contract are still split between Angular CLI-era conventions and custom root scripts:

- Reusable code and runnable applications currently live under `projects/`, which does not reflect the desired long-term repository model.
- End-to-end tests live in a root `e2e/` folder instead of as a first-class project.
- Root scripts and CI flows still expose underlying tools directly in several places rather than consistently treating Nx as the orchestration layer.
- The examples app is both a development surface and a deployed companion artifact, but that role is not modeled as cleanly as it could be in the workspace structure.
- The main library is a published Angular package, but the current workspace shape does not clearly separate publishable packages from runnable applications.

This creates unnecessary maintenance overhead, makes future Nx adoption partial instead of idiomatic, and increases the likelihood of configuration drift between local workflows, CI, and future automation.

## Goals

1. Migrate to a **fully integrated Nx workspace** with per-project `project.json` files.
2. Adopt the top-level folder model:
   - `apps/examples`
   - `apps/examples-e2e`
   - `packages/ngx-vest-forms`
3. Preserve the public package identity and import path of `ngx-vest-forms`.
4. Keep `packages/` reserved for **publishable packages only** during this migration.
5. Make Nx the canonical orchestration layer for build, test, lint, serve, and e2e.
6. Keep a **small set of root convenience scripts** that delegate to Nx.
7. Keep the examples app as a **deployed companion app** that is built in CI and deployed to GitHub Pages.
8. Keep `semantic-release` for npm publishing during this migration.
9. Defer any migration to `nx release` to a later, dedicated issue/PRD.
10. Prefer the **Nx CLI and automatic migrations** wherever possible instead of hand-editing workspace configuration.

## Non-Goals

- Migrating from `semantic-release` to `nx release` in the same project.
- Changing the published package name or import path.
- Turning `packages/` into a mixed home for publishable packages and internal-only shared libraries.
- Replacing Vitest with another unit test runner.
- Replacing Playwright with another e2e framework.
- Reworking the GitHub Pages deployment model beyond the path/config updates required by the folder move.
- Introducing new publishable packages as part of this migration.

## User Stories

1. As a maintainer, I want the repository to use `apps/` and `packages/`, so project roles are immediately obvious.
2. As a maintainer, I want Nx to be the primary interface for build, test, lint, serve, and e2e, so local development and CI use the same orchestration model.
3. As a maintainer, I want the examples app to live in `apps/examples`, so the deployed demo and the local dev surface are clearly modeled as an app.
4. As a maintainer, I want the Playwright suite to live in `apps/examples-e2e`, so e2e verification is a first-class Nx project.
5. As a maintainer, I want `packages/ngx-vest-forms` to remain a publishable Angular package, so package consumers see no behavioral contract change.
6. As a maintainer, I want the import path `'ngx-vest-forms'` to remain stable, so examples, tests, and downstream consumers are unaffected by the folder move.
7. As a maintainer, I want Vitest targets owned by each project, so Nx can run them selectively and cache them correctly.
8. As a maintainer, I want lint targets owned by each project, so project hygiene scales with the integrated workspace.
9. As a maintainer, I want build targets owned by each project, so the package build and examples app build remain distinct concerns.
10. As a maintainer, I want the canonical dev entrypoint to be the examples app serve target, so local dev, Tailwind, and e2e all point at the same app.
11. As a maintainer, I want a few root scripts to remain for convenience, so contributor ergonomics stay good while Nx remains the source of truth.
12. As a maintainer, I want GitHub Pages deployment for the examples app to remain intact, so public documentation/demo hosting continues uninterrupted.
13. As a maintainer, I want npm publishing to remain on `semantic-release` for now, so the Nx migration does not also become a release-tooling migration.
14. As a maintainer, I want to use the Nx CLI and automatic migrations as much as possible, so the migration benefits from supported tooling instead of bespoke configuration edits.

## Solution

Migrate the repository to a fully integrated Nx workspace with these long-term boundaries:

- **`apps/examples`** is the Angular examples application.
- **`apps/examples-e2e`** is the colocated Nx Playwright project for the examples app.
- **`packages/ngx-vest-forms`** is the publishable Angular package.

Nx becomes the canonical execution layer for workspace tasks. Root `package.json` scripts remain only as a curated convenience facade over Nx.

The migration should explicitly prefer Nx-supported workflows for transformation and maintenance:

- use the Nx CLI to initialize and shape the workspace
- use Nx migrations to update Nx-managed configuration
- use Nx generators/executors where they fit the target state
- use Nx synchronization/repair flows where appropriate
- only hand-edit project/workspace files when Nx tooling cannot express the desired repository outcome

## Implementation Decisions

### Workspace Shape

Target structure:

- `apps/examples`
- `apps/examples-e2e`
- `packages/ngx-vest-forms`

The repository should be a **fully integrated Nx workspace**, not a partial or package-based Nx adoption.

### Package Boundary

`packages/` is reserved for **publishable packages only** in this migration. Internal-only shared code should remain inside an owning app or package until a separate extraction decision is justified.

### Published Package Behavior

`packages/ngx-vest-forms` remains a **published Angular package**. The migration must preserve:

- the package name
- the public import path `'ngx-vest-forms'`
- Angular package semantics
- the existing public API expectations

### Examples App

`apps/examples` remains:

- the canonical local development app
- the Tailwind-enabled application
- a CI-built artifact
- the GitHub Pages deployment source

### E2E Project

`apps/examples-e2e` becomes a **colocated Nx Playwright project** with its own project configuration and Playwright configuration. It is a verification project, not a shipped artifact.

### Nx-First Execution Model

All core workflows should be modeled as project-owned Nx targets.

At minimum:

- `packages/ngx-vest-forms`
  - `build`
  - `test`
  - `lint`
- `apps/examples`
  - `serve`
  - `build`
  - `test`
  - `lint`
- `apps/examples-e2e`
  - `e2e`
  - `lint`

### Root Scripts

Keep a small set of root scripts, but make them wrappers around Nx rather than parallel sources of truth.

The intended rule is:

- **prefer using the Nx CLI directly whenever possible**
- keep root scripts only for the most common happy-path workflows
- ensure those scripts invoke Nx rather than bypassing it

### Nx CLI First Policy

This migration should explicitly prefer the Nx CLI as much as possible.

That means:

- prefer Nx-supported migration commands over manual workspace bootstrapping
- prefer Nx generators over manual project scaffolding when the output matches the desired target state
- prefer Nx-managed config updates over ad hoc editing when a supported migration path exists
- prefer Nx task execution in CI and local docs/examples
- prefer Nx inspection commands to understand the resulting workspace

This PRD intentionally biases toward **supported Nx pathways first** and manual edits second.

### Automatic Migrations Policy

Automatic migrations should be used wherever they are a good fit.

Specifically:

- use Nx initialization/migration flows to establish the workspace foundation
- use Nx migrations for Nx package updates and generated config changes
- use Nx synchronization/repair flows when the workspace needs Nx-managed cleanup
- do not rewrite generated Nx configuration by hand just because manual edits feel faster in the moment

Manual edits remain acceptable for:

- repository-specific path updates after folder moves
- GitHub Pages deployment wiring
- semantic-release integration preservation
- custom cleanup that Nx cannot model directly

### Release Tooling

Keep `semantic-release` in place for npm publishing during this migration.

Create a **separate future issue/PRD** for evaluating migration to `nx release` after the Nx workspace migration has landed and stabilized.

### Deployment

Keep the examples app deployment to GitHub Pages as a separate deployment concern from npm package publishing.

## Delivery Plan

### Phase 1 — Workspace foundation

- establish the integrated Nx workspace foundation
- add/normalize `nx.json`
- move toward per-project `project.json`
- align root scripts and CI expectations around Nx as the orchestrator

### Phase 2 — App and package moves

- move `projects/examples` to `apps/examples`
- move `projects/ngx-vest-forms` to `packages/ngx-vest-forms`
- update project configuration and TS path references

### Phase 3 — E2E project migration

- move root `e2e/` into `apps/examples-e2e`
- colocate Playwright configuration with the e2e project
- wire the e2e project to the examples app via Nx targets

### Phase 4 — Workflow migration

- convert build/test/lint/serve/e2e flows to Nx-first targets
- keep a minimal root-script facade
- update CI workflows to call Nx-backed commands

### Phase 5 — Release/deploy preservation

- verify `semantic-release` still publishes the package correctly
- verify GitHub Pages deployment still builds and deploys the examples app correctly
- explicitly defer `nx release` work

## Testing Decisions

A good migration validates externally observable repository behavior, not just file movement.

### Validation matrix

- **Package build**: `packages/ngx-vest-forms` builds successfully as a publishable Angular package.
- **App serve**: `apps/examples` serves correctly as the canonical local dev app.
- **App build**: `apps/examples` builds successfully for CI and GitHub Pages deployment.
- **Vitest**: unit/integration tests run correctly for both the package and the examples app.
- **Playwright**: e2e tests run from `apps/examples-e2e` against the examples app.
- **Lint**: project-level lint targets work independently and in aggregate.
- **Tailwind scope**: Tailwind remains active only for `apps/examples`.
- **Import stability**: examples and tests continue to consume `'ngx-vest-forms'` rather than internal paths.
- **Release continuity**: `semantic-release` remains functional for the package.
- **Deployment continuity**: the examples app remains deployable to GitHub Pages.

## Risks

1. **TS path drift** — existing path mappings currently point at `projects/ngx-vest-forms`; these must be updated carefully.
2. **Playwright relocation drift** — moving e2e into a colocated Nx project may break test discovery, server wiring, or CI assumptions if done partially.
3. **Tailwind overreach** — the examples app is currently the only Tailwind consumer and that boundary must remain explicit.
4. **Package contract drift** — the published Angular package must not accidentally become a workspace-only library during migration.
5. **Release workflow regressions** — release workflows currently depend on semantic-release branch/channel behavior and must continue to work.
6. **Script duplication** — keeping too many root wrappers would dilute the Nx-first model and create parallel workflow contracts.

## Out of Scope

- Migrating npm publishing from `semantic-release` to `nx release`
- Introducing internal-only shared packages under `packages/`
- Renaming the `ngx-vest-forms` package or changing its import path
- Replacing GitHub Pages with a new deployment platform
- Replacing Vitest or Playwright
- Broader repo architecture changes unrelated to the Nx migration

## Success Criteria

The migration is complete when all of the following are true:

1. The workspace uses `apps/` and `packages/` with integrated Nx project configuration.
2. The examples app lives at `apps/examples`.
3. The e2e project lives at `apps/examples-e2e`.
4. The published library lives at `packages/ngx-vest-forms`.
5. Nx is the canonical interface for project orchestration.
6. Root scripts are a minimal convenience layer over Nx.
7. The examples app is still built in CI and deployable to GitHub Pages.
8. `semantic-release` still handles npm publishing.
9. A future `nx release` migration is explicitly deferred to its own issue/PRD.
10. The migration uses Nx CLI workflows and automatic migrations wherever they are a fit, rather than defaulting to manual config work.

## Further Notes

- Nx documentation recommends starting adoption via the Nx CLI rather than manually reproducing workspace setup by hand.
- Nx documentation also provides migrations and integrated-workspace guidance that should be preferred over bespoke repository reshaping wherever possible.
- This PRD intentionally separates **workspace migration risk** from **release-tooling migration risk**.
- A follow-up issue/PRD should evaluate `nx release` only after the Nx migration lands and stabilizes.
