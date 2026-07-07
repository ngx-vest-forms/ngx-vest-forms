import { defineExampleContent } from '../../shared/example-content';

export const zodSchemaContent = defineExampleContent({
  demonstrates: {
    icon: '🔗',
    title: 'What this demonstrates',
    points: [
      'A Zod schema (z.object) kept alongside a Vest suite as an external structural contract for the same form model',
      'Per-field Vest test() callbacks using enforce for the field-level rules that drive the UI',
      'The same model covered two ways: Zod for structural/type validation, Vest for the form-facing business messages',
      'Nested address validation expressed in both the Zod schema and the Vest suite (street, city, ZIP 4–6 digits)',
      'ngx-vest-forms running focused per-field validation via suite.only(field).run(model)',
      'A deliberate Vest 6.3.x choice: native create(..., schema) flows use n4s/enforce, so the Zod schema stays separate here',
      'Live form state, warnings, validated fields, and pending status via createFormFeedbackSignals',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'External schema + Vest',
        points: [
          'Keep a Zod z.object schema as a shared structural contract without coupling it into the Vest suite',
          'Let Vest test() rules own the per-field UI validation while the Zod schema validates shape/types separately',
          'Understand why Vest 6.3.x prefers n4s/enforce for native create(..., schema) and Zod stays standalone',
        ],
      },
      {
        title: 'Field vs. full runs',
        points: [
          'suite.run(model) executes the whole suite; suite.only(field).run(model) runs only that field’s tests',
          'ngx-vest-forms uses focused runs for per-field feedback, with the Zod schema bound directly via [formContract] for structural checks',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Native Vest schema',
      route: 'native-schema-demo',
    },
  },
});
