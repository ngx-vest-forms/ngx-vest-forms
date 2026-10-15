import { defineExampleContent } from '../../shared/example-content';

export const conditionalStructureContent = defineExampleContent({
  demonstrates: {
    icon: '🧹',
    title: 'What this demonstrates',
    points: [
      'clearFieldsWhen() removes stale values when a conditional input disappears or becomes irrelevant.',
      'keepFieldsWhen() derives a backend-ready payload preview that keeps only the fields the current branch actually uses.',
      'Switching branches through the delivery select is a normal value change, so validation reruns without triggerFormValidation().',
      'Vest omitWhen() keeps the suite aligned with the same delivery-mode branching used by the template.',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Conditional inputs without stale state',
        points: [
          'Use clearFieldsWhen() when switching branches so hidden fields do not keep old values.',
          'Pair the same branch logic with omitWhen() so the suite and the UI agree.',
          'Call triggerFormValidation() only when a control is replaced by static content and no control value changes.',
        ],
      },
      {
        title: 'Payload shaping',
        points: [
          'Use keepFieldsWhen() to build the exact payload you would send to a backend.',
          'Preview the shaped payload while editing so the behavior is easy to inspect and test.',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Submission patterns',
      route: 'submission-patterns',
    },
  },
});
