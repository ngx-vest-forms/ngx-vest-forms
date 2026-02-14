---
name: pr-toolkit
description: 'Comprehensive pull request quality toolkit. Use when reviewing PRs, preparing code for merge, or analyzing code changes. Routes to specialized sub-skills: code-reviewer (style/guideline compliance), code-simplifier (clarity/maintainability), comment-analyzer (documentation accuracy), pr-test-analyzer (test coverage gaps), silent-failure-hunter (error handling audit), type-design-analyzer (type invariant quality).'
license: MIT
metadata:
  author: ngx-vest-forms
  version: "1.0"
---

# PR Toolkit

An orchestrator skill that routes pull request review tasks to the appropriate specialized sub-skill.

## When to Use

Use this skill when:
- Reviewing a pull request for overall quality
- Preparing code for merge
- Running a comprehensive pre-merge checklist
- Unsure which specific review tool to use

## Available Sub-Skills

| Sub-Skill | Purpose | When to Use |
|-----------|---------|-------------|
| [code-reviewer](code-reviewer/SKILL.md) | Guideline compliance and bug detection | After writing code, before committing |
| [code-simplifier](code-simplifier/SKILL.md) | Clarity and maintainability refinement | After completing a coding task |
| [comment-analyzer](comment-analyzer/SKILL.md) | Documentation accuracy verification | After adding/modifying comments or docs |
| [pr-test-analyzer](pr-test-analyzer/SKILL.md) | Test coverage gap analysis | After creating or updating a PR |
| [silent-failure-hunter](silent-failure-hunter/SKILL.md) | Error handling and silent failure audit | When code has try/catch, fallbacks, or error handling |
| [type-design-analyzer](type-design-analyzer/SKILL.md) | Type invariant and encapsulation quality | When introducing or modifying types |

## Recommended Workflow

For a thorough PR review, run the sub-skills in this order:

1. **code-reviewer** - Catch guideline violations and bugs first
2. **silent-failure-hunter** - Ensure error handling is robust
3. **type-design-analyzer** - Verify type design quality
4. **pr-test-analyzer** - Identify test coverage gaps
5. **comment-analyzer** - Verify documentation accuracy
6. **code-simplifier** - Final clarity pass

## Project Context

This project uses:
- **Angular 21** with standalone components and signals
- **TypeScript ~5.9** with strict mode
- **Vest.js** for validation
- **Vitest** for unit testing
- **Playwright** for E2E testing
- **Tailwind CSS v4** for styling

Review against the project's guidelines in `.github/instructions/` and `.github/copilot-instructions.md`.
