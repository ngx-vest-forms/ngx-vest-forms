/**
 * Shared configuration and content for the Error Display Modes example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const ERROR_DISPLAY_MODES_CONTENT = {
  demonstrated: {
    icon: '⚡',
    title: 'Error Display Control',
    sections: [
      {
        title: 'Display Modes',
        items: [
          '<strong>onBlur:</strong> Errors after field loses focus',
          '<strong>onSubmit:</strong> Errors only after submit attempt',
          '<strong>immediate:</strong> Real-time error feedback',
          '<strong>disabled:</strong> No automatic error display',
        ],
      },
      {
        title: 'Interactive Features',
        items: [
          'Dynamic mode switching',
          'Live error state updates',
          'Form state visualization',
          'User experience comparison',
        ],
      },
    ],
  },
  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'UX Considerations',
        items: [
          'Error timing impact on user experience',
          'Balancing immediacy vs interruption',
          'Accessibility implications of error display',
          'Form usability best practices',
        ],
      },
      {
        title: 'Technical Implementation',
        items: [
          'NgxFormErrorDisplayDirective configuration',
          'Dynamic error display mode switching',
          'Form state management with signals',
          'Conditional template rendering',
        ],
      },
    ],
    nextStep: {
      text: 'Ready for more advanced patterns?',
      link: '/advanced-forms',
      linkText: 'Explore Advanced Forms →',
    },
  },
} as const;
