/**
 * Educational content for the Rule Composition example.
 * Used by ExampleCardsComponent to maintain consistent educational content
 * structure across all ngx-vest-forms examples.
 */

export const RULE_COMPOSITION_CONTENT = {
  demonstrated: {
    icon: '🔧',
    title: 'Advanced Rule Composition Patterns',
    sections: [
      {
        title: 'Validation Libraries',
        items: [
          '<strong>Reusable email rules</strong> - Domain validation and business rules',
          '<strong>Password composition</strong> - Configurable strength levels',
          '<strong>Phone validation</strong> - Country-specific patterns',
          '<strong>URL security rules</strong> - Protocol and domain validation',
        ],
      },
      {
        title: 'Composition Techniques',
        items: [
          '<strong>Rule factories</strong> - Parameterized validation builders',
          '<strong>Rule combiners</strong> - Logical composition patterns',
          '<strong>Cross-field rules</strong> - Inter-dependent validation',
          '<strong>Async composition</strong> - Complex async validation chains',
        ],
      },
      {
        title: 'Advanced Features',
        items: [
          '<strong>ValidationComposer class</strong> - Object-oriented rule building',
          '<strong>Conditional validation</strong> - Dynamic rule application',
          '<strong>Security-focused rules</strong> - Enterprise validation patterns',
          '<strong>Type-safe chaining</strong> - TypeScript-first composition',
        ],
      },
      {
        title: 'Real-world Patterns',
        items: [
          '<strong>Corporate email validation</strong> - Business domain rules',
          '<strong>Security settings forms</strong> - Multi-level validation',
          '<strong>Dynamic validation rules</strong> - Runtime rule composition',
          '<strong>Centralized rule libraries</strong> - Shared validation logic',
        ],
      },
    ],
  },
  learning: {
    title: 'Master Advanced Validation Patterns',
    sections: [
      {
        title: 'Core Concepts',
        items: [
          'Understanding <code>enforce</code> rule composition',
          'Building reusable validation libraries',
          'Creating parameterized validation factories',
          'Implementing cross-field validation logic',
        ],
      },
      {
        title: 'Implementation Skills',
        items: [
          'Designing type-safe validation APIs',
          'Composing async validation rules',
          'Building conditional validation logic',
          'Creating validation rule builders',
        ],
      },
      {
        title: 'Architecture Patterns',
        items: [
          'Organizing validation rules in libraries',
          'Implementing validation rule inheritance',
          'Building validation DSLs with TypeScript',
          'Creating enterprise validation frameworks',
        ],
      },
      {
        title: 'Best Practices',
        items: [
          'Performance optimization for complex rules',
          'Error message composition strategies',
          'Testing complex validation logic',
          'Maintaining validation rule documentation',
        ],
      },
    ],
    nextStep: {
      text: 'Ready for real-world applications? Explore',
      link: '/server-side-validation',
      linkText: 'Server-Side Validation Patterns →',
    },
  },
} as const;
