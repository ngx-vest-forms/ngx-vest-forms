/**
 * Per-demo documentation convention for the Examples App.
 *
 * Every demo page ships a `<demo>.content.ts` file exporting an
 * {@link ExampleContent} object declared `as const`. The shared
 * {@link import('../ui/example-cards/example-cards.component').ExampleCardsComponent}
 * renders it into two side-by-side cards — "What this demonstrates" and
 * "What you'll learn" — so every page documents itself the same way.
 *
 * Longer-form prose lives in a sibling `README.md`; it is repo-discoverable
 * and intentionally not rendered inside the app shell in this wave.
 */

/** A titled group of bullet points used in the "What you'll learn" card. */
export type ExampleLearnSection = {
  /** Short heading for the group of takeaways. */
  readonly title: string;
  /** One concrete takeaway per bullet. */
  readonly points: readonly string[];
};

/** Optional pointer to the next recommended demo, rendered as a link. */
export type ExampleNextStep = {
  /** Call-to-action label, e.g. "Next: Async validation". */
  readonly label: string;
  /** Router path of the next demo, e.g. `'async-username'`. */
  readonly route: string;
};

/**
 * Structured, typed description of what a demo proves and teaches.
 * Authored once per page in `<demo>.content.ts` and rendered by
 * `<ngx-example-cards>`.
 */
export type ExampleContent = {
  /** "What this demonstrates" — the capabilities the page exercises. */
  readonly demonstrates: {
    /** Single emoji used as the card glyph (decorative). */
    readonly icon: string;
    /** Card title, usually "What this demonstrates". */
    readonly title: string;
    /** Capability bullets — what the running demo proves. */
    readonly points: readonly string[];
  };
  /** "What you'll learn" — grouped takeaways plus an optional next step. */
  readonly learn: {
    /** Card title, usually "What you'll learn". */
    readonly title: string;
    /** Grouped learning sections. */
    readonly sections: readonly ExampleLearnSection[];
    /** Optional link to the next recommended demo. */
    readonly nextStep?: ExampleNextStep;
  };
};

/**
 * Identity helper that preserves literal types while asserting the shape.
 * Use in each `<demo>.content.ts`:
 *
 * ```ts
 * export const starterContent = defineExampleContent({ ... });
 * ```
 */
export function defineExampleContent<T extends ExampleContent>(content: T): T {
  return content;
}
