# Plan 001: Remove committed Context7 credential, gitignore it, and add a CI secret-scan gate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d1818c64..HEAD -- context7.json .gitignore .github/workflows/ci.yml AGENTS.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.
>
> **Never reproduce the credential value.** This plan refers to it only as
> "the key at `context7.json:3`" (credential type: Context7 API key,
> `pk_`-prefixed). Do not print, copy, quote, or commit the value anywhere —
> not in files, commit messages, PR bodies, or reports.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d1818c64`, 2026-10-13
- **State**: DONE, then CORRECTED — PR [#247](https://github.com/ngx-vest-forms/ngx-vest-forms/pull/247), commits `f5f81306` + `4e1ee1aa` + `a1a519e4`, 2026-10-13.

  > **Correction (2026-10-13):** this plan misclassified the `pk_` value in `context7.json` as a
  > secret credential. It is a public-by-design library-claim key: Context7's docs instruct
  > owners to commit `context7.json` to the default branch
  > (https://context7.com/docs/howto/claiming-libraries), and other public repos commit the
  > identical file. Context7's actual secret is the `ctx7sk-` API key, which was never in this
  > repo. No secret was exposed — no rotation, no history purge. `4e1ee1aa` restores the file,
  > un-ignores it, and rescopes the secret scan to `ctx7sk-` (dropping the false-positive `pk_`
  > pattern). The rest of this plan's premise below is superseded; kept for the record.
  >
  > **Review fixes (2026-10-13, `a1a519e4`):** the secret scan was rewritten from
  > `git ls-files | xargs grep -nE` to `git grep -lE` with pathspec exclusions —
  > fixes a scan bypass on tracked filenames containing whitespace, stops hiding
  > grep failures behind `|| true`, and reports filenames only (full matching
  > lines, which include the credential, are no longer echoed into CI logs).
  > The `sk-` body also accepts hyphens. Verified: clean tree passes; planted
  > `ghp_`/`ctx7sk-`/`sk-` tokens fail the step listing filenames only.

## Why this matters

`context7.json` is tracked in git and contains a Context7 API key at line 3
(the `public_key` field, a `pk_`-prefixed credential). The repository is
public, so the key must be treated as compromised: anyone can read it and
use it. Deleting the file stops it from being committed again, gitignoring
`.env*`/`context7.json` prevents the whole class of mistake, and a CI
secret-scan gate fails the build if a credential-shaped string is ever
committed again. Key rotation and git-history purge are maintainer actions
(step 0) that this plan deliberately does not perform.

## Current state

- `context7.json` (repo root, 4 lines, tracked; added in commit `dd07940d`):
  a JSON object with `url` and a `public_key` field at **line 3** holding the
  `pk_`-prefixed Context7 API key. (Value intentionally not reproduced here.)
- `.gitignore` (85 lines): no entries for `.env*`, `context7.json`, or
  secrets in general.
- `.github/workflows/ci.yml`: no secret-scan step. Actions are SHA-pinned
  and install goes through Socket Firewall (`sfw pnpm install --frozen-lockfile`).
- `.github/agents/*.agent.md` (healer/planner/generator) reference `context7/*`
  MCP tools — they do not contain the key; leave them unchanged.
- Repo hardening posture (CONTEXT.md): "In-Place Workflow Hardening",
  "SHA-Pinned Workflow Actions", Socket Firewall in CI. A committed
  credential contradicts all of it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Delete tracked file | `git rm context7.json` | exit 0; `git ls-files \| grep context7.json` → empty |
| Ignore-rule check | `git check-ignore -v context7.json .env .env.local` | all three listed with the new rules |
| Example stays committable | `git check-ignore .env.example` | exit 1 (not ignored) |
| Secret scan (local dry run of the CI step) | the two shell lines from step 3 | empty output, exit 0 |
| Format check | `pnpm exec prettier --check .github/workflows/ci.yml AGENTS.md` | exit 0 (run `--write` first if it fails) |
| Lint | `pnpm nx run-many --target=lint,lint-templates` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `context7.json` — delete
- `.gitignore` — append a secrets section
- `.github/workflows/ci.yml` — add one gate step
- `AGENTS.md` — append a short "Secrets and local tooling" section

**Out of scope** (do NOT touch):
- Git history rewrite (`git filter-repo`, BFG) — maintainer-only, see step 0.
- The key rotation itself — maintainer-only, see step 0.
- `.github/agents/*.agent.md` — they reference the MCP tools, not the key.
- Any workflow other than ci.yml (pullfrog.yml is a separate plan).
- Other agents' in-flight work: at plan time, `form.directive.spec.ts`,
  `form-control-state.directive.spec.ts`,
  `form-model-group.directive.spec.ts`, and
  `packages/ngx-vest-forms/src/lib/testing/validation-config.spec.ts` had
  uncommitted modifications from another agent (replacing fixed `setTimeout`
  sleeps with `waitFor()`). None of them is in scope for you: do not touch,
  revert, stage, or commit them. They will show up in `git status` — that is
  expected.

## Git workflow

- Branch: `advisor/001-remove-committed-context7-credential`
- Commit message style: conventional commits (see `git log`), e.g.
  `docs(agents): correct stale facts and remove dated prompt text (#229)`.
  Use: `chore(security): remove committed Context7 credential and add secret-scan gate`
  with a body noting: the key is treated as compromised; rotation and history
  purge (`git filter-repo`) are required maintainer follow-ups. Do NOT include
  the key value in the message.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 0: Maintainer actions (NOT yours — read, then proceed)

Before anything else, the **maintainer** must rotate the Context7 API key in
the Context7 dashboard — the value in git history is public and compromised.
After rotation, the maintainer should purge it from history with
`git filter-repo` (or BFG). This plan does NOT execute either action
(blast radius: rotation is an external account action; history rewrite
rewrites published history). Proceed with steps 1–5 regardless, and state in
your final report that rotation + purge remain open maintainer actions.

### Step 1: Delete the credential file

```bash
git rm context7.json
```

**Verify**: `git ls-files | grep context7.json` → no output;
`git status --porcelain` shows `D  context7.json`.

### Step 2: Gitignore the credential class

Append this section at the end of `.gitignore` (keep everything else
untouched):

```
# Secrets — never commit credentials or local tool configs that contain keys
.env
.env.*
!.env.example
context7.json
```

**Verify**: `git check-ignore -v context7.json .env .env.local` lists all
three with the new rules; `git check-ignore .env.example` exits 1 (not
ignored), so an example file can still be committed.

### Step 3: Add the CI secret-scan gate

In `.github/workflows/ci.yml`, add one step immediately after the `Install`
step (`- name: Install` / `run: sfw pnpm install --frozen-lockfile`):

```yaml
      - name: Secret scan
        run: |
          matches=$(git ls-files | grep -v -E '^(pnpm-lock\.yaml|.*\.lock)$' | xargs grep -nE 'ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|pk_[A-Za-z0-9]{16,}' 2>/dev/null || true)
          if [ -n "$matches" ]; then
            echo "::error::Potential committed secrets detected (rotate first, then remove):"
            echo "$matches"
            exit 1
          fi
```

The pattern list was verified at plan time to match exactly one tracked file
(`context7.json:3`); after step 1 the scan is green with zero exclusions.
Lockfiles are excluded (they contain hashes, not credentials).

**Verify locally** by running the same two shell lines from the repo root:

```bash
matches=$(git ls-files | grep -v -E '^(pnpm-lock\.yaml|.*\.lock)$' | xargs grep -nE 'ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|pk_[A-Za-z0-9]{16,}' 2>/dev/null || true)
if [ -n "$matches" ]; then echo "$matches"; exit 1; fi
```

→ expect empty output and exit 0.

### Step 4: Document the policy in AGENTS.md

Append this section AFTER the `<!-- nx configuration end-->` marker in
`AGENTS.md` (keep the nx configuration markers and everything above them
untouched):

```markdown
## Secrets and local tooling

- Never commit credentials, API keys, or tokens — including inside local
  tool configs.
- `.env`, `.env.*` (except `.env.example`), and `context7.json` are
  gitignored; keep them that way.
- To use Context7 locally, create an untracked `context7.json` in the repo
  root (it is ignored) or use environment variables; `.github/agents/*.agent.md`
  consume the `context7/*` MCP tools.
- CI runs a secret scan over all tracked files on every pull request; a hit
  fails the build.
```

### Step 5: Commit

Stage only the four in-scope changes (`git rm` already staged the deletion):
`git add .gitignore .github/workflows/ci.yml AGENTS.md`. Commit with the
message from the Git workflow section. Do not stage the unrelated dirty spec
file.

**Verify**: `pnpm exec prettier --check .github/workflows/ci.yml AGENTS.md` →
exit 0 (run `pnpm exec prettier --write` on those two files first if it
fails, then re-check); `pnpm nx run-many --target=lint,lint-templates` →
exit 0.

## Test plan

No unit tests — this is a CI/config change. Verification is the commands
above: the scan snippet green locally, `git check-ignore` behavior, prettier
on the edited YAML/Markdown, and lint.

## Done criteria

- [ ] `git ls-files | grep context7.json` → empty
- [ ] `git check-ignore context7.json .env .env.local` → all three listed;
      `git check-ignore .env.example` → not ignored
- [ ] Secret-scan snippet → no matches, exit 0
- [ ] `pnpm exec prettier --check .github/workflows/ci.yml AGENTS.md` → exit 0
- [ ] `pnpm nx run-many --target=lint,lint-templates` → exit 0
- [ ] `git status --porcelain` shows only: `D  context7.json`,
      `M  .gitignore`, `M  .github/workflows/ci.yml`, `M  AGENTS.md` — plus
      the other agent's four dirty spec files (not yours; leave them)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The secret scan flags a tracked file other than the deleted
  `context7.json` → report file:line (never quote credential values); do not
  add blanket exclusions.
- The key value appears anywhere else in the repo (docs, configs, agent
  files) → report file:line only, never the value.
- `git rm context7.json` fails because the file has uncommitted changes →
  report the state; do not force-remove.
- Prettier reformats parts of `ci.yml` beyond your added step → keep the
  diff minimal; if the file was already unformatted at HEAD, only ensure your
  added lines are prettier-clean and note it.

## Maintenance notes

- Rotation + history purge remain open maintainer actions until done; the CI
  gate only prevents NEW leaks, it does not remediate the public history.
- When new credential formats appear (e.g. `sk-ant-`, `xoxb-`, `AIza...`),
  extend the pattern list in the ci.yml step — that file is the single place
  the patterns live.
- `.env.example` stays committable by design (the `!.env.example` negation).
