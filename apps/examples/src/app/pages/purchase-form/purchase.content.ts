import { defineExampleContent } from '../../shared/example-content';

export const purchaseContent = defineExampleContent({
  demonstrates: {
    icon: '🛒',
    title: 'What this demonstrates',
    points: [
      'A full checkout form: identity, age-gated emergency contact, gender, product/quantity, billing & shipping addresses, passwords, and phone numbers',
      'Async uniqueness check on User ID via Vest memo() with an abort-aware request that cancels on signal',
      'Cross-field rules: password ↔ confirm-password match, and a guard that billing and shipping addresses are not identical',
      'Conditional validation with omitWhen: emergency contact under 18, "other" gender detail, justification when quantity exceeds 5, shipping address only when it differs from billing',
      'A ROOT_FORM rule ("Brecht is not 30 anymore") proving form-level validation across multiple fields',
      'Non-blocking password-strength warnings via warn() shown alongside blocking errors',
      'Imperative form helpers: clearFields() to wipe sensitive data, setValueAtPath() to prefill the billing address, and focusFirstInvalidControl() on submit',
      'httpResource-driven "Fetch Luke" data load with Zod-backed response parsing and selectable failure scenarios (404, 401, 500, network) that clear fetched fields on error',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Conditional & cross-field validation',
        points: [
          'Use omitWhen to make whole fields required only under runtime conditions',
          'Wire dependent fields with createValidationConfig().bidirectional() and .whenChanged() so a change re-runs the partner',
          'Build the validationConfig dynamically based on current form values',
        ],
      },
      {
        title: 'Async & ROOT_FORM rules',
        points: [
          'Debounce async validation with NGX_VALIDATION_DEBOUNCE_PRESETS.async',
          'Wrap async tests in Vest memo() and abort in-flight requests via the test signal',
          'Surface form-level (ROOT_FORM) errors separately from field errors',
        ],
      },
      {
        title: 'Programmatic form manipulation',
        points: [
          'clearFields() to reset nested groups like passwords without rebuilding the model',
          'setValueAtPath() to write deep paths such as addresses.billingAddress.street',
          'focusFirstInvalidControl() to drive accessible submit-time navigation',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Submission patterns',
      route: 'submission-patterns',
    },
  },
});
