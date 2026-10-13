# Plan 003: Pin pullfrog workflow actions to commit SHAs and add a CI SHA-pin gate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d1818c64..HEAD -- .github/workflows/pullfrog.yml .github/workflows/ci.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d1818c64`, 2026-10-13
- **State**: DONE (adapted) — PR [#247](https://github.com/ngx-vest-forms/ngx-vest-forms/pull/247), commits `bde620d1` + `d9163803` + `a1a519e4`, 2026-10-13. `pullfrog.yml` was still tracked at the branch point, so the branch removes the workflow entirely instead of pinning its actions; the SHA-pin CI gate landed as planned, and `a1a519e4` extends it to `*.yaml` workflows so that extension cannot bypass the gate.

## Why this matters

The repo's own policy — CONTEXT.md: "**SHA-Pinned Workflow Actions**: A
workflow hardening rule that references GitHub Actions by immutable commit
SHA instead of mutable version tags" — is violated by exactly one workflow:
`.github/workflows/pullfrog.yml` uses the mutable tags
`actions/checkout@v6` (line 25) and `pullfrog/pullfrog@v0` (line 29). Every
other action in ci.yml, cd.yml, and prerelease.yml is pinned to a 40-hex SHA
with a `# vX.Y.Z` comment. Mutable tags can be moved by an upstream
compromise or a retag; this workflow also passes nine LLM provider API keys
into the job environment (ANTHROPIC, CLAUDE_CODE_OAUTH, OPENAI,
GOOGLE_GENERATIVE_AI, GEMINI, XAI, DEEPSEEK, MOONSHOT, OPENROUTER,
OPENCODE), which raises the stakes. Pinning makes the workflow immune to tag
moves; a CI gate stops future drift.

## Current state

- `.github/workflows/pullfrog.yml` (57 lines): header comment
  `# PULLFROG ACTION — DO NOT EDIT EXCEPT WHERE INDICATED`; trigger
  `workflow_dispatch` only; top-level `permissions: contents: read`; job
  permissions `id-token: write, contents: read`; two steps — Checkout
  (`uses: actions/checkout@v6`, `fetch-depth: 1`) and Run agent
  (`uses: pullfrog/pullfrog@v0`, `prompt` input, 9 provider-key env vars).
- Verified tag→SHA mappings (via `git ls-remote`, re-verified at plan time):
  - `actions/checkout` tag `v6` → commit
    `d23441a48e516b6c34aea4fa41551a30e30af803`
    (`git ls-remote https://github.com/actions/checkout.git refs/tags/v6`)
  - `pullfrog/pullfrog` tag `v0` → commit
    `ad4283a862b8377cb525a0f5bf30f17c023b18ea`
    (`git ls-remote https://github.com/pullfrog/pullfrog.git refs/tags/v0`)
- Style exemplar (ci.yml:23):
  `uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1`
- Verified at plan time: all 14 other `uses:` lines across ci.yml, cd.yml,
  prerelease.yml are 40-hex SHAs; only pullfrog.yml's two lines are not.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Re-verify tag→SHA | `git ls-remote https://github.com/actions/checkout.git refs/tags/v6` | `d23441a48e516b6c34aea4fa41551a30e30af803` |
| Re-verify tag→SHA | `git ls-remote https://github.com/pullfrog/pullfrog.git refs/tags/v0` | `ad4283a862b8377cb525a0f5bf30f17c023b18ea` |
| Gate dry run (local) | the two shell lines from step 3 | empty output, exit 0 |
| Format check | `pnpm exec prettier --check .github/workflows/pullfrog.yml .github/workflows/ci.yml` | exit 0 |
| Lint | `pnpm nx run-many --target=lint,lint-templates` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/pullfrog.yml` — exactly two lines (the two `uses:` refs)
- `.github/workflows/ci.yml` — add one gate step

**Out of scope** (do NOT touch, even though they look related):
- Everything else in pullfrog.yml — the header says
  `# PULLFROG ACTION — DO NOT EDIT EXCEPT WHERE INDICATED`; this plan
  authorizes exactly the two `uses:` lines, nothing else (no permission,
  env, input, or structural changes).
- The nine provider secrets themselves, the `workflow_dispatch` trigger, and
  the missing egress firewall (separate finding SEC-04, separate plan).
- cd.yml, prerelease.yml (already compliant).
- Other agents' in-flight work: at plan time, `form.directive.spec.ts`,
  `form-control-state.directive.spec.ts`,
  `form-model-group.directive.spec.ts`, and
  `packages/ngx-vest-forms/src/lib/testing/validation-config.spec.ts` had
  uncommitted modifications from another agent (replacing fixed `setTimeout`
  sleeps with `waitFor()`). None of them is in scope for you: do not touch,
  revert, stage, or commit them.

## Git workflow

- Branch: `advisor/003-pin-pullfrog-workflow-actions`
- Commit message style: conventional commits (see `git log`). Use:
  `chore(security): pin pullfrog workflow actions to commit SHAs`
  with a body noting the two tag→SHA mappings and that the edit is the
  minimal change required by the repo's SHA-pinning policy (CONTEXT.md).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Re-verify the tag→SHA mappings (tags can move)

```bash
git ls-remote https://github.com/actions/checkout.git refs/tags/v6
git ls-remote https://github.com/pullfrog/pullfrog.git refs/tags/v0
```

Expect exactly `d23441a48e516b6c34aea4fa41551a30e30af803` and
`ad4283a862b8377cb525a0f5bf30f17c023b18ea`. If either differs, STOP —
do not pin to an unverified SHA.

### Step 2: Pin the two actions

Edit `.github/workflows/pullfrog.yml`, changing exactly two lines:

- Line 25: `uses: actions/checkout@v6` →
  `uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6`
- Line 29: `uses: pullfrog/pullfrog@v0` →
  `uses: pullfrog/pullfrog@ad4283a862b8377cb525a0f5bf30f17c023b18ea # v0`

Match the ci.yml comment style (` # v6` / ` # v0` trailing comments), which
doubles as the "indicated" edit marker. Change nothing else in the file.

**Verify**: `grep -n "uses:" .github/workflows/pullfrog.yml` shows both
lines SHA-pinned with the trailing version comments, and the file is still
57 lines.

### Step 3: Add the CI SHA-pin gate

In `.github/workflows/ci.yml`, add one step immediately after the `Install`
step:

```yaml
      - name: Check workflow actions are SHA-pinned
        run: |
          unpinned=$(grep -nE '^[[:space:]]*uses:.*@' .github/workflows/*.yml | grep -vE '@[0-9a-f]{40}([[:space:]]|#|$)' || true)
          if [ -n "$unpinned" ]; then
            echo "::error::Workflow actions must be pinned to a 40-hex commit SHA (see CONTEXT.md: SHA-Pinned Workflow Actions):"
            echo "$unpinned"
            exit 1
          fi
```

The pattern matches any `uses:` ref with an `@` that is not a 40-hex SHA;
`docker://` and local `./` actions carry no `@ref` and pass. Verified at plan
time: before step 2 it flags exactly pullfrog.yml:25 and :29; after step 2
it is empty.

**Verify locally** by running the same two shell lines from the repo root:

```bash
unpinned=$(grep -nE '^[[:space:]]*uses:.*@' .github/workflows/*.yml | grep -vE '@[0-9a-f]{40}([[:space:]]|#|$)' || true)
if [ -n "$unpinned" ]; then echo "$unpinned"; exit 1; fi
```

→ expect empty output and exit 0.

### Step 4: Format, lint, commit

**Verify**: `pnpm exec prettier --check .github/workflows/pullfrog.yml .github/workflows/ci.yml`
→ exit 0 (run `pnpm exec prettier --write` on those two files first if it
fails — but see the STOP condition about reformatting). Then
`pnpm nx run-many --target=lint,lint-templates` → exit 0.

Commit both workflow files.

## Test plan

No unit tests. This workflow is `workflow_dispatch`-only, so runtime
verification in CI is impossible — verification is: (a) tag→SHA equivalence
re-checked via `git ls-remote`, (b) the gate snippet green locally, (c)
prettier and lint green. State this explicitly in your report.

## Done criteria

- [ ] `git ls-remote` confirms both SHAs match this plan (or you stopped)
- [ ] Gate snippet → empty output, exit 0
- [ ] `grep -n "uses:" .github/workflows/pullfrog.yml` shows both lines
      SHA-pinned with `# v6` / `# v0` trailing comments
- [ ] `pnpm exec prettier --check .github/workflows/pullfrog.yml .github/workflows/ci.yml` → exit 0
- [ ] `pnpm nx run-many --target=lint,lint-templates` → exit 0
- [ ] `git status --porcelain` shows only the two workflow files (plus the
      other agent's four dirty spec files — leave those untouched)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `git ls-remote` returns a different SHA than this plan states (a tag moved)
  → do not pin to an unverified SHA.
- The gate flags a `uses:` line you did not touch → another workflow drifted;
  report it, do not fix it here.
- `prettier --write` would reformat parts of pullfrog.yml beyond your two
  lines → revert and report; the file header forbids other edits, so keep
  the diff to exactly two lines (if the file was already unformatted at HEAD,
  make only your two lines prettier-clean and note it).

## Maintenance notes

- When adding a new workflow action, pin it to a 40-hex SHA with a
  `# vX.Y.Z` trailing comment; the CI gate enforces it.
- The gate checks pinning, not freshness — re-pin deliberately (the way
  Dependabot's `github-actions` updates do).
- Related but out of scope: the pullfrog job receives nine provider API keys
  and has no Socket Firewall egress restriction (finding SEC-04) — separate
  plan.
