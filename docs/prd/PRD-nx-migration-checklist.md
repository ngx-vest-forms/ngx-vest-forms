# Nx Migration Implementation Checklist (Execution)

> Use this checklist in the migration PR/fork.
>
> **Policy:** Prefer the **Nx CLI** for setup, moves, config updates, and task execution wherever possible. Prefer **automatic Nx migrations/generators** over manual config editing.

## 0) Branch + safety prep

- [ ] Create a dedicated migration branch/fork.
- [ ] Confirm baseline branch target (per repo policy, default to `release/v3` unless maintainers redirect).
- [ ] Capture current green baseline (build/test/lint/e2e + release/deploy workflows).
- [ ] Document rollback strategy (single PR with phased commits; each phase independently revertable).

## 1) Nx-first foundation

- [ ] Initialize/normalize Nx integration using Nx CLI (no manual bootstrapping if CLI can do it).
- [ ] Ensure workspace is in **integrated** mode with per-project config model.
- [ ] Ensure `nx.json` is present and aligned with target defaults.
- [ ] Run Nx migration workflow for Nx packages if needed (generate + apply migrations via Nx tooling).
- [ ] Run Nx sync/repair flows where applicable before manual edits.
- [ ] Validate project discovery using Nx project inspection commands.

## 2) Target folder model (`apps/` + `packages/`)

- [ ] Move `projects/examples` → `apps/examples`.
- [ ] Move `projects/ngx-vest-forms` → `packages/ngx-vest-forms`.
- [ ] Move `e2e` → `apps/examples-e2e`.
- [ ] Update project roots/source roots using Nx project config patterns (prefer Nx-managed changes first).
- [ ] Keep `packages/` reserved for publishable packages only.

## 3) Project configuration (integrated Nx)

### `packages/ngx-vest-forms`

- [ ] Ensure project is configured as publishable Angular package.
- [ ] Ensure targets exist and run: `build`, `test`, `lint`.
- [ ] Verify output paths and package build config remain valid after move.

### `apps/examples`

- [ ] Ensure targets exist and run: `serve`, `build`, `test`, `lint`.
- [ ] Keep this as canonical local dev app.
- [ ] Ensure production build path is correct for deployment workflow.

### `apps/examples-e2e`

- [ ] Configure as first-class Nx Playwright project.
- [ ] Ensure targets exist and run: `e2e`, `lint`.
- [ ] Colocate Playwright configuration with this project.
- [ ] Ensure e2e target references the examples app target cleanly.

## 4) Import path + TS config stability

- [ ] Preserve stable import path: `'ngx-vest-forms'`.
- [ ] Update path mappings from `projects/ngx-vest-forms/...` to `packages/ngx-vest-forms/...`.
- [ ] Update all tsconfig references impacted by folder moves.
- [ ] Confirm examples app and tests import from `'ngx-vest-forms'` (no internal deep-path leakage).

## 5) Tailwind boundary

- [ ] Keep Tailwind active only for `apps/examples`.
- [ ] Verify no Tailwind scanning/styling drift into package or e2e project.
- [ ] Re-validate examples app styles post-move.

## 6) Nx-first scripts and workflows

- [ ] Refactor root scripts into a minimal convenience layer that delegates to Nx.
- [ ] Keep script set intentionally small (`start`, `build`, `test`, `lint`, `e2e`, CI helpers as needed).
- [ ] Ensure scripts do not bypass Nx orchestration.
- [ ] Update contributor docs to recommend Nx CLI directly for most workflows.

## 7) CI migration (Nx orchestrated)

- [ ] Update CI steps to call Nx-backed build/test/lint/e2e flows.
- [ ] Preserve behavior parity with current CI expectations.
- [ ] Keep examples app build in CI as a companion artifact.
- [ ] Ensure e2e job runs via `apps/examples-e2e` project target.

## 8) Release + deployment preservation

- [ ] Keep `semantic-release` unchanged for npm publishing in this PR.
- [ ] Keep branch/channel release behavior intact.
- [ ] Keep GitHub Pages deployment for examples app intact (path updates only).
- [ ] Explicitly defer `nx release` migration to separate issue/PRD.

## 9) Validation matrix (must pass)

- [ ] Package build succeeds from `packages/ngx-vest-forms` target.
- [ ] Examples serve succeeds from `apps/examples` target.
- [ ] Examples build succeeds for deployment.
- [ ] Vitest passes for package and examples app.
- [ ] Playwright e2e passes from `apps/examples-e2e`.
- [ ] Lint passes per project and aggregate.
- [ ] Stable import path `'ngx-vest-forms'` remains valid.
- [ ] Tailwind remains scoped to examples app only.
- [ ] semantic-release dry-run/validation still behaves as expected.
- [ ] GitHub Pages deployment workflow still resolves artifacts correctly.

## 10) PR completion checklist

- [ ] Add migration notes to docs (what moved, how to run via Nx CLI, script façade policy).
- [ ] Add short “Nx-first usage” section to README or contributor docs.
- [ ] Record known follow-up issue: evaluate `nx release` post-migration.
- [ ] Ensure no accidental dependency/version churn unrelated to migration.
- [ ] Final sanity run of all key Nx targets before merge.

---

## Fast rules for this migration

1. **Nx CLI first**: if Nx can do it, do it with Nx.
2. **Auto migrations first**: prefer generated migrations over hand-edited config.
3. **Manual edits only when necessary**: custom deployment/release/path edge cases.
4. **Keep behavior stable**: migration is structural, not product redesign.
5. **Defer release-tooling change**: `nx release` comes later in a dedicated effort.
