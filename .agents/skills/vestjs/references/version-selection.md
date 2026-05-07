# Vest.js skill version-selection guide

Use this guide when deciding whether the `vestjs` router should answer with the current **6.x** lane or the historical **5.x** lane.

## Default behavior in this repository

Default to **Vest 6.x** guidance in this repository unless there is explicit evidence that the user wants the legacy 5.x API surface.

That default is correct when:

- the question is asked inside this repository
- the repo or package context points at Vest 6
- the code uses suite-object execution such as `suite.run(...)`, `suite.only(...).run(...)`, or `runStatic(...)`

## When to route to the historical 5.x lane

Use a 5.x lane only when at least one of these is true:

- the user explicitly asks for Vest 5 / 5.x / 5.4
- the code uses `staticSuite((model, field?) => ...)`, `only(field)` inside callbacks, or direct callable suite execution
- the user is working on a legacy migration and needs the old API explained accurately

If the version is ambiguous and no repo context is available, ask for the target version or state the assumption clearly.

## Router behavior guidelines

- Keep `vestjs` as the stable public entry point.
- Prefer versioned internals over separate public skills until multiple majors truly need distinct first-class support.
- Route by **repo context first**, then by explicit user version, then by conservative stated assumption.

## Current internal layout

- `references/5.x/` — historical source maps and notes for Vest 5.x
- `evals/5.x.json` — historical eval set for Vest 5.x

If a newer major than 6.x needs separate handling later, mirror this with:

- `references/<major>.x/`
- `evals/<major>.x.json`

Keep `evals/evals.json` as the default active eval alias unless there is a stronger reason to change the repo convention.
