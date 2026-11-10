import { defineExampleContent } from '../../shared/example-content';

export const starterContent = defineExampleContent({
  demonstrates: {
    icon: '🚀',
    title: 'What this demonstrates',
    points: [
      'The minimal end-to-end setup: one component file plus one Vest suite file',
      'Template-driven fields bound with [ngModel] inside ngx-control-wrapper',
      'A typed NgxDeepPartial model plus a form contract via provideFormContract',
      'On-blur error display with a non-blocking warning that never blocks submit',
      'Reading packaged form state with createFormFeedbackSignals',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'The canonical wiring',
        points: [
          'Why the form value lives in a signal the form component owns',
          'How (formValueChange) keeps the model in sync without reactive forms',
          'Where the Vest suite plugs in via the [suite] input',
        ],
      },
      {
        title: 'Copy this baseline',
        points: [
          'Copy starter.form.ts and starter.validations.ts; nothing else is needed',
          'Every public symbol used here is part of the supported API surface',
          'Suites are plain Vest specs you can unit-test without rendering',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Async username validation',
      route: 'async-username',
    },
  },
});
