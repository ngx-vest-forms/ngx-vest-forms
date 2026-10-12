import { defineExampleContent } from '../../shared/example-content';

export const submissionPatternsContent = defineExampleContent({
  demonstrates: {
    icon: '📮',
    title: 'What this demonstrates',
    points: [
      'Concern (a) — field validation: a plain Vest suite (required, email format, password length, accepted terms) with submit-gated visibility for this demo',
      'Concern (b) — submit-time INVALID handling: an invalid submit never calls the server and moves focus to the first invalid control; the form binds [focusFirstInvalidOnSubmit]="false" to opt out of the built-in focus and run its own submit flow',
      'Concern (b.1) — end the submit cycle with clearSubmittedState() so submit-only errors hide without resetting values or Angular control metadata',
      'Concern (c) — server FAILURE messaging: HTTP errors surface in an assertive error panel with a Retry button',
      'Concern (d) — SUCCESS state: a polite success panel echoes the new account id with a "Create another" reset',
      'A four-state page signal (editing / submitting / server-error / success) that keeps these concerns distinct',
      'Angular 22 `injectAsync(..., { prefetch: onIdle })` lazy-loads the account client without cluttering the form flow',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Why the four concerns are separate',
        points: [
          'Field validity is decided by the Vest suite; the server is only contacted once the form is valid',
          'By default the directive focuses the first invalid control on submit (focusFirstInvalidOnSubmit); set it to false when your page owns the submit flow and call focusFirstInvalidControl() yourself',
          'clearSubmittedState() ends the submit gate without wiping the current values or touched history',
          'Server failure is page state, not validation state — it never pollutes the Vest suite',
        ],
      },
      {
        title: 'Deterministic demos',
        points: [
          'The scenario picker forces Normal / Email taken (409) / Server error / Network error paths',
          'Retry re-submits the exact same value; Create another resets cleanly to editing',
          'The submit-only HTTP client is a good fit for lazy DI because it is only needed after a valid submit',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Complex nested form',
      route: 'complex-nested',
    },
  },
});
