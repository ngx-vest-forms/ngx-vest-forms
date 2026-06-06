import { defineExampleContent } from '../../shared/example-content';

export const nativeSchemaContent = defineExampleContent({
  demonstrates: {
    icon: '🧬',
    title: 'What this demonstrates',
    points: [
      'A native Vest schema built with enforce.shape(...) and passed directly as the 2nd argument to create((model) => { ... }, schema)',
      'Structural typing for a nested model (firstName, lastName, email, age, address.street/city/zipCode) without an external schema library',
      'enforce.optional() wrappers so focused runs against partial models stay valid while a field is still being typed',
      'Field-level test() callbacks layering business rules (required, email pattern, age 18–120, ZIP 4–6 digits) on top of the schema',
      'Nested address validation declared once in the schema instead of repeated in a separate contract',
      'ngx-vest-forms narrowing the schema per field via suite.only(field).run(model) for safe partial validation',
      'Live form state, warnings, validated fields, and pending status surfaced through createFormFeedbackSignals',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Native Vest schemas',
        points: [
          'Define a structural contract with enforce.shape(...) and nest enforce.shape for sub-objects like address',
          'Pass the schema as the second create() argument so Vest enforces shape and types alongside your tests',
          'Use enforce.optional() so partial models from focused field runs do not fail schema validation prematurely',
        ],
      },
      {
        title: 'Schema vs. business rules',
        points: [
          'Keep the schema for shape/type safety and reserve test() callbacks for user-facing business messages',
          'Bind the schema directly through [formContract] so the example showcases the v3 public API instead of a DI-only pattern',
        ],
      },
    ],
    nextStep: { label: 'Next: Zod schema', route: 'zod-schema-demo' },
  },
});
