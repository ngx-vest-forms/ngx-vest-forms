# ngx-vest-forms

Shared instructions for every coding agent in this repo (Claude Code, Copilot). Skills live in `.agents/skills/`; `.claude/skills` is a symlink to it.

This codebase is yours to shape and keep improving: follow the boy scout rule and leave code you touch or reuse simpler than you found it, changing working code only when that removes real complexity or a real defect.

## Pointers

- Code that uses ngx-vest-forms or Vest: load the `ngx-vest-forms` and `vestjs` skills first. They hold the invariants (`[ngModel]` binding, `name` = model path, Vest 6 suite shape).
- Forms in this repo are template-driven with ngx-vest-forms by design. Angular's own guidance (the `angular-developer` skill, the `get_best_practices` tool) prefers Signal Forms for a new form; that preference does not apply here.
- Project vocabulary: `GLOSSARY.md`. Past decisions and their reasons: `docs/adr/`.
- Public surface of the library: exactly what `packages/ngx-vest-forms/src/public-api.ts` exports.

## Branches

- `master` is v3, the current line. Target it by default. A PR into it needs the `ci` and `pr-title` checks.
- `release/v2.x` and `release/v1.x` are maintenance-only for their major: bug fixes and security patches.
- `beta` and `rc` are prerelease branches. They only ever fast-forward to `master` and never get commits of their own.
- Merging never publishes. Every release, stable or prerelease, goes out through a manual `workflow_dispatch` of `.github/workflows/cd.yml`, dispatched with `--ref` set to the branch being released, and waits for approval on the `npm-publish` environment. It publishes through npm Trusted Publishing; keep its `NPM_CONFIG_REGISTRY` at `https://registry.npmjs.org/` with the trailing slash, or the OIDC exchange is skipped. Branch-to-channel mapping lives in `.releaserc`; `docs/RELEASE.md` has the steps.
- Dependabot npm PRs with no semver-major update merge automatically once the required checks pass (`dependabot-auto-merge.yml`). GitHub Actions updates always wait for a human, because some of those actions run in the publishing job.

## Stops

Carry a task through without a check-in while no step needs a decision. Stop and ask before a `cd.yml` dispatch with `dry_run=false`, a push to `master`, `beta`, `rc` or `release/**`, and a force-push.

## Library changes

1. Implement in `packages/ngx-vest-forms/src/lib/`.
2. Export the supported surface from `public-api.ts`.
3. Add or update usage in `apps/examples/`.
4. Add or update tests.
5. Update the docs and every skill or reference file that covers the feature.

Done when `pnpm verify` passes: the format check, the skill checks, lint, the spec typecheck, the production library build and the unit tests. CI adds the browser and E2E tests; the `run-examples` skill has the local commands.

Consumer-facing examples import from `'ngx-vest-forms'` and use only symbols in `public-api.ts`; `src/lib/**` paths are for library maintenance only.

## Gotchas

- Versions in `package.json` are hard limits. Code that needs a newer Angular, TypeScript, Vest or test-runner feature needs a stated reason in the PR.
- The examples app mocks the people API in-app (`mockPeopleApiInterceptor`); it runs without a backend.
- `pnpm check:skills` guards `.agents/skills/`, and its messages say how to fix a failure:
  - `ngx-vest-forms` and `vestjs` are the public skills that `npx skills add ngx-vest-forms/ngx-vest-forms` installs. Their TypeScript examples must compile.
  - Upstream skills stay identical to their upstream; make no local edits. `angular-developer` is Angular's (`skills-lock.json`); update it with `npx skills update -p`. The Nx skills (`nx-*`, `monitor-ci`, `link-workspace-packages`) are recorded in `.agents/nx-skills-lock.json`.
  - In a code review, raise no findings on the upstream skills: a defect there goes to `angular/skills` or `nrwl/nx-ai-agents-config`. `.coderabbit.yaml` and `.oxfmtrc.json` exclude the same folders, and the check fails when a new upstream skill is missing from either.
  - Maintainer skills set `metadata.internal: true`, which hides them from `npx skills add`.
- The Nx skills and the Nx block below belong to the Nx installer, which installs all of them or none. Refresh them with `pnpm nx configure-ai-agents --agents codex`, then record them with `node .github/scripts/check-agent-skills.mjs --write-nx-lock`. The `claude` and `copilot` targets recreate `CLAUDE.md`, `.claude/settings.json` and `.github/skills/`, which this repo has removed.
- This workspace has no Nx Cloud connection, so `monitor-ci` and the `nx-cloud-*` skills have nothing to read. Watch CI with `gh`.
- The Nx MCP server (`nx_docs` in the block below) and the `ci-monitor-subagent` come from the `nx` Claude Code plugin (`nrwl/nx-ai-agents-config` marketplace). The repo doesn't enable it; enable `nx@nx-claude-plugins` in your `.claude/settings.local.json`, or read `pnpm nx <command> --help`.
- The `angular-cli` MCP server (`.mcp.json`) finds no Angular workspace, because Nx replaces `angular.json`: its `list_projects` tool fails. Use its `search_documentation` and `get_best_practices` tools, and run targets with `pnpm nx`.
- In a sandboxed agent: Nx needs its Unix sockets under `/tmp/.nx` and `~/.nx` ([Nx guide](https://nx.dev/docs/kb/nx-sandbox-unix-sockets)), `pnpm install` needs write access to the pnpm store, and the `test-browser` and `e2e` targets start a browser only outside the sandbox.
- `context7.json` holds a public `pk_` key that Context7's library-claim flow asks you to commit; keep it tracked. The Context7 secret is the `ctx7sk-` API key, which stays in your MCP client config or `CONTEXT7_API_KEY`. The `Secret scan` step of `ci.yml` fails the build on a committed secret.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
