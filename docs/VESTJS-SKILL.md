# Vest.js Agent Skill

This repository ships an installable agent skill for Vest.js 6. It lives at `.agents/skills/vestjs/`, and an agent client that opens this repository finds it without an install.

## Install

```bash
npx skills add ngx-vest-forms/ngx-vest-forms --skill vestjs
```

## What it does

The skill is a router. It reads the Vest version installed in your project, holds a short list of Vest 6 invariants, and sends the agent to one focused sub-skill. The routing table in [`SKILL.md`](../.agents/skills/vestjs/SKILL.md) lists the sub-skills and their triggers.

Its TypeScript examples are type-checked in CI against the Vest version this repository installs. Where the Vest documentation and the published package differ, the skill follows the package and says so.

In a project that uses Vest 5, the skill answers from the Vest 5 docs and offers the upgrade.

## With ngx-vest-forms

For Angular template-driven forms, install the `ngx-vest-forms` skill too. It holds the rules for the suite that the form directive runs; the `vestjs` skill covers Vest itself.

```bash
npx skills add ngx-vest-forms/ngx-vest-forms --skill ngx-vest-forms
```
