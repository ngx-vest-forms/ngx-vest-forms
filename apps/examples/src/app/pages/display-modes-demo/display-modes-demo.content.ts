import { defineExampleContent } from '../../shared/example-content';

export const displayModesContent = defineExampleContent({
  demonstrates: {
    icon: '👁️',
    title: 'What this demonstrates',
    points: [
      'Per-field errorDisplayMode and warningDisplayMode on ngx-control-wrapper, all bound to one form and model.',
      'Error timing compared side by side: "always" (immediate, even pristine), "on-dirty" (after typing), and "on-submit" (only after programmatic submit).',
      'Warning timing compared: "always", "on-dirty", and "on-touch" (after blur).',
      'The form is validated on first render so every mode\'s difference is visible without interacting.',
      'A parent-controlled submit path: an external button calls NgForm.onSubmit(), markAllAsTouched(), and triggerFormValidation() to reveal on-submit fields.',
      'Errors (blocking, via enforce) and warnings (non-blocking, via Vest warn()) tracked separately in the same suite.',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Display mode mechanics',
        points: [
          'Set errorDisplayMode / warningDisplayMode per field on ngx-control-wrapper.',
          'Choose timing per field: always, on-dirty, on-touch, or on-submit.',
          'Errors and warnings have independent display modes on the same control.',
        ],
      },
      {
        title: 'Programmatic submission',
        points: [
          'Reveal on-submit feedback by calling NgForm.onSubmit() from a parent.',
          'Pair it with markAllAsTouched() and triggerFormValidation() for full feedback.',
          'Use triggerFormValidation() on render to show every mode immediately.',
        ],
      },
      {
        title: 'Reading form feedback',
        points: [
          'createFormFeedbackSignals exposes formState, warnings, validatedFields, pending.',
          'Surface warnings independently of errors since warnings never block submit.',
        ],
      },
    ],
    nextStep: { label: 'Next: Business hours', route: 'business-hours' },
  },
});
