import type { ExampleContent } from '../../shared/form-example.types';

/**
 * Content for Schema Integration Comparison Example
 */
export const SCHEMA_COMPARISON_CONTENT: ExampleContent = {
  title: 'Schema Integration Showcase',
  description:
    'Explore how different schema libraries integrate with ngx-vest-forms',

  demonstrated: {
    icon: '🔀',
    title: 'Schema Integration Features',
    sections: [
      {
        title: 'ngx-vest-forms Features',
        items: [
          '• <strong>Schema directive:</strong> <code class="code-inline">ngxVestFormWithSchema</code>',
          '• <strong>Schema binding:</strong> <code class="code-inline">[formSchema]</code>',
          '• <strong>Validation suite:</strong> <code class="code-inline">[vestSuite]</code>',
          '• <strong>Data binding:</strong> <code class="code-inline">[(formValue)]</code>',
          '• <strong>Control wrapper:</strong> <code class="code-inline">&lt;ngx-control-wrapper&gt;</code>',
        ],
      },
      {
        title: 'Schema Libraries Showcased',
        items: [
          '• <strong>Zod:</strong> TypeScript-first with static type inference (~13.5kB)',
          '• <strong>Valibot:</strong> Modular and lightweight with tree-shaking (~2.8kB)',
          '• <strong>ArkType:</strong> Runtime validation with advanced features (~7.2kB)',
          '• <strong>Custom:</strong> Lightweight implementation using ngxModelToStandardSchema (~0.5kB)',
          '• <strong>Dynamic switching:</strong> Live comparison between libraries',
        ],
      },
    ],
  },

  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Schema Selection Guide',
        items: [
          '• <strong>Zod:</strong> Popular choice with excellent DX and ecosystem',
          '• <strong>Valibot:</strong> Best for bundle size optimization and performance',
          '• <strong>ArkType:</strong> Advanced type features and runtime validation',
          '• <strong>Custom:</strong> Minimal dependencies for simple validation needs',
        ],
      },
      {
        title: 'Dual Validation Strategy',
        items: [
          '• <strong>Vest for UX:</strong> Interactive field-level validation feedback',
          '• <strong>Schema for integrity:</strong> Data shape validation and type safety',
          '• <strong>Optimal experience:</strong> Best of both validation approaches',
          '• <strong>Team collaboration:</strong> Shared validation between frontend/backend',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to implement schema validation in your project?',
      route: '/docs/schema-integration',
      label: 'Read the Schema Integration Guide →',
    },
  },
};
