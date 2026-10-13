# ngx-vest-forms

Shared instructions for every coding agent in this repo (Claude Code, Copilot). Skills live in `.agents/skills/`; `.claude/skills` is a symlink to it.

## Pointers

- Code that uses ngx-vest-forms or Vest: load the `ngx-vest-forms` and `vestjs` skills first. They hold the invariants (`[ngModel]` binding, `name` = model path, Vest 6 suite shape).
- Project vocabulary: `GLOSSARY.md`. Past decisions and their reasons: `docs/adr/`.
- Public surface of the library: exactly what `packages/ngx-vest-forms/src/public-api.ts` exports.

## Branches

- `master` is v3, the current line. Target it by default.
- `release/v2.x` and `release/v1.x` are maintenance-only for their major: bug fixes and security patches.
- Merging never publishes. Stable releases go out through a manual `workflow_dispatch` of `.github/workflows/cd.yml`; prereleases through `.github/workflows/prerelease.yml`. Branch-to-channel mapping lives in `.releaserc`.

## Library changes

1. Implement in `packages/ngx-vest-forms/src/lib/`.
2. Export the supported surface from `public-api.ts`.
3. Add or update usage in `apps/examples/`.
4. Add or update tests.
5. Update the docs and every skill or reference file that covers the feature.

Consumer-facing examples import from `'ngx-vest-forms'` and use only symbols in `public-api.ts`; `src/lib/**` paths are for library maintenance only.

## Gotchas

- Versions in `package.json` are hard limits. Code that needs a newer Angular, TypeScript, Vest or test-runner feature needs a stated reason in the PR.
- The examples app mocks the people API in-app (`mockPeopleApiInterceptor`); it runs without a backend.
- Refresh the Nx agent files with `pnpm nx configure-ai-agents --agents codex`. The `claude` and `copilot` targets recreate `CLAUDE.md`, `.claude/settings.json` and `.github/skills/`, which this repo has removed.
- `npx skills add ngx-vest-forms/ngx-vest-forms` offers only `ngx-vest-forms` and `vestjs`. Every other skill in `.agents/skills/` sets `metadata.internal: true`, which hides it from that list; add it to new maintainer skills, and add it back after refreshing a vendored skill.
- The Nx MCP server and the `ci-monitor-subagent` that `monitor-ci` spawns come from the `nx` Claude Code plugin (`nrwl/nx-ai-agents-config` marketplace). Install it at user level; the repo no longer enables it.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

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

## Secrets and local tooling

- Never commit credentials, API keys, or tokens — including inside local
  tool configs. Context7's secret credential is the `ctx7sk-` API key (MCP
  server / Public API auth): keep it in your MCP client config or the
  `CONTEXT7_API_KEY` environment variable, never in this repo.
- `context7.json` is not a secret. Context7's library-claim flow generates
  it with a public `pk_` key and asks you to commit it to the default
  branch (https://context7.com/docs/howto/claiming-libraries) — keep it
  tracked.
- `.env` and `.env.*` (except `.env.example`) are gitignored; keep them
  that way.
- CI runs a secret scan on pull requests to `master`, `release/**`, `next`,
  `beta`, `alpha`, or `rc`, over tracked files except `pnpm-lock.yaml` and
  `*.lock`; a hit fails the build.
