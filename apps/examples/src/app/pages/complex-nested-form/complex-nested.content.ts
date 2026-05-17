import { defineExampleContent } from '../../shared/example-content';

export const complexNestedContent = defineExampleContent({
  demonstrates: {
    icon: '🧩',
    title: 'What this demonstrates',
    points: [
      'Deep ngModelGroup nesting: company → company.address driven by the reusable ngx-address',
      'Reusable child sections (ngx-address, ngx-team-member) registering into one parent form tree via vestFormsViewProviders',
      'A dynamic, repeatable teamMembers collection stored as an id-keyed record',
      'Add/remove rows that mutate the keyed record immutably and emit (formValueChange)',
      'Validation refreshing correctly after a structural change — removed rows drop their tests',
      'A ROOT_FORM rule ("At least one team member is required") plus a warn() advisory for large teams',
      'Decomposition into deep modules: model, suite, child component, form-body, and page',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Composing nested groups',
        points: [
          'How vestFormsViewProviders lets a child component register controls into the parent ngModelGroup',
          'Why ngx-address can be reused under company.address with no extra wiring',
          'Keeping child component contracts tiny: just an input() for the value and an id prefix',
        ],
      },
      {
        title: 'Repeatable rows that validate',
        points: [
          'Why stable, never-reused keys keep Vest field paths fixed across add/remove',
          'Mutating a keyed record immutably and emitting it through (formValueChange)',
          'Letting a removed row clear its own validation simply by disappearing from the model',
        ],
      },
      {
        title: 'Form-level rules',
        points: [
          'Using ROOT_FORM to require at least one member',
          'Adding a non-blocking warn() advisory for oversized teams',
        ],
      },
    ],
    nextStep: { label: 'Next: Business policy', route: 'business-policy' },
  },
});
