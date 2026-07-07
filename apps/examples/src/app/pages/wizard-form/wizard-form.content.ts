import { defineExampleContent } from '../../shared/example-content';

export const wizardContent = defineExampleContent({
  demonstrates: {
    icon: '🧭',
    title: 'What this demonstrates',
    points: [
      'Three independent forms (Account, Profile, Review) each with their own Vest suite and model, coordinated by one page.',
      'Per-step validation gates navigation: a step must be valid before Next advances.',
      'A single final submit re-checks every step together and routes the user to the first invalid step.',
      'Step 1 bidirectional validation: email ↔ confirmEmail and password ↔ confirmPassword.',
      'Step 2 conditional validation: newsletterFrequency is only required when subscribeNewsletter is on (config rebuilt reactively via computed).',
      'Step 3 optional field: comments is optional() but must pass length validation when provided.',
      'Each step exposes isValid()/validatedFields()/pending() so the parent can drive navigation and focus.',
      'Page-owned invalid-submit focus: each step opts out of the built-in focus via [focusFirstInvalidOnSubmit]="false" because the wizard routes to the first invalid step before focusing, with custom NgxFirstInvalidOptions on Step 2.',
      'Step data and validity persist while navigating back and forth.',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Coordinating multiple forms',
        points: [
          'Keep one suite + model per step and lift validity/error signals to the page.',
          'Compute overall readiness (allFormsValid) from per-step validity signals.',
          'Persist step state in the parent so navigation never loses entered data.',
        ],
      },
      {
        title: 'Step validation patterns',
        points: [
          'Use createValidationConfig with bidirectional() for confirmation fields.',
          'Rebuild a validation config inside a computed() for conditional dependencies.',
          'Use Vest optional() so a blank optional field does not block isValid().',
        ],
      },
      {
        title: 'Submission & focus flow',
        points: [
          'Validate the current step on Next, the whole wizard on final submit.',
          'Route to the first invalid step and focus its first invalid control.',
          'Set [focusFirstInvalidOnSubmit]="false" when the page owns focus — otherwise the directive already focuses the first invalid control on submit.',
          'Pass NgxFirstInvalidOptions to tune scroll/focus behavior per step.',
        ],
      },
    ],
    nextStep: { label: 'Next: Purchase checkout', route: 'purchase' },
  },
});
