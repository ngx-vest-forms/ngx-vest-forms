# Vest.js Agent Skill Guide

This repository ships an installable agent skill for **Vest.js guidance**.

Use it when you want repo-local, documentation-backed guidance for writing or reviewing Vest suites in the same style as the existing `ngx-vest-forms` skill family.

## Install

From the repository root:

```bash
npx skills add ngx-vest-forms/ngx-vest-forms --skill vestjs
```

## What the skill covers

The top-level `vestjs` skill is a **router**. It points the model toward the right focused sub-skill instead of answering every Vest question with one giant catch-all prompt.

It is also the **stable public entry point** for versioning. Right now, that router defaults to the **Vest 5.4 / 5.x** lane used by this repository.

### Core workflow sub-skills

| Sub-skill                  | What it covers                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `core`                     | first suites, `create` vs `staticSuite`, `test`, `enforce`, `only`, stateful vs stateless design |
| `conditional-control-flow` | `skip`, `only`, `include`, `skipWhen`, `omitWhen`, `optional`, linked fields, hidden branches    |
| `async-and-warnings`       | async tests, `AbortSignal`, stale request avoidance, `warn()`, `.done()`, pending state          |
| `results-groups-and-types` | result access, `group`, `each`, execution modes, typed suites, group-specific result queries     |

### Advanced workflow sub-skills

| Sub-skill                  | What it covers                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `enforce-and-custom-rules` | `enforce.condition`, `enforce.extend`, `compose`, custom rule design, matcher typing         |
| `server-side-validation`   | request isolation, `staticSuite`, server-oriented execution modes, backend validation output |

## How it is intended to be used

Use `vestjs` for broad or ambiguous requests like:

- “How should I structure this Vest suite?”
- “What’s the right 5.x pattern for conditional validation?”
- “Why is this skipped field still making my form invalid?”
- “How do I type a Vest suite in TypeScript?”
- “How should I do server-side request validation with Vest?”

Once the problem area is clear, the router skill should narrow to the corresponding focused sub-skill.

## Versioning strategy

The public install name stays:

- `vestjs`

Version-specific material is organized internally so the skill can grow without renaming the install target too early.

### Current internal versioned layout

- `.github/skills/vestjs/references/version-selection.md`
- `.github/skills/vestjs/references/5.x/source-map.md`
- `.github/skills/vestjs/evals/5.x.json`

This means:

- the **public skill stays stable**
- the **current default lane is 5.x**
- a future `6.x` lane can be added without forcing users to switch install names immediately

### When to add a separate 6.x lane

Add internal `6.x` references and evals when Vest 6 support is actually needed.

Only consider separate public skills like `vestjs-5x` and `vestjs-6x` if both majors later become actively maintained and materially divergent in practice.

## Repo alignment

The skill is designed to complement the repository’s existing instruction files and the `ngx-vest-forms` skill package.

If a question involves both raw Vest behavior and Angular template-driven integration, use the `vestjs` and `ngx-vest-forms` skills together rather than forcing one to explain the other’s domain.

## Main source files

- `.github/skills/vestjs/SKILL.md`
- `.github/skills/vestjs/references/version-selection.md`
- `.github/skills/vestjs/references/5.x/source-map.md`
- `.github/instructions/vest.instructions.md`
- `.github/skills/ngx-vest-forms/`

## Upstream references

- [Vest 5.x docs](https://vestjs.dev/docs/5.x/get_started)
- [Vest 5.x API reference](https://vestjs.dev/docs/5.x/api_reference)
- [Vest 5.x TypeScript support](https://vestjs.dev/docs/5.x/typescript_support)

## Manual review reminder

This skill package was written with maintainability in mind, but it should still be reviewed manually and exercised against realistic prompts before relying on it broadly.
