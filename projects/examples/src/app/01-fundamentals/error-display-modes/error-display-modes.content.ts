/**
 * Shared configuration and content for the Error Display Modes example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const ERROR_DISPLAY_MODES_CONTENT = {
  demonstrated: {
    icon: '⚡',
    title: 'Error Display Strategies',
    sections: [
      {
        title: 'V2 Error Strategies',
        items: [
          '• <strong>Form factory:</strong> <code class="code-inline">createVestForm()</code>',
          '• <strong>Error strategies:</strong> <code class="code-inline">ERROR_STRATEGIES</code>',
          '• <strong>Dynamic control:</strong> Built-in strategy switching',
          '• <strong>Field-level control:</strong> <code class="code-inline">form.fieldShowErrors()</code>',
          '• <strong>Enhanced API:</strong> <code class="code-inline">form.fieldErrors()</code>, <code class="code-inline">form.fieldValid()</code>',
        ],
      },
      {
        title: 'Display Strategies Showcased',
        items: [
          '• <strong>immediate:</strong> Show errors as user types',
          '• <strong>on-touch:</strong> Show errors after field interaction (recommended)',
          '• <strong>on-submit:</strong> Show errors only after submit attempt',
          '• <strong>manual:</strong> Full control over error display timing',
          '• <strong>Interactive demo:</strong> Switch strategies dynamically',
        ],
      },
    ],
  },
  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'UX Timing Strategies',
        items: [
          '• <strong>Immediate feedback:</strong> Real-time validation for complex rules',
          '• <strong>Progressive disclosure:</strong> Balancing immediacy vs interruption',
          '• <strong>Accessibility impact:</strong> Screen reader announcements and timing',
          '• <strong>User flow:</strong> Minimizing form abandonment',
        ],
      },
      {
        title: 'Technical Implementation',
        items: [
          '• <strong>Mode switching:</strong> <code class="code-inline">errorDisplayMode</code> input',
          '• <strong>Conditional rendering:</strong> <code class="code-inline">shouldShowErrors()</code> logic',
          '• <strong>State management:</strong> Reactive signals for form state',
          '• <strong>Character counting:</strong> Live feedback with limits',
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
