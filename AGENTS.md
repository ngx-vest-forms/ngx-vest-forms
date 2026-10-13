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
- CI runs a secret scan over all tracked files on every pull request; a hit
  fails the build.
