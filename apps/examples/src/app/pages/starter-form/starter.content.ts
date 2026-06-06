import { defineExampleContent } from '../../shared/example-content';

export const starterContent = defineExampleContent({
  demonstrates: {
    icon: '🚀',
    title: 'What this demonstrates',
    points: [
      'The minimal end-to-end ngx-vest-forms setup: one ngxVestForm, one Vest suite',
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
          'Why the form value lives in a signal the page owns',
          'How (formValueChange) keeps the model in sync without reactive forms',
          'Where the Vest suite plugs in via the [suite] input',
        ],
      },
      {
        title: 'Copy this baseline',
        points: [
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
