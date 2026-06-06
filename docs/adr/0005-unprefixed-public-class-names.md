# Public class names stay unprefixed in v3

## Status

Accepted (intentional inconsistency)

## Date

2026-05-18

## Context

The v3 public API uses the `Ngx` / `ngx` prefix consistently for types, injection tokens, and selectors (e.g. `NgxVestSuite`, `NGX_ERROR_DISPLAY_MODE_TOKEN`, `form[ngxVestForm]`, `ngx-control-wrapper`). The exported **class** names, however, are unprefixed: `FormDirective`, `ControlWrapperComponent`, `FormGroupWrapperComponent`, and similar.

The v3 review flagged this as an API-surface inconsistency: a reader sees prefixed tokens/selectors but unprefixed class identifiers.

Two competing concerns:

- Renaming classes to `NgxFormDirective` etc. removes the inconsistency but is a breaking change for any consumer importing the class by name, and adds churn across docs, examples, and tests with no behavioral benefit.
- A generic exported name like `FormDirective` carries a real symbol-collision risk in consumer codebases that also define a `FormDirective`.

## Decision

For v3, keep the existing unprefixed public class names. Record this as an **accepted, intentional inconsistency** rather than a defect.

## Rationale

The prefix already disambiguates the consumer-facing surface that actually appears in templates and DI (selectors and tokens). Class names are referenced via explicit imports, where collisions are resolved with import aliasing on the consumer side. Renaming mid-v3 would be a breaking change disproportionate to the (cosmetic) consistency gain.

## Consequences

- The public API intentionally mixes prefixed selectors/tokens/types with unprefixed class names; this is documented, not a bug to "fix" within v3.
- Consumers with a naming collision can alias on import (`import { FormDirective as NgxFormDirective } from 'ngx-vest-forms'`).
- A future major may introduce prefixed class names (optionally with deprecated unprefixed aliases for one cycle).

## Revisit when

- The next major (v4) is planned and a coordinated rename + deprecation cycle is acceptable, or a concrete, repeated consumer collision report justifies prioritising the rename earlier behind aliases.
