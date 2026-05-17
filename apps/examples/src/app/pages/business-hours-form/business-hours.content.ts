import { defineExampleContent } from '../../shared/example-content';

export const businessHoursContent = defineExampleContent({
  demonstrates: {
    icon: '🕒',
    title: 'What this demonstrates',
    points: [
      'A dynamic, keyed collection of from/to time ranges that can be added and removed at runtime',
      'Per-entry field validation generated with Vest each() over the collection entries',
      'Cross-field rule per entry: the "to" time must be later than the "from" time',
      'Two ROOT_FORM rules: at least one entry is required, and no two ranges may overlap',
      'An "add new" slot that stays valid while both inputs are empty (allowEmptyPair) and validates as a pair once typing starts',
      'createValidationConfig().bidirectional() pairing the add-new from/to so editing one re-runs the other',
      'Manual revalidation via triggerFormValidation() after structural add/remove changes',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Dynamic collections',
        points: [
          'Iterate a keyed record with Vest each() to validate every entry under its own path',
          'Keep an "add new" row optional with omitWhen + an allowEmptyPair guard',
          'Re-trigger the suite after structural changes so ROOT_FORM rules re-evaluate',
        ],
      },
      {
        title: 'omitWhen + validationConfig together',
        points: [
          'omitWhen decides WHETHER a cross-field test runs; validationConfig decides WHEN to revalidate',
          'A bidirectional pair is required so editing "from" re-runs the "to" check and vice versa',
          'Format checks are themselves gated with omitWhen so blank fields stay quiet',
        ],
      },
      {
        title: 'Form-level rules',
        points: [
          'Express "at least one" and "no overlap" as ROOT_FORM tests',
          'Surface the single ROOT_FORM message separately from per-field errors',
        ],
      },
    ],
    nextStep: { label: 'Next: Async validation', route: 'async-username' },
  },
});
