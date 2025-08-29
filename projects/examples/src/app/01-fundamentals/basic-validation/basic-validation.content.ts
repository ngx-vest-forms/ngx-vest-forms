/**
 * Shared configuration and content for the Basic Validation example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const BASIC_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '✅',
    title: 'Form Validation Essentials',
    sections: [
      {
        title: 'Validation Rules',
        items: [
          '<strong>Required fields:</strong> Email and name validation',
          '<strong>Format checks:</strong> Email pattern matching',
          '<strong>Custom rules:</strong> Vest.js enforce constraints',
          '<strong>Error timing:</strong> Validation on blur/submit',
        ],
      },
      {
        title: 'User Experience',
        items: [
          'Clear error messages',
          'Accessible error announcements',
          'Visual validation states',
          'Submit button state management',
        ],
      },
    ],
  },
  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Validation Concepts',
        items: [
          'Vest.js validation suites and test functions',
          'Enforce constraints for type-safe validation',
          'Error message customization',
          'Field-level vs form-level validation',
        ],
      },
      {
        title: 'Best Practices',
        items: [
          'Progressive error disclosure',
          'Accessible error handling',
          'Performance optimization with only()',
          'Clear validation feedback',
        ],
      },
    ],
    nextStep: {
      text: 'Want to control when errors appear?',
      link: '/fundamentals/error-display-modes',
      linkText: 'Explore Error Display Modes →',
    },
  },
} as const;
