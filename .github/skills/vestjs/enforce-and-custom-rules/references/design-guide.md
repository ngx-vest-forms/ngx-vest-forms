# Vest.js 5.4 custom rule design guide

Use this guide to choose the right `enforce` extension mechanism.

| Need | Preferred tool | Why |
| --- | --- | --- |
| One-off logic inside a single validation | `enforce.condition(...)` | Lowest ceremony and easiest to read locally |
| Reusable named matcher across forms or suites | `enforce.extend(...)` | Gives the rule a domain name and shared implementation |
| Bundle several existing rules into one reusable validator | `compose(...)` | Reuses existing rule building blocks without inventing a new global matcher |

## Rule design heuristics

- Prefer a local `condition(...)` first when the rule is unlikely to be reused.
- Prefer `compose(...)` when you are mostly assembling existing `enforce` behavior.
- Prefer `enforce.extend(...)` when the team benefits from a stable, named business rule.

## Message guidance

If a custom rule returns an object, keep `message()` focused on the business failure, not the matcher internals.

Good:

- `Email must belong to an approved domain`
- `Password confirmation must match password`

Less good:

- `custom matcher returned false`

## Context guidance

Reach for `enforce.context()` only when a rule truly depends on surrounding object state. It is powerful but more coupled than explicit matcher arguments.
