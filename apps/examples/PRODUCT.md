# Product

## Register

product

## Users

Angular developers evaluating `ngx-vest-forms` — landing here to see the library in action, copy trustworthy patterns, and decide whether to adopt it. Primary job: go from "does this do what I need?" to a working integration, fast. Secondary users: existing adopters returning to reference a specific feature or look up an implementation pattern.

Context: developer mindset, terminal open, high bar for "is this production-ready?". They will judge the library partly by how well the demo app itself is built.

## Product Purpose

A developer-facing demo hub and pattern reference for `ngx-vest-forms` — an Angular template-driven forms library with Vest.js validation. The app must make the library's value immediately legible: each demo is a runnable example with copy-worthy code, not a passive showcase. Success means a developer can evaluate the library, understand its conventions, and start building in under 10 minutes.

Docs and examples are distinct surfaces: docs explain the *why* and the API; examples show the *how*. Both need to coexist clearly without blurring.

## Brand Personality

Modern · Clean · Confident

Voice: precise and direct, without being terse. Writes like a senior developer documenting for peers. No fluff, no hedging, no over-explaining.

Emotional goal: developer trust. The interface should signal that the people behind this library sweat the details — in the UI *and* in the code.

## References

- **Formisch.dev playground** (`formisch.dev/playground/special/`) — captured as a directional reference for form-library playgrounds done well. Specific draws: interactive, code-centric layout; clear separation of the form output and its configuration.
- **Current ngx-vest-forms examples app** — the teal palette, dark mode, and sidebar structure are already established and worth building on, not resetting. The gap is alignment: docs vs. examples need stronger visual distinction; layout and spacing can be tighter and more consistent.

## Anti-references

- Generic Material/Bootstrap admin panel aesthetic (heavy borders, default card grids, dense data-table density without intent).
- Fluffy marketing sites with hero images, gradient blobs, and stock photography — this is a tool, not a campaign.
- Docusaurus/GitBook defaults — heavy TOC chrome, wall-of-text information architecture.

## Design Principles

1. **Practice what you preach.** A form library's demo app is the highest-fidelity proof of concept. Form UX must be exemplary: clear labels, accessible errors, keyboard-navigable flows. Anything less undermines the pitch.
2. **Code is the hero.** The UI chrome recedes; the running demo and its source are the content. Every layout decision should increase the salience of the form output and reduce friction to understanding it.
3. **Docs and examples are distinct.** Navigation, hierarchy, and layout should make the surface type legible at a glance — a developer landing on a reference page vs. an interactive demo should instantly know where they are.
4. **Confident defaults.** Don't apologize for opinions. The teal palette, dark mode, and opinionated spacing are established identity. Evolve them with precision; don't soften them toward generic neutrality.
5. **Clarity over decoration.** Developers parse fast. Every visual element should either help them orient, help them focus on the demo, or step aside. Decoration that doesn't earn its place is noise.

## Accessibility & Inclusion

WCAG 2.1 AA baseline. The app is itself a form library demo — every form pattern modeled here should be a correct accessibility reference implementation. Interactive form elements must meet contrast, label association, keyboard navigation, and live-region requirements as a baseline. Reduced-motion variants required for any animation.
