# Vest.js skill version-selection guide

Use this guide when deciding whether the `vestjs` router should answer with **5.x** or a future **6.x** lane.

## Default behavior

Default to **Vest 5.4 / 5.x** guidance unless the application specifies another major version.

That default is correct when:

- the user says `Vest 5`, `Vest 5.x`, or `Vest 5.4`
- the application's installed Vest dependency is 5.x

## When to route to a future 6.x lane

Use a 6.x lane only when at least one of these is true:

- the user explicitly asks for Vest 6
- the application's installed dependency is Vest 6
- the APIs or migration concerns are specific to Vest 6 semantics

If the version is ambiguous, ask for the target version or state the 5.4 assumption clearly.

## Router behavior guidelines

- Keep `vestjs` as the stable public entry point.
- Route by explicit user version first, then by the application's dependency, then by a conservative stated assumption.
