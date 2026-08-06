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

The top-level `vestjs` skill is a **router**. It points the model toward the right focused sub-skill instead of answering every Vest question with one giant catch-all prompt. It defaults to the **Vest 5.4 / 5.x** lane.

### Core workflow sub-skills

| Sub-skill                  | What it covers                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `core`                     | first suites, `create` vs `staticSuite`, `test`, `enforce`, `only`, stateful vs stateless design |
| `conditional-control-flow` | `skip`, `only`, `include`, `skipWhen`, `omitWhen`, `optional`, linked fields, hidden branches    |
| `async-and-warnings`       | async tests, `AbortSignal`, stale request avoidance, `warn()` / `useWarn()`, `.done()`, pending state |
| `results-groups-and-types` | result access, `group`, `each`, execution modes, typed suites, group-specific result queries     |

### Advanced workflow sub-skills

| Sub-skill                  | What it covers                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `enforce-and-custom-rules` | composable validation helpers, `enforce.condition`, `enforce.extend`, `compose`, matcher typing |
| `server-side-validation`   | request isolation, `staticSuite`, server-oriented execution modes, backend validation output |

## How it is intended to be used

Use `vestjs` for broad or ambiguous requests like:

- “How should I structure this Vest suite?”
- “What’s the right 5.x pattern for conditional validation?”
- “Why is this skipped field still making my form invalid?”
- “How do I type a Vest suite in TypeScript?”
- “How should I do server-side request validation with Vest?”

Once the problem area is clear, the router skill should narrow to the corresponding focused sub-skill.

## Version behavior

The skill assumes Vest 5.4 unless the application specifies another major. State
that assumption or ask for the target version before applying guidance to a
different Vest major.

## Integration

The skill complements the `ngx-vest-forms` skill when an application uses both libraries.

If a question involves both raw Vest behavior and Angular template-driven integration, use the `vestjs` and `ngx-vest-forms` skills together rather than forcing one to explain the other’s domain.

## Upstream references

- [Vest 5.x docs](https://vestjs.dev/docs/5.x/get_started)
- [Vest 5.x API reference](https://vestjs.dev/docs/5.x/api_reference)
- [Vest 5.x TypeScript support](https://vestjs.dev/docs/5.x/typescript_support)
