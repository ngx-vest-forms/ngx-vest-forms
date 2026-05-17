import { defineExampleContent } from '../../shared/example-content';

export const validationConfigDemoContent = defineExampleContent({
  demonstrates: {
    icon: '🔗',
    title: 'What this demonstrates',
    points: [
      'A single createValidationConfig() map declaring every field dependency for the form',
      'bidirectional() pairs: password ↔ confirmPassword, quantity ↔ quantityJustification, and startDate ↔ endDate',
      'whenChanged() one-way triggers: requiresJustification → justification, and country → [state, zipCode]',
      'omitWhen-gated rules that only apply when a dependency is present (conditional justification, location fields, date ordering)',
      'A non-blocking password strength warning (warn()) shown next to blocking length/match errors',
      'Date range cross-field rule: end date must be after start date once both are set',
      'Form-state feedback split into errors, info (date messages), warnings, validated fields, and pending',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'One config map, many dependencies',
        points: [
          'Express all cross-field relationships declaratively with .bidirectional() and .whenChanged()',
          'Let a change to one field automatically revalidate its dependents without manual wiring',
          'Avoid race conditions and redundant validation passes',
        ],
      },
      {
        title: 'Conditional fields',
        points: [
          'Pair omitWhen in the suite with whenChanged in the config so toggled fields revalidate correctly',
          'Drive @if-rendered sections (justification, state/zip) from the same model',
        ],
      },
      {
        title: 'Surfacing feedback',
        points: [
          'Separate informational date messages from blocking errors',
          'Show warn() output independently of errors',
        ],
      },
    ],
    nextStep: { label: 'Next: Display modes', route: 'display-modes-demo' },
  },
});
