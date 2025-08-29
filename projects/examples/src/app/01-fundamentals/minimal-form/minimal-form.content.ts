/**
 * Shared configuration and content for the Minimal Form example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const MINIMAL_FORM_CONTENT = {
  demonstrated: {
    icon: '🏁',
    title: 'Minimal ngx-vest-forms Setup',
    sections: [
      {
        title: 'Core Components',
        items: [
          '<strong>Form directive:</strong> <code>ngxVestForm</code>',
          '<strong>Two-way binding:</strong> <code>[(formValue)]</code>',
          '<strong>Validation suite:</strong> Vest.js integration',
          '<strong>Control wrapper:</strong> Built-in error display',
        ],
      },
      {
        title: 'Key Features',
        items: [
          'Signal-based reactive state',
          'Template-driven forms approach',
          'Automatic error handling',
          'Type-safe form data',
        ],
      },
    ],
  },
  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Core Concepts',
        items: [
          'Signal-based form state management',
          'Template-driven forms with validation',
          'Separation of concerns (model, validation, template)',
          'Type safety throughout the form lifecycle',
        ],
      },
      {
        title: 'Building Blocks',
        items: [
          'Vest.js validation suites with staticSuite',
          'Angular signals for reactive state',
          'NgxVestForm directive integration',
          'Control wrapper for consistent UI',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to add custom validation rules?',
      link: '/fundamentals/basic-validation',
      linkText: 'Try Basic Validation →',
    },
  },
} as const;
