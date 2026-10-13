# pnpm-first workspace hardening

We are migrating this Nx workspace to a **Pnpm-First Workspace** on pnpm 11 while keeping the current CI and release topology intact. The workspace will use a **Corepack-Pinned Package Manager**, a **Versioned Supply-Chain Policy**, a **Reviewed Build Allow-List**, frozen-lockfile installs, a **Dependency Cache Embargo** for package-manager caches, **Soft Package Manager Enforcement**, **Consumer-Neutral Install Docs**, and **SHA-Pinned Workflow Actions** so the package-manager migration improves supply-chain posture without turning into a broader workflow redesign.

## Terms

- **Pnpm-First Workspace**: pnpm is the canonical package manager for local development, CI, and release automation.
- **Corepack-Pinned Package Manager**: the exact pnpm version is pinned in `package.json` and activated through Corepack.
- **Versioned Supply-Chain Policy**: install-hardening rules committed in the repository's package-manager config instead of machine-local defaults.
- **Reviewed Build Allow-List**: the explicit list of dependencies allowed to run install or build scripts.
- **Dependency Cache Embargo**: workflows disable package-manager dependency caches to reduce cache-poisoning risk.
- **Soft Package Manager Enforcement**: pnpm is enforced through pinned tooling, documentation, and CI checks, not install-time guard scripts.
- **Consumer-Neutral Install Docs**: public install guidance does not tie consumers to the repository's own package manager.
- **SHA-Pinned Workflow Actions**: GitHub Actions are referenced by commit SHA, not by mutable version tag.
- **Zero-Exception Cooldown Policy**: the release-age and trust policy starts with no exceptions and adds one only when a concrete blocker appears.
- **Narrow Trust Exception**: a trust-policy exclusion scoped to one package version, added after a real install blocker is confirmed.
