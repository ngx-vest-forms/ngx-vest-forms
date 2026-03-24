# Vest.js skill version-selection guide

Use this guide when deciding whether the `vestjs` router should answer with **5.x** or a future **6.x** lane.

## Default behavior in this repository

Default to **Vest 5.4 / 5.x** guidance unless there is explicit evidence that another major version is intended.

That default is correct when:

- the question is asked inside this repository
- the user says `Vest 5`, `Vest 5.x`, or `Vest 5.4`
- the examples or APIs match the current 5.x docs and repo conventions

## When to route to a future 6.x lane

Use a 6.x lane only when at least one of these is true:

- the user explicitly asks for Vest 6
- the repo or package context clearly depends on Vest 6
- the APIs or migration concerns are specific to Vest 6 semantics

If the version is ambiguous and no repo context is available, ask for the target version or state the assumption clearly.

## Router behavior guidelines

- Keep `vestjs` as the stable public entry point.
- Prefer versioned internals over separate public skills until multiple majors truly need distinct first-class support.
- Route by **repo context first**, then by explicit user version, then by conservative stated assumption.

## Current internal layout

- `references/5.x/` — version-specific source maps and notes for Vest 5.x
- `evals/5.x.json` — version-specific eval set for Vest 5.x

When 6.x support is added, mirror this with:

- `references/6.x/`
- `evals/6.x.json`

Keep `evals/evals.json` as the default active eval alias unless there is a stronger reason to change the repo convention.
