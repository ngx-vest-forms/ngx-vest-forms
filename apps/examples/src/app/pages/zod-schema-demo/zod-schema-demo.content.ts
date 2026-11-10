import { defineExampleContent } from '../../shared/example-content';

export const zodSchemaContent = defineExampleContent({
  demonstrates: {
    icon: '🔗',
    title: 'What this demonstrates',
    points: [
      'A Zod schema (z.object) bound through [formContract] as the Form Contract: it describes the expected structure of the Form Model, and in development it logs a warning when the value does not match',
      'The Form Contract never changes validity. Only the Vest Suite produces Errors, so the rules live in test() callbacks: required fields, email format, age 18 to 120 and a ZIP code of 4 to 6 digits',
      'Every Zod field is optional because the Form Model is partial while the user types. The schema carries no rules because a Form Contract issue only reaches the console in development and never becomes a field Error',
      'ngx-vest-forms running focused per-field validation via suite.only(field).run(model)',
      'Live form state, warnings, validated fields, and pending status via createFormFeedbackSignals',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'External schema + Vest',
        points: [
          'Use a Zod z.object schema as the Form Contract and keep every rule in the Vest Suite',
          'Know that [formContract] is a development-time check: it logs structure mismatches and never marks a field invalid',
          'For a schema that is part of the Suite, use create(..., enforce.shape(...)) as in the Native Vest Schema demo',
        ],
      },
      {
        title: 'Field vs. full runs',
        points: [
          'suite.run(model) executes the whole suite; suite.only(field).run(model) runs only that field’s tests',
          'ngx-vest-forms uses focused runs for per-field feedback, with the Zod schema bound through [formContract] for the development-time structure check',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Native Vest schema',
      route: 'native-schema-demo',
    },
  },
});
