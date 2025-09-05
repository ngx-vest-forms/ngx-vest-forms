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
        title: 'ngx-vest-forms Features',
        items: [
          '• <strong>Form directive:</strong> <code class="code-inline">ngxVestForm</code>',
          '• <strong>Error timing:</strong> <code class="code-inline">NgxErrorDisplayMode</code>',
          '• <strong>Dynamic control:</strong> <code class="code-inline">[errorDisplayMode]</code>',
          '• <strong>Error display:</strong> <code class="code-inline">ngxFormErrorDisplay</code>',
          '• <strong>State tracking:</strong> <code class="code-inline">shouldShowErrors()</code>',
        ],
      },
      {
        title: 'Display Modes Showcased',
        items: [
          '• <strong>On Blur:</strong> Errors after field loses focus',
          '• <strong>On Submit:</strong> Errors only after submit attempt',
          '• <strong>On Blur or Submit:</strong> Flexible timing (recommended)',
          '• <strong>Interactive demo:</strong> Switch modes dynamically',
          '• <strong>Form-level errors:</strong> Summary on submit attempts',
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
