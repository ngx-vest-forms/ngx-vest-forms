# Plan 002: Remediate critical/high dependency advisories and add a CI audit gate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d1818c64..HEAD -- pnpm-workspace.yaml pnpm-lock.yaml package.json .github/workflows/ci.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d1818c64`, 2026-10-13
- **State**: DONE — PR [#247](https://github.com/ngx-vest-forms/ngx-vest-forms/pull/247), commits `40c6309a` + `a1a519e4`, 2026-10-13. Adapted during execution: pnpm 11 renamed `ignoreCves` to `auditConfig.ignoreGhsas`; braces has no published fix (deferred with 2026-11-13 review date); probe-image-size pinned to 7.4.0 (the advisory's 7.3.1 does not exist on npm); qs 6.16.0 added; `@actions/http-client>undici` scoped to 6.28.1 to avoid forcing a 6.x→7.x major. Review fix `a1a519e4` adds scoped `'jsdom>undici': 8.11.2` — the global 7.29.1 override had downgraded jsdom's declared `^8.11.2` range. `pnpm why undici` now resolves three lines: 6.28.1 (`@actions/http-client`), 7.29.1 (nx, semantic-release, vitest), 8.11.2 (jsdom).

## Why this matters

`pnpm audit` at plan time reports **31 advisories: 2 critical and 14 high**
(plus 11 moderate, 4 low), all in the dev/release toolchain:

- **critical**: handlebars `<4.7.10` (JavaScript injection) reached via
  `semantic-release@25.0.9` → `conventional-changelog-writer@8.4.0`;
  undici (TLS-bypass/DoS) reached via `@actions/http-client` →
  `@semantic-release/npm`.
- **high**: undici, `fast-uri` (×4, via `ajv` → `@angular-devkit`),
  `js-yaml`, `brace-expansion` (×2), `braces`, `probe-image-size`,
  `source-map-js`.

The production graph is clean — `pnpm audit --prod` reports "No known
vulnerabilities found" (the published library depends only on `tslib`). But
nothing in CI stops a vulnerable lockfile from merging: there is no audit
step. The repo already has strong supply-chain settings
(`minimumReleaseAge: 1440`, `trustPolicy: no-downgrade`, `strictDepBuilds`,
Socket Firewall install in CI, SHA-pinned actions); this plan closes the
advisory gap and turns it into a gate.

## Current state

- `pnpm-workspace.yaml` (23 lines): `minimumReleaseAge: 1440`,
  `minimumReleaseAgeStrict: true`, `minimumReleaseAgeIgnoreMissingTime: false`,
  `trustPolicy: no-downgrade`, an `overrides:` block with 4 exact pins:
  ```yaml
  overrides:
    '@jridgewell/sourcemap-codec': 1.6.0
    chokidar: 4.0.1
    detect-port: 1.6.0
    semver: 7.7.1
  ```
  plus `strictDepBuilds: true` and an `allowBuilds` allowlist.
- `.github/workflows/ci.yml`: steps Checkout (SHA-pinned) → Setup → Enable
  Corepack → Set up Socket Firewall → **Install**
  (`sfw pnpm install --frozen-lockfile`) → Playwright setup → Lint → Build
  library → Test → Browser tests → E2E tests → Build examples app. No audit
  step.
- Release tooling lives in root `package.json` devDependencies
  (`semantic-release`, `@semantic-release/npm`, `@semantic-release/git`,
  `conventional-changelog-writer`, `handlebars` — check exact declared ranges
  there before updating anything).
- Verified at plan time: `pnpm audit` → 31 advisories (2 critical, 14 high,
  11 moderate, 4 low); `pnpm audit --prod` → "No known vulnerabilities found".

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Baseline audit | `pnpm audit --audit-level=high` | exit 1 at plan time (2 critical + 14 high); exit 0 when done |
| Prod-graph audit | `pnpm audit --prod` | "No known vulnerabilities found" (before AND after) |
| Advisory metadata | `pnpm audit --json` | JSON with advisory details incl. patched versions |
| Apply changes | `pnpm install` | exit 0; updates `pnpm-lock.yaml` |
| Frozen-lockfile check (CI parity) | `pnpm install --frozen-lockfile` | exit 0 |
| Lint | `pnpm nx run-many --target=lint,lint-templates` | exit 0 |
| Library build | `pnpm nx run ngx-vest-forms:build --configuration=production` | exit 0 |
| Full test suite | `pnpm nx run ngx-vest-forms:test` | exit 0, no failures (baseline at plan time: 48 files, 679 passed + 2 todo) |
| Examples build | `pnpm nx run examples:build --configuration=production --base-href=/ngx-vest-forms/` | exit 0 |
| Format check | `pnpm exec prettier --check .github/workflows/ci.yml pnpm-workspace.yaml` | exit 0 |

**Forbidden**: `pnpm audit fix --force` (forced remediation can cross
declared dependency ranges — never run it). Do not upgrade unrelated
packages.

## Scope

**In scope** (the only files you should modify):
- `pnpm-workspace.yaml` — append patched versions to the `overrides:` block
- `pnpm-lock.yaml` — regenerated by `pnpm install`
- root `package.json` — only if you bump a direct dependency's declared range
  (keep the diff minimal)
- `.github/workflows/ci.yml` — add one audit-gate step

**Out of scope** (do NOT touch):
- `packages/ngx-vest-forms/package.json` — the published library's dependency
  graph is clean (`pnpm audit --prod` passes); leave it alone.
- The `allowBuilds` list in `pnpm-workspace.yaml` — adding entries is a
  supply-chain decision; STOP and report instead.
- Any dependency not flagged by the audit.
- Other agents' in-flight work: at plan time, `form.directive.spec.ts`,
  `form-control-state.directive.spec.ts`,
  `form-model-group.directive.spec.ts`, and
  `packages/ngx-vest-forms/src/lib/testing/validation-config.spec.ts` had
  uncommitted modifications from another agent (replacing fixed `setTimeout`
  sleeps with `waitFor()`). None of them is in scope for you: do not touch,
  revert, stage, or commit them.

## Git workflow

- Branch: `advisor/002-remediate-critical-dep-advisories`
- Commit message style: conventional commits (see `git log`). Use:
  `chore(security): remediate critical and high dependency advisories`
  with a body listing: what was updated/overridden, the before/after audit
  counts, and a one-line deferral reason + review date for every moderate/low
  advisory left unaddressed.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Capture the baseline

```bash
pnpm audit --audit-level=high
```

Expect exit 1 with 2 critical + 14 high advisories. Save the list — you will
compare after the fix.

### Step 2: Determine patched versions (do not guess)

For each critical/high advisory, get the patched version from
`pnpm audit --json` (advisory entries carry the patched-version range) or
from the advisory URL printed by `pnpm audit`. Write the list down:
package → patched version.

### Step 3: Apply surgical overrides

Append the patched versions for the critical/high set to the `overrides:`
block in `pnpm-workspace.yaml`, keeping the existing 4 entries and the
file's 2-space indentation. Quote keys containing `/` or `@`, exactly like
the existing `'@jridgewell/sourcemap-codec': 1.6.0` entry. Start with:
handlebars, undici, fast-uri, js-yaml, braces, brace-expansion,
probe-image-size, source-map-js. Add `qs` only if the audit flags it as
high (at plan time it was moderate).

### Step 4: Install and verify lockfile sync

```bash
pnpm install
pnpm install --frozen-lockfile
```

Both must exit 0. The second is what CI runs — the committed lockfile must be
in sync.

### Step 5: Re-audit

```bash
pnpm audit --audit-level=high   # expect exit 0 — no critical/high
pnpm audit --prod               # expect "No known vulnerabilities found"
```

Moderate/low advisories may remain. For each, record a one-line deferral
reason + review date in the commit message body (e.g. "moderate X deferred:
not reachable in CI/release paths; review 2027-01").

### Step 6: Prefer in-range updates for direct dependencies (optional cleanup)

If a flagged package is a DIRECT dependency (check root `package.json`) and an
in-range `pnpm update <pkg>` clears its advisory without an override, prefer
that and drop the corresponding override — it keeps `package.json` honest.
Overrides remain the tool for transitive-only packages. Keep the overall
diff minimal; do not let `pnpm update` without package arguments rewrite
unrelated lockfile entries.

### Step 7: Add the CI audit gate

In `.github/workflows/ci.yml`, add one step immediately after the `Install`
step:

```yaml
      - name: Audit dependencies
        run: pnpm audit --audit-level=high
```

`pnpm audit` exits non-zero when advisories at or above the given level
exist, so this fails the build on any critical/high. Note:
`minimumReleaseAge: 1440` in `pnpm-workspace.yaml` already guarantees patched
versions are at least 24h old, and CI installs through Socket Firewall.

### Step 8: Run the full gates

Lint, library build, full test suite, examples build (commands in the table
above). If you changed any runtime-reachable package (none expected — all
flagged packages are dev/release tooling), the full suite covers it.

## Test plan

No unit tests — dependency/CI change. Verification is the audit commands plus
the full gates (lint, lib build, full test suite, examples build).

## Done criteria

- [ ] `pnpm audit --audit-level=high` → exit 0 (was exit 1: 2 critical + 14
      high at plan time)
- [ ] `pnpm audit --prod` → "No known vulnerabilities found"
- [ ] `pnpm install --frozen-lockfile` → exit 0
- [ ] `pnpm nx run-many --target=lint,lint-templates` → exit 0
- [ ] `pnpm nx run ngx-vest-forms:build --configuration=production` → exit 0
- [ ] `pnpm nx run ngx-vest-forms:test` → exit 0, no failures
- [ ] `pnpm nx run examples:build --configuration=production --base-href=/ngx-vest-forms/` → exit 0
- [ ] `pnpm exec prettier --check .github/workflows/ci.yml pnpm-workspace.yaml` → exit 0
- [ ] `git status --porcelain` shows only in-scope files (plus the other
      agent's four dirty spec files — leave those untouched)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- **undici escape hatch**: `@actions/http-client` (dependency of
  `@semantic-release/npm`) may declare `undici` `^6`; forcing 7.x can break
  the release publish. If install/build/test failures trace to the undici
  override, revert just that override and instead try an in-range
  `pnpm update @semantic-release/npm`. If that does not clear the advisory,
  defer undici with a documented reason + review date and say so in your
  report. Never use `--force`.
- An override or update breaks the library build, examples build, or test
  suite in a way you cannot fix by choosing a different patched version →
  revert that change, document the deferral, report.
- `pnpm install` wants to run build scripts for packages not in the
  `allowBuilds` list → STOP and report; do not extend `allowBuilds` yourself.
- The audit still reports a critical/high you cannot clear without crossing
  a declared range → STOP and report which one and why.
- Two packages require conflicting versions of the same transitive dep →
  prefer the override clearing the most advisories; if still conflicting,
  STOP and report.

## Maintenance notes

- The CI gate uses `--audit-level=high`: moderate/low advisories stay visible
  in the log but don't fail the build; triage them at release time.
- pnpm `overrides` apply workspace-wide. For future advisories: first try an
  in-range `pnpm update <pkg>`, then an override.
- `minimumReleaseAge: 1440` means any newly published patch is at least 24h
  old before it can enter the lockfile — keep it.
- This plan intentionally does not touch the published library's dependency
  graph (it is clean).
