import { defineExampleContent } from '../../shared/example-content';

export const submissionPatternsContent = defineExampleContent({
  demonstrates: {
    icon: '📮',
    title: 'What this demonstrates',
    points: [
      'Concern (a) — field validation: a plain Vest suite (required, email format, password length, accepted terms)',
      'Concern (b) — submit-time INVALID handling: an invalid submit never calls the server and moves focus to the first invalid control',
      'Concern (c) — server FAILURE messaging: HTTP errors surface in an assertive error panel with a Retry button',
      'Concern (d) — SUCCESS state: a polite success panel echoes the new account id with a "Create another" reset',
      'A four-state page signal (editing / submitting / server-error / success) that keeps these concerns distinct',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Why the four concerns are separate',
        points: [
          'Field validity is decided by the Vest suite; the server is only contacted once the form is valid',
          'focusFirstInvalidControl() on FormDirective guides keyboard and AT users after an invalid submit',
          'Server failure is page state, not validation state — it never pollutes the Vest suite',
        ],
      },
      {
        title: 'Deterministic demos',
        points: [
          'The scenario picker forces Normal / Email taken (409) / Server error / Network error paths',
          'Retry re-submits the exact same value; Create another resets cleanly to editing',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Complex nested form',
      route: 'complex-nested',
    },
  },
});
