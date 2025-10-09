export const FIELD_STATES_CONTENT = {
  demonstrated: {
    icon: '🎯',
    title: 'Field State Management APIs',
    sections: [
      {
        title: 'State Types Demonstrated',
        items: [
          '• <strong>dirty():</strong> Tracks if value changed from initial',
          '• <strong>touched():</strong> Tracks if user interacted (blur)',
          '• <strong>invalid():</strong> Has validation errors',
          '• <strong>valid():</strong> No errors AND no pending validators',
          '• <strong>submittedStatus():</strong> Form submission state',
        ],
      },
      {
        title: 'Programmatic Control',
        items: [
          '• <strong>markAsDirty():</strong> Mark field as modified',
          '• <strong>markAsTouched():</strong> Trigger error display',
          '• <strong>Real-time tracking:</strong> Live state visualization',
          '• <strong>Form-level states:</strong> Aggregate field states',
        ],
      },
    ],
  },
  learning: {
    title: 'Key Concepts & Best Practices',
    sections: [
      {
        title: 'When to Use Each State',
        items: [
          '• <strong>dirty():</strong> Unsaved changes warning, enable save button',
          '• <strong>touched():</strong> Progressive error disclosure (WCAG)',
          '• <strong>invalid():</strong> Error message display',
          '• <strong>!valid():</strong> Submit button disable state',
        ],
      },
      {
        title: 'Critical Distinctions',
        items: [
          '• <strong>invalid() vs !valid():</strong> invalid ignores pending, !valid waits for async',
          '• <strong>dirty() vs touched():</strong> dirty = value changed, touched = user interacted',
          '• <strong>markAsDirty() vs markAsTouched():</strong> Programmatic vs user interaction',
        ],
      },
    ],
    nextStep: {
      text: 'Ready for more complex forms?',
      link: '/fundamentals/form-arrays',
      linkText: 'Explore Form Arrays →',
    },
  },
} as const;
