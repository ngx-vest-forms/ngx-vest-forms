/**
 * Shared configuration and content for the Form State Demo example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

/**
 * Shared configuration and content for the Form State Demo example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const FORM_STATE_DEMO_CONTENT = {
  demonstrated: {
    icon: '📊',
    title: 'Form State Monitoring',
    sections: [
      {
        title: 'ngx-vest-forms Features',
        items: [
          '• <strong>Form directive:</strong> <code class="code-inline">ngxVestForm</code>',
          '• <strong>State monitoring:</strong> <code class="code-inline">formState()</code>',
          '• <strong>Real-time updates:</strong> <code class="code-inline">computed()</code> signals',
          '• <strong>Async validation:</strong> <code class="code-inline">pending</code> state tracking',
          '• <strong>Performance metrics:</strong> Validation timing display',
        ],
      },
      {
        title: 'Validation Rules Showcased',
        items: [
          '• <strong>Username availability:</strong> Async remote validation',
          '• <strong>Password strength:</strong> Complex validation rules',
          '• <strong>Cross-field validation:</strong> Password confirmation',
          '• <strong>Email format:</strong> Pattern matching with feedback',
          '• <strong>Real-time feedback:</strong> Immediate state updates',
        ],
      },
      {
        title: 'State Properties Monitored',
        items: [
          '• <strong>Validity:</strong> <code class="code-inline">valid</code>, <code class="code-inline">invalid</code>, <code class="code-inline">pending</code>',
          '• <strong>User interaction:</strong> <code class="code-inline">dirty</code>, <code class="code-inline">submitted</code>',
          '• <strong>Error tracking:</strong> <code class="code-inline">errorCount</code>, <code class="code-inline">firstInvalidField</code>',
          '• <strong>Value access:</strong> Complete form model in <code class="code-inline">value</code>',
          '• <strong>Form status:</strong> <code class="code-inline">status</code> enumeration',
        ],
      },
    ],
  },
  learning: {
    title: 'Key Benefits Demonstrated',
    sections: [
      {
        title: 'Real-time State Monitoring',
        items: [
          '• Complete visibility into form state changes',
          '• Async validation progress tracking',
          '• Performance metrics for optimization',
          '• Visual indicators for all state properties',
        ],
      },
      {
        title: 'Advanced Validation Patterns',
        items: [
          '• Server-side validation with cancellation',
          '• Cross-field dependency validation',
          '• Progressive validation complexity',
          '• Error aggregation and reporting',
        ],
      },
      {
        title: 'Developer Experience',
        items: [
          '• Zero boilerplate for complex forms',
          '• Type-safe validation suites',
          '• Signal-based reactive programming',
          '• Comprehensive debugging information',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to explore dynamic error display modes?',
      link: '/fundamentals/error-display-modes',
      linkText: 'Try Error Display Modes →',
    },
  },
} as const;
