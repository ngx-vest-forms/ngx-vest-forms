/**
 * Shared configuration and content for the Basic Validation example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const BASIC_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '✅',
    title: 'Comprehensive Form Validation',
    sections: [
      {
        title: 'V2 Core Features',
        items: [
          '• <strong>Form factory:</strong> <code class="code-inline">createVestForm()</code>',
          '• <strong>Enhanced Field Signals:</strong> <code class="code-inline">form.name()</code>, <code class="code-inline">form.nameValid()</code>',
          '• <strong>Native HTML:</strong> <code class="code-inline">[value]</code> and <code class="code-inline">(input)</code> bindings',
          '• <strong>Conditional rendering:</strong> <code class="code-inline">@if</code> for dynamic fields',
          '• <strong>Async validation:</strong> Built-in async field validation with memoization',
        ],
      },
      {
        title: 'Validation Rules Showcased',
        items: [
          '• <strong>Required fields:</strong> Name, email, age, role, terms',
          '• <strong>Format validation:</strong> Email pattern matching',
          '• <strong>Range validation:</strong> Age between 18-120',
          '• <strong>Conditional fields:</strong> Bio appears for senior roles only',
          '• <strong>Boolean validation:</strong> Terms agreement required',
          '• <strong>Async validation:</strong> Email uniqueness check with server simulation',
        ],
      },
    ],
  },
  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Vest.js Validation Patterns',
        items: [
          '• <strong>Test functions:</strong> <code class="code-inline">test()</code> for field validation',
          '• <strong>Enforce constraints:</strong> <code class="code-inline">enforce().isNotEmpty()</code>',
          '• <strong>Performance:</strong> <code class="code-inline">only(field)</code> optimization',
          '• <strong>Conditional logic:</strong> <code class="code-inline">omitWhen()</code> for dynamic rules',
        ],
      },
      {
        title: 'UX Best Practices',
        items: [
          '• <strong>Progressive disclosure:</strong> Show errors after user interaction',
          '• <strong>Accessibility:</strong> ARIA attributes and screen reader support',
          '• <strong>Clear messaging:</strong> User-friendly error descriptions',
          '• <strong>Visual feedback:</strong> Form state and submit button management',
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
