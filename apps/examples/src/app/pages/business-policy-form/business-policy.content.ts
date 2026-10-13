import { defineExampleContent } from '../../shared/example-content';

export const businessPolicyContent = defineExampleContent({
  demonstrates: {
    icon: '📋',
    title: 'What this demonstrates',
    points: [
      'Conditional rules with omitWhen: VAT ID is required only for EU-based business accounts',
      'A cross-field ROOT_FORM policy: a sub-50k-revenue business may not request a credit limit above 10000',
      'Advisory warn() guidance modelled separately from blocking errors — it never prevents submit',
      'Dependency-aware revalidation via createValidationConfig (account/country ↔ VAT ID, revenue ↔ credit limit)',
      'The same suite is plain Vest and unit-testable in isolation, with no Angular dependency',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Errors block, warnings advise',
        points: [
          'Errors gate submission; warn() tests surface guidance without blocking it',
          'A form carrying only warnings still submits successfully',
          'The form-state card shows the two categories side by side',
        ],
      },
      {
        title: 'Expressing policy in Vest',
        points: [
          'omitWhen keeps conditional rules out of the suite entirely until they apply',
          'ROOT_FORM expresses cross-field business policy in one place',
          'createValidationConfig revalidates dependent fields without manual wiring',
        ],
      },
    ],
    nextStep: { label: 'Next: Purchase checkout', route: 'purchase' },
  },
});
