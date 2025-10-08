/**
 * Content configuration for the Zod Basic Schema Integration example.
 *
 * This example demonstrates two-layer validation with Zod as the schema layer
 * and Vest.js for business logic validation.
 */

export const ZOD_BASIC_CONTENT = {
  demonstrated: {
    icon: '🔷',
    title: 'Zod + Vest Two-Layer Validation',
    sections: [
      {
        title: 'Schema Layer (Zod)',
        items: [
          '• <strong>Type safety:</strong> Runtime validation with TypeScript inference',
          '• <strong>Structure validation:</strong> Validates data shape and types',
          '• <strong>Standard Schema:</strong> Implements StandardSchemaV1 interface',
          '• <strong>Runs first:</strong> Blocks Vest validation until schema is valid',
        ],
      },
      {
        title: 'Business Logic Layer (Vest.js)',
        items: [
          '• <strong>Domain rules:</strong> Cross-field, conditional, and async validation',
          '• <strong>Fine-grained control:</strong> Field-level validation with <code class="code-inline">only()</code>',
          '• <strong>Progressive feedback:</strong> Error strategies (immediate, on-touch, on-submit)',
          '• <strong>Warnings:</strong> Non-blocking guidance with <code class="code-inline">warn()</code>',
        ],
      },
    ],
  },

  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Two-Layer Architecture',
        items: [
          '• <strong>Layer 1 (Schema):</strong> Validates types, required fields, formats',
          '• <strong>Layer 2 (Vest):</strong> Validates business rules, relationships, async checks',
          '• <strong>Error merging:</strong> Schema errors appear first, then Vest errors',
          '• <strong>Performance:</strong> Expensive Vest validations skip until schema passes',
        ],
      },
      {
        title: 'Vendor Detection (No Adapters Needed!)',
        items: [
          '• <strong>Simple approach:</strong> <code class="code-inline">schema["~standard"].vendor</code> returns <code class="code-inline">"zod"</code>',
          '• <strong>No type guards:</strong> Adapters are optional - schema works directly!',
          '• <strong>Advanced usage:</strong> Import <code class="code-inline">isZodSchema()</code> for TypeScript narrowing',
          '• <strong>Display vendor:</strong> Show "Zod Errors", "Valibot Errors", etc. in UI',
        ],
      },
      {
        title: 'Why Use Both?',
        items: [
          '• <strong>Ecosystem compatibility:</strong> Zod schemas work with tRPC, TanStack, Hono',
          '• <strong>Framework portability:</strong> Reuse schemas across Angular, React, Vue',
          '• <strong>Type inference:</strong> Single source of truth for TypeScript types',
          '• <strong>Business flexibility:</strong> Vest handles complex, dynamic validation logic',
        ],
      },
    ],
    nextStep: {
      text: 'Explore more advanced schema patterns',
      link: '/schemas/valibot-advanced',
      linkText: 'View Valibot Example →',
    },
  },
} as const;
