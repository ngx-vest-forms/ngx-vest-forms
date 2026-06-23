# Vest.js Agent Skill Guide

This repository ships an installable agent skill for **Vest.js guidance**.

The repository-local skill lives at `.agents/skills/vestjs/`. Compatible agent clients can discover it automatically when this repository is open.

Use it when you want repo-local, documentation-backed guidance for writing or reviewing Vest suites in the same style as the existing `ngx-vest-forms` skill family.

## Install

From the repository root:

```bash
npx skills add ngx-vest-forms/ngx-vest-forms --skill vestjs
```

## What the skill covers

The top-level `vestjs` skill is a **router**. It points the model toward the right focused sub-skill instead of answering every Vest question with one giant catch-all prompt.

It is also the **stable public entry point** for versioning. In this repository, that router now defaults to the **Vest 6.x** lane used by `ngx-vest-forms` v3.

### Core workflow sub-skills

| Sub-skill                  | What it covers                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `core`                     | first suites, `create`, native schema-aware suites, `test`, `enforce`, `suite.only(...).run(...)`, stateful vs stateless design |
| `conditional-control-flow` | `skip`, `focus`, `only`, `include`, `skipWhen`, `omitWhen`, `optional`, linked fields, hidden branches |
| `async-and-warnings`       | async tests, `AbortSignal`, stale request avoidance, `warn()`, `useWarn()`, `afterEach()`, `afterField()`, pending state |
| `results-groups-and-types` | result access, `group`, `each`, execution modes, typed suites, group-specific result queries     |

### Advanced workflow sub-skills

| Sub-skill                  | What it covers                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `enforce-and-custom-rules` | `enforce.condition`, `enforce.extend`, `compose`, custom rule design, matcher typing         |
| `server-side-validation`   | request isolation, `suite.runStatic(...)`, server-oriented execution modes, backend validation output |

## How it is intended to be used

Use `vestjs` for broad or ambiguous requests like:

- “How should I structure this Vest suite?”
- “What’s the right Vest 6 pattern for conditional validation?”
- “Why is this skipped field still making my form invalid?”
- “How do I type a Vest suite in TypeScript?”
- “How should I do server-side request validation with Vest?”

Once the problem area is clear, the router skill should narrow to the corresponding focused sub-skill.

## Vest 6 `focus()` quick reference

For ngx-vest-forms integrations, keep suite callbacks model-only and perform focused runs at the call site:

```ts
suite.only(field).run(model);
```

When a flow needs group-level focus as well, pass a focus target from the call site (`NgxValidationFocus`) rather than introducing callback-field patterns inside `create(...)`.

## Versioning strategy

The public install name stays:

- `vestjs`

Version-specific material is organized internally so the skill can grow without renaming the install target too early.

### Current internal versioned layout

- `.agents/skills/vestjs/references/version-selection.md`
- `.agents/skills/vestjs/references/5.x/source-map.md` (historical migration reference)
- `.agents/skills/vestjs/evals/evals.json` (current supported lane)

This means:

- the **public skill stays stable**
- the **current default lane is 6.x**
- historical 5.x material is still available for migration guidance

### Historical 5.x material

The repo keeps 5.x source maps and evals for migration work, but current guidance should not present Vest 5 patterns as the default. If you're maintaining legacy code, use that material to explain the migration path rather than teaching callback `field?` parameters, `staticSuite(...)`, or result `.done()` as current practice.

## Repo alignment

The skill is designed to complement the repository’s existing instruction files and the `ngx-vest-forms` skill package.

If a question involves both raw Vest behavior and Angular template-driven integration, use the `vestjs` and `ngx-vest-forms` skills together rather than forcing one to explain the other’s domain.

## Main source files

- `.agents/skills/vestjs/SKILL.md`
- `.agents/skills/vestjs/references/version-selection.md`
- `.agents/skills/vestjs/references/5.x/source-map.md`
- `.agents/skills/vestjs/evals/evals.json`
- `.github/instructions/vest.instructions.md`
- `.agents/skills/ngx-vest-forms/`

## Upstream references

- [Vest docs](https://vestjs.dev/docs/get_started)
- [Vest API reference](https://vestjs.dev/docs/api_reference)
- [Vest TypeScript support](https://vestjs.dev/docs/typescript_support)

## Manual review reminder

This skill package was written with maintainability in mind, but it should still be reviewed manually and exercised against realistic prompts before relying on it broadly.
