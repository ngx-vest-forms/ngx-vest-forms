# Context

## Glossary

- **App**: A runnable application in this repository. Apps live under `apps/`.
- **Colocated E2E App**: An end-to-end test project that owns its Nx project configuration and Playwright configuration within its own app folder.
- **Deployed Companion App**: A non-npm application artifact that is intentionally built and deployed as part of the product ecosystem.
- **Staged Release Tooling Migration**: A migration approach where workspace adoption of Nx lands first, while existing release automation is preserved until a later, dedicated release-tooling project.
- **Project-Level Build Targets**: A build setup where each project owns its own `build` target and can be built independently.
- **Aggregate Build Command**: A root-level command that orchestrates multiple project build targets for convenience, CI, or release workflows.
- **Project-Level Lint Targets**: A linting setup where each project owns its own `lint` target and can be linted independently.
- **Project-Level Test Targets**: A testing setup where each project owns its own `test` target and can be run independently.
- **Aggregate Test Command**: A root-level command that orchestrates multiple project test targets for convenience or CI.
- **Integrated Nx Workspace**: A workspace shape where each project owns its configuration and Nx commands are the canonical interface for project tasks.
- **Canonical Serve Target**: The single project-owned Nx serve target that acts as the default local development entrypoint.
- **Nx-First Convenience Scripts**: A small set of root `package.json` scripts that delegate to Nx for common workflows without making root scripts the source of truth.
- **Package**: Reusable code in this repository. Packages live under `packages/`.
- **Publishable-Only Packages**: A repository rule where `packages/` is reserved for externally publishable packages, not internal-only shared code.
- **Stable Import Path**: A package identity that remains unchanged for consumers during internal workspace migrations.
- **Published Angular Package**: A package that is built for external consumption using Angular package semantics rather than as a generic internal workspace-only library.
- **Examples App**: The runnable demo application used to showcase and exercise the library.
- **Examples E2E App**: The end-to-end test project that validates behavior of the Examples App.
- **Published Package**: A package intended to be versioned and published for external consumption.
